import 'package:intl/intl.dart';

enum MuhurtaType {
  rahukalam,
  yamagandam,
  gulika,
  durmuhurtham,
  varjyam,
}

extension MuhurtaTypeExtension on MuhurtaType {
  String get title {
    switch (this) {
      case MuhurtaType.rahukalam:
        return 'రాహు కాలం';
      case MuhurtaType.yamagandam:
        return 'యమగండం';
      case MuhurtaType.gulika:
        return 'గుళిక కాలం';
      case MuhurtaType.durmuhurtham:
        return 'దుర్ముహూర్తం';
      case MuhurtaType.varjyam:
        return 'వర్జ్యం';
    }
  }

  String get audioStartFile {
    switch (this) {
      case MuhurtaType.rahukalam:
        return 'rahu_start.mp3';
      case MuhurtaType.yamagandam:
        return 'yamagandam_start.mp3';
      case MuhurtaType.gulika:
        return 'gulika_start.mp3';
      case MuhurtaType.durmuhurtham:
        return 'durmuhurtham_start.mp3';
      case MuhurtaType.varjyam:
        return 'varjyam_start.mp3';
    }
  }

  String get audioEndFile {
    switch (this) {
      case MuhurtaType.rahukalam:
        return 'rahu_end.mp3';
      case MuhurtaType.yamagandam:
        return 'yamagandam_end.mp3';
      case MuhurtaType.gulika:
        return 'gulika_end.mp3';
      case MuhurtaType.durmuhurtham:
        return 'durmuhurtham_end.mp3';
      case MuhurtaType.varjyam:
        return 'varjyam_end.mp3';
    }
  }
}

class Muhurta {
  final MuhurtaType type;
  final DateTime startTime;
  final DateTime endTime;

  Muhurta({
    required this.type,
    required this.startTime,
    required this.endTime,
  });

  @override
  String toString() {
    return '${type.title}: ${DateFormat.Hm().format(startTime)} - ${DateFormat.Hm().format(endTime)}';
  }
}

class MuhurtaParser {
  static List<Muhurta> parseMuhurtasFromDb(Map<String, dynamic> dbData) {
    final List<Muhurta> muhurtas = [];
    final date = DateTime.parse(dbData['date'] as String);

    final Map<MuhurtaType, String?> muhurtaData = {
      MuhurtaType.rahukalam: dbData['rahukalam'] as String?,
      MuhurtaType.yamagandam: dbData['yamagandam'] as String?,
      MuhurtaType.gulika: dbData['gulika'] as String?,
      MuhurtaType.durmuhurtham: dbData['durmuhurtham'] as String?,
      MuhurtaType.varjyam: dbData['varjyam'] as String?,
    };

    for (final entry in muhurtaData.entries) {
      final type = entry.key;
      final timeString = entry.value;

      if (timeString != null && timeString.isNotEmpty) {
        final timeRange = _parseTimeRange(timeString, date);
        if (timeRange != null) {
          muhurtas.add(Muhurta(
            type: type,
            startTime: timeRange[0]!,
            endTime: timeRange[1]!,
          ));
        }
      }
    }

    return muhurtas;
  }

  static List<DateTime>? _parseTimeRange(String timeString, DateTime date) {
    try {
      final parts = timeString.split('-');
      if (parts.length != 2) return null;

      final startTime = _parseTime(parts[0], date);
      final endTime = _parseTime(parts[1], date);

      if (startTime != null && endTime != null) {
        return [startTime, endTime];
      }
    } catch (e) {
      print('Error parsing time range: $timeString, $e');
    }

    return null;
  }

  static DateTime? _parseTime(String timeString, DateTime date) {
    try {
      final parts = timeString.trim().split(':');
      if (parts.length != 2) return null;

      final hour = int.parse(parts[0].trim());
      final minute = int.parse(parts[1].trim());

      return DateTime(
        date.year,
        date.month,
        date.day,
        hour,
        minute,
      );
    } catch (e) {
      print('Error parsing time: $timeString, $e');
    }

    return null;
  }
}
