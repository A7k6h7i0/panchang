import 'dart:async';
import 'dart:convert';
import 'dart:io' show Platform;

import 'package:alarm/alarm.dart';
import 'package:flutter/cupertino.dart';
import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_compass/flutter_compass.dart';
import 'package:geolocator/geolocator.dart';
import 'package:panchang_flutter/data/app_info.dart';
import 'package:panchang_flutter/data/legal_texts.dart';
import 'package:panchang_flutter/presentation/content_screen.dart';
import 'package:webview_flutter/webview_flutter.dart';

class WebViewScreen extends StatefulWidget {
  const WebViewScreen({super.key, required this.url});
  final String url;

  @override
  WebViewScreenState createState() => WebViewScreenState();
}

class WebViewScreenState extends State<WebViewScreen>
    with SingleTickerProviderStateMixin {
  late WebViewController controller;
  bool isLoading = true;
  StreamSubscription<CompassEvent>? _compassSubscription;
  static const platform = MethodChannel('panchang/app');

  @override
  void initState() {
    super.initState();
    _initWebView();
  }

  void _startCompass() {
    if (_compassSubscription != null) return;
    _compassSubscription = FlutterCompass.events?.listen((CompassEvent event) {
      final heading = event.heading;
      if (heading != null && mounted && !isLoading) {
        controller.runJavaScript(
          'if (window.updateNativeCompass) window.updateNativeCompass($heading);',
        );
      }
    });
  }

  void _stopCompass() {
    _compassSubscription?.cancel();
    _compassSubscription = null;
  }

  Future<void> _handleLocationRequest() async {
    bool serviceEnabled;
    LocationPermission permission;

    serviceEnabled = await Geolocator.isLocationServiceEnabled();
    if (!serviceEnabled) {
      if (mounted) {
        controller.runJavaScript(
          "if (window.onNativeLocationError) window.onNativeLocationError('Location services are disabled.');",
        );
      }
      return;
    }

    permission = await Geolocator.checkPermission();
    if (permission == LocationPermission.denied) {
      permission = await Geolocator.requestPermission();
      if (permission == LocationPermission.denied) {
        if (mounted) {
          controller.runJavaScript(
            "if (window.onNativeLocationError) window.onNativeLocationError('Location permissions are denied.');",
          );
        }
        return;
      }
    }

    if (permission == LocationPermission.deniedForever) {
      if (mounted) {
        controller.runJavaScript(
          "if (window.onNativeLocationError) window.onNativeLocationError('Location permissions are permanently denied, we cannot request permissions. Please enable in settings.');",
        );
      }
      return;
    }

    try {
      Position position = await Geolocator.getCurrentPosition(
        locationSettings: const LocationSettings(
          accuracy: LocationAccuracy.best,
        ),
      );
      if (mounted) {
        controller.runJavaScript(
          "if (window.receiveNativeLocation) window.receiveNativeLocation(${position.latitude}, ${position.longitude});",
        );
      }
    } catch (e) {
      if (mounted) {
        controller.runJavaScript(
          "if (window.onNativeLocationError) window.onNativeLocationError('Failed to get location: $e');",
        );
      }
    }
  }

  Future<void> _handleSetAlarm(Map<String, dynamic> data) async {
    try {
      final int id =
          data['uid'] ?? DateTime.now().millisecondsSinceEpoch % 10000;
      final String timeString =
          data['time']; // expected format "HH:mm" (24h) or ISO string
      final String message = data['message'] ?? 'Time for your Muhurta';

      DateTime alarmTime;
      if (timeString.contains('T')) {
        alarmTime = DateTime.parse(timeString);
      } else {
        // Handle "HH:mm" or "h:mm AM/PM"
        final now = DateTime.now();
        int hour = 0;
        int minute = 0;

        final timeRegex = RegExp(
          r'(\d{1,2})[:.](\d{2})\s*(AM|PM)?',
          caseSensitive: false,
        );
        final match = timeRegex.firstMatch(timeString);

        if (match != null) {
          hour = int.parse(match.group(1)!);
          minute = int.parse(match.group(2)!);
          final String? amPm = match.group(3);

          if (amPm != null) {
            if (amPm.toUpperCase() == 'PM' && hour < 12) hour += 12;
            if (amPm.toUpperCase() == 'AM' && hour == 12) hour = 0;
          }
        } else {
          throw FormatException("Unsupported time format: $timeString");
        }

        alarmTime = DateTime(now.year, now.month, now.day, hour, minute);

        if (alarmTime.isBefore(now)) {
          alarmTime = alarmTime.add(const Duration(days: 1));
        }
      }

      final alarmSettings = AlarmSettings(
        id: id,
        dateTime: alarmTime,
        assetAudioPath:
            'assets/audio/pre_alert.mp3', // Using a default valid path or your provided audio
        loopAudio: false,
        vibrate: true,
        volumeSettings: VolumeSettings.fade(
          volume: 0.8,
          fadeDuration: const Duration(seconds: 3),
        ),
        notificationSettings: NotificationSettings(
          title: 'Panchang Alert',
          body: message,
          stopButton: 'Stop',
          icon: 'notification_icon', // Android specific
        ),
      );

      await Alarm.set(alarmSettings: alarmSettings);
      debugPrint('Alarm $id set for $alarmTime');
    } catch (e) {
      debugPrint('Failed to set alarm: $e');
    }
  }

  Future<void> _handleCancelAlarms() async {
    await Alarm.stopAll();
    debugPrint('All alarms cancelled');
  }

  @override
  void dispose() {
    _stopCompass();
    super.dispose();
  }

  void _initWebView() {
    controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setBackgroundColor(const Color(0x00000000))
      ..addJavaScriptChannel(
        'CompassControl',
        onMessageReceived: (JavaScriptMessage message) {
          if (message.message == 'start') {
            _startCompass();
          } else if (message.message == 'stop') {
            _stopCompass();
          }
        },
      )
      ..addJavaScriptChannel(
        'NativeApp',
        onMessageReceived: (JavaScriptMessage message) {
          try {
            debugPrint("JS NativeApp MSG: ${message.message}");
            final data = jsonDecode(message.message);
            final String action = data['action'];

            if (action == 'requestLocation') {
              _handleLocationRequest();
            } else if (action == 'setAlarm') {
              _handleSetAlarm(data);
            } else if (action == 'cancelAlarms') {
              _handleCancelAlarms();
            }
          } catch (e) {
            debugPrint('Failed to parse NativeApp message: $e');
          }
        },
      )
      ..setNavigationDelegate(
        NavigationDelegate(
          onProgress: (int progress) {
            if (progress == 100 && mounted) {
              setState(() {
                isLoading = false;
              });
            }
          },
          onPageStarted: (String url) {
            if (mounted) {
              setState(() {
                isLoading = true;
              });
            }
          },
          onPageFinished: (String url) {
            if (mounted) {
              setState(() {
                isLoading = false;
              });
            }
          },
          onNavigationRequest: (NavigationRequest request) {
            return NavigationDecision.navigate;
          },
          onWebResourceError: (WebResourceError error) {},
        ),
      )
      ..loadRequest(Uri.parse(widget.url));
  }

  Future<void> _refreshWebView() async {
    await controller.reload();
  }

  Future<void> _showExitConfirmationDialog() async {
    return showDialog<void>(
      context: context,
      barrierDismissible: false, // user must tap button!
      builder: (BuildContext context) {
        return AlertDialog(
          title: const Text('Exit App'),
          content: const Text('Do you want to exit the app?'),
          actions: <Widget>[
            TextButton(
              child: const Text('No'),
              onPressed: () {
                Navigator.of(context).pop();
              },
            ),
            TextButton(
              child: const Text('Yes'),
              onPressed: () async {
                Navigator.of(context).pop();
                try {
                  await platform.invokeMethod('finishAndRemoveTask');
                } on PlatformException catch (_) {
                  SystemNavigator.pop();
                }
              },
            ),
          ],
        );
      },
    );
  }

  void _showIosMenu(BuildContext context) {
    showCupertinoModalPopup<void>(
      context: context,
      builder: (BuildContext context) => CupertinoActionSheet(
        title: const Text('Menu Options'),
        actions: <CupertinoActionSheetAction>[
          CupertinoActionSheetAction(
            onPressed: () {
              Navigator.pop(context);
              setState(() {
                isLoading = true;
                _initWebView();
              });
            },
            child: const Text('Home'),
          ),
          CupertinoActionSheetAction(
            onPressed: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const ContentScreen(
                    title: 'Privacy Policy',
                    content: LegalTexts.privacyPolicy,
                  ),
                ),
              );
            },
            child: const Text('Privacy Policy'),
          ),
          CupertinoActionSheetAction(
            onPressed: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const ContentScreen(
                    title: 'Terms & Conditions',
                    content: LegalTexts.termsAndConditions,
                  ),
                ),
              );
            },
            child: const Text('Terms & Conditions'),
          ),
          CupertinoActionSheetAction(
            onPressed: () {
              Navigator.pop(context);
              Navigator.push(
                context,
                MaterialPageRoute(
                  builder: (_) => const ContentScreen(
                    title: 'Disclaimer',
                    content: LegalTexts.disclaimer,
                  ),
                ),
              );
            },
            child: const Text('Disclaimer'),
          ),
          if (Platform.isAndroid)
            CupertinoActionSheetAction(
              isDestructiveAction: true,
              onPressed: () {
                Navigator.pop(context);
                _showExitConfirmationDialog();
              },
              child: const Text('Exit App'),
            ),
        ],
        cancelButton: CupertinoActionSheetAction(
          isDefaultAction: true,
          onPressed: () {
            Navigator.pop(context);
          },
          child: const Text('Cancel'),
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    // FirebaseAuth.instance.signOut();
    return PopScope(
      canPop: false,
      onPopInvokedWithResult: (bool didPop, _) async {
        if (didPop) {
          return;
        }

        if (await controller.canGoBack()) {
          controller.goBack();
        } else {
          if (Platform.isAndroid) {
            _showExitConfirmationDialog();
          }
        }
      },
      child: Scaffold(
        appBar: AppBar(
          centerTitle: true,
          elevation: 0,
          backgroundColor: Theme.of(
            context,
          ).scaffoldBackgroundColor.withValues(alpha: 0.95),
          surfaceTintColor: Colors.transparent,
          leading: Image.asset('assets/logo.png'),
          title: const Text(
            AppInfo.appName,
            style: TextStyle(fontWeight: FontWeight.w600),
          ),
          actions: [
            IconButton(
              icon: const Icon(CupertinoIcons.ellipsis_circle),
              onPressed: () => _showIosMenu(context),
            ),
          ],
        ),
        body: SafeArea(
          child: RefreshIndicator(
            onRefresh: _refreshWebView,
            child: Stack(
              children: [
                WebViewWidget(controller: controller),
                if (isLoading) const Center(child: CircularProgressIndicator()),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
