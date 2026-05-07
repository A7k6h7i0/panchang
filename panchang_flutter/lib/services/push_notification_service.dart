import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:device_info_plus/device_info_plus.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/foundation.dart';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:package_info_plus/package_info_plus.dart';
import 'package:permission_handler/permission_handler.dart';
import 'package:panchang_flutter/data/app_info.dart';
import 'package:panchang_flutter/firebase_options.dart';

const AndroidNotificationChannel _pushNotificationChannel =
    AndroidNotificationChannel(
  'panchang_push_channel',
  'Push Notifications',
  description: 'Notifications delivered from the Panchang backend',
  importance: Importance.high,
);

const InitializationSettings _localNotificationSettings =
    InitializationSettings(
  android: AndroidInitializationSettings('notification_icon'),
);

@pragma('vm:entry-point')
Future<void> firebaseMessagingBackgroundHandler(RemoteMessage message) async {
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);

  if (message.notification != null) {
    return;
  }

  final plugin = FlutterLocalNotificationsPlugin();
  await _initializeLocalNotificationsPlugin(plugin);
  await _showLocalNotification(plugin, message);
}

class PushNotificationService {
  PushNotificationService._();

  static final PushNotificationService instance = PushNotificationService._();

  final FirebaseMessaging _messaging = FirebaseMessaging.instance;
  final FlutterLocalNotificationsPlugin _localNotifications =
      FlutterLocalNotificationsPlugin();
  final DeviceInfoPlugin _deviceInfoPlugin = DeviceInfoPlugin();

  final StreamController<Uri?> _launchUriController =
      StreamController<Uri?>.broadcast();

  bool _initialized = false;
  Uri? _pendingLaunchUri;

  Uri? get pendingLaunchUri => _pendingLaunchUri;

  Stream<Uri?> get launchUriStream => _launchUriController.stream;

  Future<void> initialize() async {
    if (_initialized) {
      return;
    }
    _initialized = true;

    await _requestPermission();
    await _initializeLocalNotifications();

    final launchDetails = await _localNotifications.getNotificationAppLaunchDetails();
    if (launchDetails?.didNotificationLaunchApp ?? false) {
      final payload = launchDetails?.notificationResponse?.payload;
      final uri = _uriFromPayload(payload);
      if (uri != null) {
        _publishLaunchUri(uri);
      }
    }

    FirebaseMessaging.onMessage.listen(_handleForegroundMessage);
    FirebaseMessaging.onMessageOpenedApp.listen(_handleMessageTap);
    _messaging.onTokenRefresh.listen((token) {
      unawaited(_registerToken(token));
    });

    final initialMessage = await _messaging.getInitialMessage();
    if (initialMessage != null) {
      _handleMessageTap(initialMessage);
    }

    final token = await _messaging.getToken();
    if (token != null && token.isNotEmpty) {
      unawaited(_registerToken(token));
    }
  }

  Future<void> _requestPermission() async {
    if (Platform.isAndroid) {
      final status = await Permission.notification.request();
      debugPrint('Push notification permission: $status');
    }
  }

  Future<void> _initializeLocalNotifications() async {
    await _initializeLocalNotificationsPlugin(_localNotifications);
  }

  Future<void> _handleForegroundMessage(RemoteMessage message) async {
    final notification = message.notification;
    if (notification == null) {
      return;
    }

    await _showLocalNotification(_localNotifications, message);
  }

  void _handleMessageTap(RemoteMessage message) {
    final uri = _uriFromMessage(message);
    if (uri != null) {
      _publishLaunchUri(uri);
    }
  }

  void _publishLaunchUri(Uri uri) {
    _pendingLaunchUri = uri;
    _launchUriController.add(uri);
  }

  Uri? _uriFromPayload(String? payload) {
    if (payload == null || payload.isEmpty) {
      return null;
    }

    try {
      final data = jsonDecode(payload);
      if (data is Map<String, dynamic>) {
        return _uriFromData(data);
      }
    } catch (_) {
      return null;
    }

    return null;
  }

  Uri? _uriFromMessage(RemoteMessage message) {
    return _uriFromData(message.data);
  }

  Uri? _uriFromData(Map<String, dynamic> data) {
    final candidates = [
      data['url'],
      data['deep_link'],
      data['deeplink'],
      data['link'],
      data['targetUrl'],
    ];

    for (final candidate in candidates) {
      final rawUrl = candidate?.toString().trim();
      if (rawUrl != null && rawUrl.isNotEmpty) {
        try {
          return Uri.parse(rawUrl);
        } catch (_) {
          return null;
        }
      }
    }

    return null;
  }

