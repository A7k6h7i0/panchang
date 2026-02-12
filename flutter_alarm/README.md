# Muhurta Smart Notification + Audio Alert Engine

A comprehensive Flutter module for daily automated notifications and audio alerts for Telugu calendar muhurtas.

## 🎯 Features

### 📱 Notification System
- **3-stage notifications per muhurta**:
  - 1 hour before start (customizable reminder time)
  - At exact start time
  - At completion time

### 🔔 Supported Muhurta Types
1. రాహు కాలం (Rahukalam)
2. యమగండం (Yamagandam)
3. గుళిక కాలం (Gulika)
4. దుర్ముహూర్తం (Durmuhurtham)
5. వర్జ్యం (Varjyam)

### 🎵 Audio Alerts
- Telugu voice notifications for all muhurta types
- Custom audio files stored in `assets/audio/`
- 3-5 second MP3 files at 128kbps
- Support for silent mode

### ⚙️ User Settings
- Enable/disable individual muhurta notifications
- Toggle audio alerts
- Custom reminder time (15/30/60/90/120 minutes)
- Silent mode option
- Disable notifications on specific days
- Reset to defaults

## 🛠️ Technical Implementation

### Architecture
```
Calendar Database → Muhurta Time Parser → Notification Scheduler → Local Notifications + Audio Channel
```

### Required Packages
- `flutter_local_notifications` - Local notifications
- `timezone` - Time zone handling
- `android_alarm_manager_plus` - Background scheduling
- `audioplayers` - Audio playback
- `hive` - Local storage
- `sqflite` - Database support

### Project Structure
```
lib/
 ├── muhurta/
 │     ├── muhurta_parser.dart
 │     ├── muhurta_scheduler.dart
 │     └── notification_service.dart
 ├── settings/
 │     ├── muhurta_settings.dart
 │     └── muhurta_settings_screen.dart
 └── main.dart
```

## 🚀 Integration

### 1. Initialize Scheduler
```dart
void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  
  final scheduler = MuhurtaScheduler();
  await scheduler.initialize();
  
  final dailyMuhurtas = await fetchTodaysMuhurtasFromDb();
  await scheduler.scheduleDailyMuhurtas(dailyMuhurtas);
  
  runApp(const TeluguCalendarApp());
}
```

### 2. Add Settings Screen
```dart
class TeluguCalendarApp extends StatelessWidget {
  const TeluguCalendarApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Telugu Calendar',
      theme: ThemeData(
        primarySwatch: Colors.blue,
      ),
      home: const MyHomePage(),
      routes: {
        '/settings': (context) => const MuhurtaSettingsScreen(),
      },
    );
  }
}
```

### 3. Database Integration
The scheduler accepts data in this format:
```dart
{
  'date': '2026-03-04',
  'rahukalam': '13:30-15:00',
  'yamagandam': '09:00-10:30',
  'gulika': '07:30-09:00',
  'durmuhurtham': '11:45-12:30',
  'varjyam': '02:15-03:00',
}
```

## 📱 Usage

1. **Enable/Disable Muhurtas**: Toggle notifications for each muhurta type
2. **Audio Settings**: Control audio alerts and silent mode
3. **Reminder Time**: Choose how early to receive notifications
4. **Disabled Days**: Turn off notifications on specific days
5. **Reset**: Restore all settings to defaults

## 🧪 Testing

The implementation includes comprehensive test coverage:
- Parser tests for time range parsing
- Settings tests for Hive storage operations

Run tests with:
```bash
flutter test
```

## 📋 Requirements

- Flutter 3.0 or later
- Android 5.0 (API 21) or later
- iOS 10.0 or later

## 🎨 UI Preview

The settings screen features:
- Modern Material Design
- Toggle switches for each muhurta
- Dropdown for reminder time
- Day selection for disabling specific days
- Save and reset functionality

## 🔄 Background Operation

- Notifications work when app is closed
- Phone locked support
- Device reboot handling
- Offline-first operation
- Battery saver mode support

## 📄 License

MIT License - feel free to use this module in your projects.
