import 'package:alarm/alarm.dart';
import 'package:flutter/material.dart';
import 'package:panchang_flutter/data/app_info.dart';
import 'package:panchang_flutter/presentation/webview_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await Alarm.init();
  runApp(const MainApp());
}

class MainApp extends StatelessWidget {
  const MainApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: AppInfo.appName,
      theme: ThemeData(useMaterial3: true),
      home: const WebViewScreen(url: AppInfo.appUrl),
    );
  }
}
