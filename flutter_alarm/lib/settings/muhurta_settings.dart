import 'package:hive/hive.dart';
import 'package:hive_flutter/hive_flutter.dart';
import '../muhurta/muhurta_parser.dart';

class MuhurtaSettings {
  static const String _boxName = 'muhurtaSettings';

  final Map<MuhurtaType, bool> enabledMuhurtas = {
    MuhurtaType.rahukalam: true,
    MuhurtaType.yamagandam: true,
    MuhurtaType.gulika: true,
    MuhurtaType.durmuhurtham: true,
    MuhurtaType.varjyam: true,
  };

  bool audioEnabled = true;
  int reminderTime = 60;
  bool silentMode = false;
  List<int> disabledDays = [];

  bool _initialized = false;

  Future<void> initialize() async {
    if (_initialized) return;

    await Hive.initFlutter();

    if (!Hive.isBoxOpen(_boxName)) {
      await Hive.openBox(_boxName);
    }

    await _loadSettings();
    _initialized = true;
  }

  Future<void> _loadSettings() async {
    final box = Hive.box(_boxName);

    final savedEnabledMuhurtas = box.get('enabledMuhurtas');
    if (savedEnabledMuhurtas != null) {
      final Map<String, dynamic> map = savedEnabledMuhurtas;
      map.forEach((key, value) {
        final type = MuhurtaType.values.firstWhere(
          (t) => t.toString() == 'MuhurtaType.$key',
          orElse: () => MuhurtaType.rahukalam,
        );
        enabledMuhurtas[type] = value as bool;
      });
    }

    audioEnabled = box.get('audioEnabled', defaultValue: true);
    reminderTime = box.get('reminderTime', defaultValue: 60);
    silentMode = box.get('silentMode', defaultValue: false);
    disabledDays = box.get('disabledDays', defaultValue: []).cast<int>();
  }

  Future<void> saveSettings() async {
    final box = Hive.box(_boxName);

    final enabledMuhurtasMap = {
      for (var entry in enabledMuhurtas.entries)
        entry.key.toString().split('.').last: entry.value,
    };

    await box.put('enabledMuhurtas', enabledMuhurtasMap);
    await box.put('audioEnabled', audioEnabled);
    await box.put('reminderTime', reminderTime);
    await box.put('silentMode', silentMode);
    await box.put('disabledDays', disabledDays);
  }

  Future<MuhurtaSettings> getSettings() async {
    if (!_initialized) {
      await initialize();
    }

    final settings = MuhurtaSettings();
    settings.enabledMuhurtas.addAll(enabledMuhurtas);
    settings.audioEnabled = audioEnabled;
    settings.reminderTime = reminderTime;
    settings.silentMode = silentMode;
    settings.disabledDays = List.from(disabledDays);

    return settings;
  }

  Future<void> setMuhurtaEnabled(MuhurtaType type, bool enabled) async {
    enabledMuhurtas[type] = enabled;
    await saveSettings();
  }

  Future<void> setAudioEnabled(bool enabled) async {
    audioEnabled = enabled;
    await saveSettings();
  }

  Future<void> setReminderTime(int minutes) async {
    reminderTime = minutes;
    await saveSettings();
  }

  Future<void> setSilentMode(bool enabled) async {
    silentMode = enabled;
    await saveSettings();
  }

  Future<void> setDisabledDays(List<int> days) async {
    disabledDays = List.from(days);
    await saveSettings();
  }

  Future<bool> isDayDisabled(int dayOfWeek) async {
    if (!_initialized) {
      await initialize();
    }
    return disabledDays.contains(dayOfWeek);
  }

  Future<bool> isMuhurtaEnabled(MuhurtaType type) async {
    if (!_initialized) {
      await initialize();
    }
    return enabledMuhurtas[type] ?? false;
  }

  Future<void> resetToDefaults() async {
    enabledMuhurtas[MuhurtaType.rahukalam] = true;
    enabledMuhurtas[MuhurtaType.yamagandam] = true;
    enabledMuhurtas[MuhurtaType.gulika] = true;
    enabledMuhurtas[MuhurtaType.durmuhurtham] = true;
    enabledMuhurtas[MuhurtaType.varjyam] = true;

    audioEnabled = true;
    reminderTime = 60;
    silentMode = false;
    disabledDays = [];

    await saveSettings();
  }
}
