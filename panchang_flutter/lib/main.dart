import 'package:alarm/alarm.dart';
import 'package:facebook_app_events/facebook_app_events.dart';
import 'package:firebase_auth/firebase_auth.dart';
import 'package:firebase_core/firebase_core.dart';
import 'package:firebase_messaging/firebase_messaging.dart';
import 'package:flutter/material.dart';
import 'package:google_sign_in/google_sign_in.dart';
import 'package:google_mobile_ads/google_mobile_ads.dart';
import 'package:panchang_flutter/data/app_info.dart';
import 'package:panchang_flutter/firebase_options.dart';
import 'package:panchang_flutter/presentation/auth/welcome_screen.dart';
import 'package:panchang_flutter/presentation/webview_screen.dart';
import 'package:panchang_flutter/services/auth_service.dart';
import 'package:panchang_flutter/services/push_notification_service.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Firebase
  await Firebase.initializeApp(options: DefaultFirebaseOptions.currentPlatform);
  FirebaseMessaging.onBackgroundMessage(
    firebaseMessagingBackgroundHandler,
  );
  await PushNotificationService.instance.initialize();

  await Alarm.init();

  await GoogleSignIn.instance.initialize();
  await MobileAds.instance.initialize();

  // Initialize Facebook App Events
  final facebookAppEvents = FacebookAppEvents();
  facebookAppEvents.setAutoLogAppEventsEnabled(true);
  facebookAppEvents.setAdvertiserTracking(enabled: true, collectId: true);

  runApp(const MainApp());
}

class MainApp extends StatefulWidget {
  const MainApp({super.key});

  @override
  State<MainApp> createState() => _MainAppState();
}

class _MainAppState extends State<MainApp> {
  bool _isSkipped = false;
  final AuthService _authService = AuthService();

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: AppInfo.appName,
      theme: ThemeData(useMaterial3: true, colorSchemeSeed: Colors.orange),
      home: StreamBuilder<User?>(
        stream: _authService.userStream,
        builder: (context, snapshot) {
          // If logged in OR skipped, go to WebView
          if (snapshot.hasData || _isSkipped) {
            final launchUrl =
                PushNotificationService.instance.pendingLaunchUri?.toString() ??
                AppInfo.appUrl;
            return WebViewScreen(url: launchUrl);
          }

          // Otherwise show Welcome Screen
          return WelcomeScreen(onSkip: () => setState(() => _isSkipped = true));
        },
      ),
    );
  }
}
