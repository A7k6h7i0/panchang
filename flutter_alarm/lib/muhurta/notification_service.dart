import 'dart:io';
import 'package:flutter_local_notifications/flutter_local_notifications.dart';
import 'package:path_provider/path_provider.dart';
import 'package:timezone/data/latest.dart' as tz;
import 'package:timezone/timezone.dart' as tz;
import 'package:audioplayers/audioplayers.dart';
import 'package:flutter/services.dart';
import 'muhurta_parser.dart';

class NotificationService {
  static final NotificationService _instance = NotificationService._internal();
  factory NotificationService() => _instance;

  NotificationService._internal();

  final FlutterLocalNotificationsPlugin flutterLocalNotificationsPlugin =
      FlutterLocalNotificationsPlugin();

  final AudioPlayer _audioPlayer = AudioPlayer();

  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) return;

    tz.initializeTimeZones();

    const AndroidInitializationSettings initializationSettingsAndroid =
        AndroidInitializationSettings('@mipmap/ic_launcher');

    const DarwinInitializationSettings initializationSettingsIOS =
        DarwinInitializationSettings(
      requestAlertPermission: true,
      requestBadgePermission: true,
      requestSoundPermission: true,
    );

    const InitializationSettings initializationSettings =
        InitializationSettings(
      android: initializationSettingsAndroid,
      iOS: initializationSettingsIOS,
    );

    await flutterLocalNotificationsPlugin.initialize(
      initializationSettings,
    );

    _initialized = true;
  }

  Future<void> _copyAssetToFile(String assetPath) async {
    final ByteData data = await rootBundle.load('assets/audio/$assetPath');
    final Directory tempDir = await getTemporaryDirectory();
    final File tempFile = File('${tempDir.path}/$assetPath');
    await tempFile.writeAsBytes(data.buffer.asUint8List());
  }

  Future<NotificationDetails> _getNotificationDetails(
    String? audioFileName,
    bool isStart,
  ) async {
    final AndroidNotificationDetails androidPlatformChannelSpecifics =
        AndroidNotificationDetails(
      'muhurta_alerts',
      'Muhurta Alerts',
      channelDescription: 'Muhurta notification alerts',
      importance: Importance.max,
      priority: Priority.high,
      playSound: audioFileName != null,
      sound: audioFileName != null ? RawResourceAndroidNotificationSound(audioFileName.split('.').first) : null,
      ongoing: false,
      autoCancel: true,
    );

    final DarwinNotificationDetails iOSPlatformChannelSpecifics =
        DarwinNotificationDetails(
      sound: audioFileName,
      presentAlert: true,
      presentBadge: true,
      presentSound: audioFileName != null,
    );

    return NotificationDetails(
      android: androidPlatformChannelSpecifics,
      iOS: iOSPlatformChannelSpecifics,
    );
  }

  Future<void> scheduleNotification({
    required int id,
    required DateTime scheduledTime,
    required String title,
    required String body,
    required String? audioFileName,
    required bool playAudio,
  }) async {
    if (!_initialized) {
      await initialize();
    }

    final tz.TZDateTime tzTime = tz.TZDateTime.from(
      scheduledTime,
      tz.local,
    );

    final NotificationDetails notificationDetails =
        await _getNotificationDetails(
      playAudio ? audioFileName : null,
      audioFileName?.contains('start') ?? false,
    );

    await flutterLocalNotificationsPlugin.zonedSchedule(
      id,
      title,
      body,
      tzTime,
      notificationDetails,
      androidAllowWhileIdle: true,
      uiLocalNotificationDateInterpretation:
          UILocalNotificationDateInterpretation.absoluteTime,
    );
  }

  Future<void> cancelNotification(int id) async {
    if (!_initialized) {
      await initialize();
    }

    await flutterLocalNotificationsPlugin.cancel(id);
  }

  Future<void> cancelAllNotifications() async {
    if (!_initialized) {
      await initialize();
    }

    await flutterLocalNotificationsPlugin.cancelAll();
  }

  Future<int> getPendingNotificationCount() async {
    if (!_initialized) {
      await initialize();
    }

    final List<PendingNotificationRequest> pendingNotifications =
        await flutterLocalNotificationsPlugin.pendingNotificationRequests();
    return pendingNotifications.length;
  }

  Future<void> playAudio(String fileName) async {
    try {
      final ByteData data = await rootBundle.load('assets/audio/$fileName');
      final Uint8List bytes = data.buffer.asUint8List();

      await _audioPlayer.play(BytesSource(bytes));
    } catch (e) {
      print('Error playing audio: $fileName, $e');
    }
  }
}
