import 'package:flutter/material.dart';
import '../muhurta/muhurta_parser.dart';
import '../settings/muhurta_settings.dart';

class MuhurtaSettingsScreen extends StatefulWidget {
  const MuhurtaSettingsScreen({super.key});

  @override
  State<MuhurtaSettingsScreen> createState() => _MuhurtaSettingsScreenState();
}

class _MuhurtaSettingsScreenState extends State<MuhurtaSettingsScreen> {
  final MuhurtaSettings _settings = MuhurtaSettings();
  bool _isLoading = true;
  late Map<MuhurtaType, bool> _enabledMuhurtas;
  bool _audioEnabled = true;
  int _reminderTime = 60;
  bool _silentMode = false;
  List<int> _disabledDays = [];

  @override
  void initState() {
    super.initState();
    _loadSettings();
  }

  Future<void> _loadSettings() async {
    final settings = await _settings.getSettings();
    setState(() {
      _enabledMuhurtas = Map.from(settings.enabledMuhurtas);
      _audioEnabled = settings.audioEnabled;
      _reminderTime = settings.reminderTime;
      _silentMode = settings.silentMode;
      _disabledDays = List.from(settings.disabledDays);
      _isLoading = false;
    });
  }

  Future<void> _saveSettings() async {
    for (final entry in _enabledMuhurtas.entries) {
      await _settings.setMuhurtaEnabled(entry.key, entry.value);
    }
    await _settings.setAudioEnabled(_audioEnabled);
    await _settings.setReminderTime(_reminderTime);
    await _settings.setSilentMode(_silentMode);
    await _settings.setDisabledDays(_disabledDays);
  }

  void _toggleMuhurta(MuhurtaType type) {
    setState(() {
      _enabledMuhurtas[type] = !_enabledMuhurtas[type]!;
    });
  }

  void _toggleDay(int dayOfWeek) {
    setState(() {
      if (_disabledDays.contains(dayOfWeek)) {
        _disabledDays.remove(dayOfWeek);
      } else {
        _disabledDays.add(dayOfWeek);
      }
    });
  }

  String _getDayName(int dayOfWeek) {
    const dayNames = [
      'Monday',
      'Tuesday',
      'Wednesday',
      'Thursday',
      'Friday',
      'Saturday',
      'Sunday',
    ];
    return dayNames[dayOfWeek - 1];
  }

  @override
  Widget build(BuildContext context) {
    if (_isLoading) {
      return const Scaffold(
        body: Center(
          child: CircularProgressIndicator(),
        ),
      );
    }

    return Scaffold(
      appBar: AppBar(
        title: const Text('ముహూర్తం నోటిఫికేషన్ సెట్టింగులు'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: () async {
              await _settings.resetToDefaults();
              await _loadSettings();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(
                  content: Text('Settings reset to defaults'),
                ),
              );
            },
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16.0),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            _buildSectionTitle('Enable/Disable Muhurtas'),
            const SizedBox(height: 8),
            ..._buildMuhurtaToggleList(),
            const SizedBox(height: 24),
            _buildSectionTitle('Notification Preferences'),
            const SizedBox(height: 8),
            SwitchListTile(
              title: const Text('Audio Alerts'),
              value: _audioEnabled,
              onChanged: (value) {
                setState(() {
                  _audioEnabled = value;
                });
              },
            ),
            SwitchListTile(
              title: const Text('Silent Mode'),
              value: _silentMode,
              onChanged: (value) {
                setState(() {
                  _silentMode = value;
                });
              },
              subtitle: Text('Overrides audio setting'),
            ),
            ListTile(
              title: const Text('Reminder Time'),
              subtitle: Text('$_reminderTime minutes before start'),
              trailing: DropdownButton<int>(
                value: _reminderTime,
                items: [15, 30, 60, 90, 120].map((int value) {
                  return DropdownMenuItem<int>(
                    value: value,
                    child: Text('$value minutes'),
                  );
                }).toList(),
                onChanged: (value) {
                  setState(() {
                    _reminderTime = value!;
                  });
                },
              ),
            ),
            const SizedBox(height: 24),
            _buildSectionTitle('Disabled Days'),
            const SizedBox(height: 8),
            ..._buildDayToggleList(),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: () async {
                await _saveSettings();
                ScaffoldMessenger.of(context).showSnackBar(
                  const SnackBar(
                    content: Text('Settings saved successfully'),
                  ),
                );
              },
              child: const Text('Save Settings'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildSectionTitle(String title) {
    return Text(
      title,
      style: const TextStyle(
        fontSize: 18,
        fontWeight: FontWeight.bold,
        color: Colors.blue,
      ),
    );
  }

  List<Widget> _buildMuhurtaToggleList() {
    return MuhurtaType.values.map((type) {
      return SwitchListTile(
        title: Text(type.title),
        value: _enabledMuhurtas[type]!,
        onChanged: (value) {
          _toggleMuhurta(type);
        },
      );
    }).toList();
  }

  List<Widget> _buildDayToggleList() {
    return List.generate(7, (index) {
      final dayOfWeek = index + 1;
      return SwitchListTile(
        title: Text(_getDayName(dayOfWeek)),
        value: _disabledDays.contains(dayOfWeek),
        onChanged: (value) {
          _toggleDay(dayOfWeek);
        },
      );
    });
  }
}
