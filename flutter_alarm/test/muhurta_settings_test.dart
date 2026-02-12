import 'package:flutter_test/flutter_test.dart';
import 'package:telugu_calendar/muhurta/muhurta_parser.dart';
import 'package:telugu_calendar/settings/muhurta_settings.dart';

void main() {
  group('Muhurta Settings Tests', () {
    test('Initialize settings', () async {
      final settings = MuhurtaSettings();
      await settings.initialize();

      expect(settings.enabledMuhurtas.isNotEmpty, true);
      expect(settings.audioEnabled, true);
      expect(settings.reminderTime, 60);
      expect(settings.silentMode, false);
      expect(settings.disabledDays, isEmpty);
    });

    test('Default settings are all muhurtas enabled', () async {
      final settings = MuhurtaSettings();
      await settings.initialize();

      expect(settings.enabledMuhurtas[MuhurtaType.rahukalam], true);
      expect(settings.enabledMuhurtas[MuhurtaType.yamagandam], true);
      expect(settings.enabledMuhurtas[MuhurtaType.gulika], true);
      expect(settings.enabledMuhurtas[MuhurtaType.durmuhurtham], true);
      expect(settings.enabledMuhurtas[MuhurtaType.varjyam], true);
    });

    test('Toggle muhurta enabled', () async {
      final settings = MuhurtaSettings();
      await settings.initialize();

      final initialValue = settings.enabledMuhurtas[MuhurtaType.rahukalam]!;
      await settings.setMuhurtaEnabled(
          MuhurtaType.rahukalam, !initialValue);
      
      final loadedSettings = await settings.getSettings();
      expect(loadedSettings.enabledMuhurtas[MuhurtaType.rahukalam],
          !initialValue);
    });

    test('Set reminder time', () async {
      final settings = MuhurtaSettings();
      await settings.initialize();

      await settings.setReminderTime(30);

      final loadedSettings = await settings.getSettings();
      expect(loadedSettings.reminderTime, 30);
    });

    test('Set audio enabled', () async {
      final settings = MuhurtaSettings();
      await settings.initialize();

      await settings.setAudioEnabled(false);

      final loadedSettings = await settings.getSettings();
      expect(loadedSettings.audioEnabled, false);
    });

    test('Set silent mode', () async {
      final settings = MuhurtaSettings();
      await settings.initialize();

      await settings.setSilentMode(true);

      final loadedSettings = await settings.getSettings();
      expect(loadedSettings.silentMode, true);
    });

    test('Set disabled days', () async {
      final settings = MuhurtaSettings();
      await settings.initialize();

      await settings.setDisabledDays([1, 3, 5]);

      final loadedSettings = await settings.getSettings();
      expect(loadedSettings.disabledDays, [1, 3, 5]);
    });

    test('Check if day is disabled', () async {
      final settings = MuhurtaSettings();
      await settings.initialize();

      await settings.setDisabledDays([1, 3]);

      expect(await settings.isDayDisabled(1), true);
      expect(await settings.isDayDisabled(2), false);
      expect(await settings.isDayDisabled(3), true);
    });

    test('Check if muhurta is enabled', () async {
      final settings = MuhurtaSettings();
      await settings.initialize();

      await settings.setMuhurtaEnabled(MuhurtaType.yamagandam, false);

      expect(await settings.isMuhurtaEnabled(MuhurtaType.rahukalam), true);
      expect(await settings.isMuhurtaEnabled(MuhurtaType.yamagandam), false);
    });

    test('Reset to defaults', () async {
      final settings = MuhurtaSettings();
      await settings.initialize();

      await settings.setMuhurtaEnabled(MuhurtaType.rahukalam, false);
      await settings.setAudioEnabled(false);
      await settings.setReminderTime(30);
      await settings.setSilentMode(true);
      await settings.setDisabledDays([1, 2]);

      await settings.resetToDefaults();

      final loadedSettings = await settings.getSettings();
      expect(loadedSettings.enabledMuhurtas[MuhurtaType.rahukalam], true);
      expect(loadedSettings.audioEnabled, true);
      expect(loadedSettings.reminderTime, 60);
      expect(loadedSettings.silentMode, false);
      expect(loadedSettings.disabledDays, isEmpty);
    });
  });
}