  Future<void> _registerToken(String token) async {
    try {
      final packageInfo = await PackageInfo.fromPlatform();
      final deviceMetadata = await _collectDeviceMetadata();
      final user = FirebaseAuth.instance.currentUser;

      final payload = <String, dynamic>{
        'token': token,
        'platform': Platform.operatingSystem,
        'source': 'flutter_fcm',
        'userId': user?.uid,
        'userEmail': user?.email,
        'appVersion': '${packageInfo.version}+${packageInfo.buildNumber}',
        'appName': packageInfo.appName,
        ...deviceMetadata,
      };

      await _postJson(AppInfo.pushRegisterEndpoint, payload);
      debugPrint('Push token registered successfully.');
    } catch (error) {
      debugPrint('Failed to register push token: $error');
    }
  }

  Future<Map<String, dynamic>> _collectDeviceMetadata() async {
    try {
      if (Platform.isAndroid) {
        final androidInfo = await _deviceInfoPlugin.androidInfo;
        return {
          'deviceModel': androidInfo.model,
          'deviceBrand': androidInfo.brand,
          'deviceManufacturer': androidInfo.manufacturer,
          'osVersion': 'Android ${androidInfo.version.release}',
        };
      }

      if (Platform.isIOS) {
        final iosInfo = await _deviceInfoPlugin.iosInfo;
        return {
          'deviceModel': iosInfo.utsname.machine,
          'deviceBrand': 'Apple',
          'deviceManufacturer': 'Apple',
          'osVersion': 'iOS ${iosInfo.systemVersion}',
        };
      }
    } catch (error) {
      debugPrint('Failed to read device metadata: $error');
    }

    return <String, dynamic>{};
  }

  Future<void> _postJson(Uri uri, Map<String, dynamic> payload) async {
    final client = HttpClient();
    try {
      final request = await client.postUrl(uri);
      request.headers.contentType = ContentType.json;
      request.add(utf8.encode(jsonEncode(payload)));

      final response = await request.close();
      final body = await response.transform(utf8.decoder).join();

      if (response.statusCode < 200 || response.statusCode >= 300) {
        throw HttpException(
          'Push registration failed (${response.statusCode}): $body',
          uri: uri,
        );
      }
    } finally {
      client.close(force: true);
    }
  }
}

Future<void> _initializeLocalNotificationsPlugin(
  FlutterLocalNotificationsPlugin plugin,
) async {
  await plugin.initialize(
    settings: _localNotificationSettings,
    onDidReceiveNotificationResponse: (response) {
      final uri = _uriFromPayload(response.payload);
      if (uri != null) {
        PushNotificationService.instance._publishLaunchUri(uri);
      }
    },
  );

  final androidPlugin = plugin.resolvePlatformSpecificImplementation<
      AndroidFlutterLocalNotificationsPlugin>();
  await androidPlugin?.createNotificationChannel(_pushNotificationChannel);
}

Future<void> _showLocalNotification(
  FlutterLocalNotificationsPlugin plugin,
  RemoteMessage message,
) async {
  final notification = message.notification;
  final dataTitle = message.data['title']?.toString().trim();
  final dataBody =
      message.data['body']?.toString().trim() ??
      message.data['message']?.toString().trim();

  final title = (notification?.title?.trim().isNotEmpty ?? false)
      ? notification!.title
      : (dataTitle?.isNotEmpty ?? false)
          ? dataTitle
          : 'Panchang';
  final body = (notification?.body?.trim().isNotEmpty ?? false)
      ? notification!.body
      : (dataBody?.isNotEmpty ?? false)
          ? dataBody
          : 'You have a new notification';

  await plugin.show(
    id: message.hashCode,
    title: title,
    body: body,
      notificationDetails: const NotificationDetails(
      android: AndroidNotificationDetails(
        'panchang_push_channel',
        'Push Notifications',
        channelDescription: 'Notifications delivered from the Panchang backend',
        importance: Importance.high,
        priority: Priority.high,
        icon: 'notification_icon',
      ),
    ),
    payload: jsonEncode(message.data),
  );
}

Uri? _uriFromPayload(String? payload) {
  if (payload == null || payload.isEmpty) {
    return null;
  }

  try {
    final data = jsonDecode(payload);
    if (data is Map<String, dynamic>) {
      return _uriFromData(data);
    }
  } catch (_) {
    return null;
  }

  return null;
}

Uri? _uriFromData(Map<String, dynamic> data) {
  final candidates = [
    data['url'],
    data['deep_link'],
    data['deeplink'],
    data['link'],
    data['targetUrl'],
  ];

  for (final candidate in candidates) {
    final rawUrl = candidate?.toString().trim();
    if (rawUrl != null && rawUrl.isNotEmpty) {
      try {
        return Uri.parse(rawUrl);
      } catch (_) {
        return null;
      }
    }
  }

  return null;
}
