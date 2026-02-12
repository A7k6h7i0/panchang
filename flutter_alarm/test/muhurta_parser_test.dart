import 'package:flutter_test/flutter_test.dart';
import 'package:telugu_calendar/muhurta/muhurta_parser.dart';

void main() {
  group('Muhurta Parser Tests', () {
    test('Parse valid muhurta data', () {
      const testData = {
        'date': '2026-03-04',
        'rahukalam': '13:30-15:00',
        'yamagandam': '09:00-10:30',
        'gulika': '07:30-09:00',
        'durmuhurtham': '11:45-12:30',
        'varjyam': '02:15-03:00',
      };

      final muhurtas = MuhurtaParser.parseMuhurtasFromDb(testData);

      expect(muhurtas.length, 5);
    });

    test('Parse invalid time format', () {
      const testData = {
        'date': '2026-03-04',
        'rahukalam': 'invalid-time',
        'yamagandam': '09:00-10:30',
      };

      final muhurtas = MuhurtaParser.parseMuhurtasFromDb(testData);

      expect(muhurtas.length, 1);
    });

    test('Parse null values', () {
      const testData = {
        'date': '2026-03-04',
        'rahukalam': null,
        'yamagandam': '',
      };

      final muhurtas = MuhurtaParser.parseMuhurtasFromDb(testData);

      expect(muhurtas.isEmpty, true);
    });

    test('Get correct title for each MuhurtaType', () {
      expect(MuhurtaType.rahukalam.title, 'రాహు కాలం');
      expect(MuhurtaType.yamagandam.title, 'యమగండం');
      expect(MuhurtaType.gulika.title, 'గుళిక కాలం');
      expect(MuhurtaType.durmuhurtham.title, 'దుర్ముహూర్తం');
      expect(MuhurtaType.varjyam.title, 'వర్జ్యం');
    });

    test('Get correct audio files for each MuhurtaType', () {
      expect(MuhurtaType.rahukalam.audioStartFile, 'rahu_start.mp3');
      expect(MuhurtaType.rahukalam.audioEndFile, 'rahu_end.mp3');
      expect(MuhurtaType.yamagandam.audioStartFile, 'yamagandam_start.mp3');
      expect(MuhurtaType.gulika.audioStartFile, 'gulika_start.mp3');
    });

    test('Create Muhurta instance', () {
      const dateTime = '2026-03-04';
      const startTime = '13:30';
      const endTime = '15:00';

      final testData = {
        'date': dateTime,
        'rahukalam': '$startTime-$endTime',
      };

      final muhurtas = MuhurtaParser.parseMuhurtasFromDb(testData);

      expect(muhurtas.length, 1);
      expect(muhurtas[0].type, MuhurtaType.rahukalam);
      expect(muhurtas[0].startTime.year, 2026);
      expect(muhurtas[0].startTime.month, 3);
      expect(muhurtas[0].startTime.day, 4);
      expect(muhurtas[0].startTime.hour, 13);
      expect(muhurtas[0].startTime.minute, 30);
    });
  });
}
