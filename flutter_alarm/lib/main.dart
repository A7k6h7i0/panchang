import 'package:flutter/material.dart';
import 'muhurta/muhurta_scheduler.dart';
import 'settings/muhurta_settings_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final scheduler = MuhurtaScheduler();
  await scheduler.initialize();

  final dailyMuhurtas = await MuhurtaScheduler._fetchTodaysMuhurtas();
  await scheduler.scheduleDailyMuhurtas(dailyMuhurtas);

  runApp(const TeluguCalendarApp());
}

class TeluguCalendarApp extends StatelessWidget {
  const TeluguCalendarApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'Telugu Calendar',
      theme: ThemeData(
        primarySwatch: Colors.blue,
        visualDensity: VisualDensity.adaptivePlatformDensity,
      ),
      home: const MyHomePage(),
      routes: {
        '/settings': (context) => const MuhurtaSettingsScreen(),
      },
    );
  }
}

class MyHomePage extends StatelessWidget {
  const MyHomePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Telugu Calendar'),
        actions: [
          IconButton(
            icon: const Icon(Icons.settings),
            onPressed: () {
              Navigator.pushNamed(context, '/settings');
            },
          ),
        ],
      ),
      body: Center(
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            const Text(
              'Welcome to Telugu Calendar',
              style: TextStyle(fontSize: 24),
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 20),
            ElevatedButton(
              onPressed: () {
                Navigator.pushNamed(context, '/settings');
              },
              child: const Text('Muhurta Notification Settings'),
            ),
          ],
        ),
      ),
    );
  }
}
