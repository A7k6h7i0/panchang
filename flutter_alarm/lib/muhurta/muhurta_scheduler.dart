import 'dart:async';
import 'package:android_alarm_manager_plus/android_alarm_manager_plus.dart';
import 'package:intl/intl.dart';
import 'muhurta_parser.dart';
import 'notification_service.dart';
import '../settings/muhurta_settings.dart';

class MuhurtaScheduler {
  static const int _dailyScheduleId = 0;
  static const int _notificationBaseId = 1000;

  final NotificationService _notificationService = NotificationService();
  final MuhurtaSettings _settings = MuhurtaSettings();

  Future<void> initialize() async {
    await AndroidAlarmManager.initialize();
    await _notificationService.initialize();
    await _settings.initialize();
  }

  Future<void> scheduleDailyMuhurtas(Map<String, dynamic> dailyMuhurtas) async {
    await _cancelYesterdayNotifications();
    await _scheduleTodayMuhurtas(dailyMuhurtas);
    await _scheduleNextDayReschedule();
  }

  Future<void> _scheduleTodayMuhurtas(Map<String, dynamic> dailyMuhurtas) async {
    final List<Muhurta> muhurtas =
        MuhurtaParser.parseMuhurtasFromDb(dailyMuhurtas);

    for (final muhurta in muhurtas) {
      await _scheduleMuhurtaNotifications(muhurta);
    }
  }

  Future<void> _scheduleMuhurtaNotifications(Muhurta muhurta) async {
    final settings = await _settings.getSettings();

    if (!settings.enabledMuhurtas[muhurta.type]!) {
      return;
    }

    final reminderMinutes = settings.reminderTime;
    final isAudioEnabled = settings.audioEnabled;

    final preNotificationTime =
        muhurta.startTime.subtract(Duration(minutes: reminderMinutes));

    if (preNotificationTime.isAfter(DateTime.now())) {
      await _notificationService.scheduleNotification(
        id: _getNotificationId(muhurta.type, NotificationType.pre),
        scheduledTime: preNotificationTime,
        title: '${muhurta.type.title} ప్రారంభం క్రితం',
        body: '${muhurta.type.title} $reminderMinutes నిమిషాల్లో ప్రారంభమైంది.',
        audioFileName: 'pre_alert.mp3',
        playAudio: isAudioEnabled,
      );
    }

    if (muhurta.startTime.isAfter(DateTime.now())) {
      await _notificationService.scheduleNotification(
        id: _getNotificationId(muhurta.type, NotificationType.start),
        scheduledTime: muhurta.startTime,
        title: '${muhurta.type.title} ప్రారంభమైంది',
        body: '${muhurta.type.title} ప్రారంభమైంది.',
        audioFileName: muhurta.type.audioStartFile,
        playAudio: isAudioEnabled,
      );
    }

    if (muhurta.endTime.isAfter(DateTime.now())) {
      await _notificationService.scheduleNotification(
        id: _getNotificationId(muhurta.type, NotificationType.end),
        scheduledTime: muhurta.endTime,
        title: '${muhurta.type.title} ముగిసింది',
        body: '${muhurta.type.title} ముగిసింది.',
        audioFileName: muhurta.type.audioEndFile,
        playAudio: isAudioEnabled,
      );
    }
  }

  Future<void> _cancelYesterdayNotifications() async {
    for (final type in MuhurtaType.values) {
      await _notificationService.cancelNotification(
        _getNotificationId(type, NotificationType.pre),
      );
      await _notificationService.cancelNotification(
        _getNotificationId(type, NotificationType.start),
      );
      await _notificationService.cancelNotification(
        _getNotificationId(type, NotificationType.end),
      );
    }
  }

  Future<void> _scheduleNextDayReschedule() async {
    final tomorrow = DateTime.now().add(const Duration(days: 1));
    final nextMidnight = DateTime(
      tomorrow.year,
      tomorrow.month,
      tomorrow.day,
      0,
      1,
    );

    await AndroidAlarmManager.oneShotAt(
      nextMidnight,
      _dailyScheduleId,
      _dailyRescheduleCallback,
      exact: true,
      wakeup: true,
    );
  }

  int _getNotificationId(MuhurtaType type, NotificationType notificationType) {
    final typeIndex = MuhurtaType.values.indexOf(type);
    final notificationIndex = NotificationType.values.indexOf(notificationType);
    return _notificationBaseId + (typeIndex * 3) + notificationIndex;
  }

  static Future<void> _dailyRescheduleCallback() async {
    final scheduler = MuhurtaScheduler();
    await scheduler.initialize();

    final dailyMuhurtas = await _fetchTodaysMuhurtas();
    await scheduler.scheduleDailyMuhurtas(dailyMuhurtas);
  }

  static Future<Map<String, dynamic>> _fetchTodaysMuhurtas() async {
    return {
      'date': DateFormat('yyyy-MM-dd').format(DateTime.now()),
      'rahukalam': '13:30-15:00',
      'yamagandam': '09:00-10:30',
      'gulika': '07:30-09:00',
      'durmuhurtham': '11:45-12:30',
      'varjyam': '02:15-03:00',
    };
  }

  Future<void> cancelAllNotifications() async {
    await _notificationService.cancelAllNotifications();
  }

  Future<int> getPendingNotificationCount() async {
    return await _notificationService.getPendingNotificationCount();
  }
}

enum NotificationType {
  pre,
  start,
  end,
}

extension NotificationTypeExtension on NotificationType {
  String get description {
    switch (this) {
      case NotificationType.pre:
        return 'One hour before';
      case NotificationType.start:
        return 'At start time';
      case NotificationType.end:
        return 'At end time';
    }
  }
}
