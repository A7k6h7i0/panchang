import 'package:flutter/foundation.dart';

class AppInfo {
  static const String appName = 'Talking Calendar';
  static const String _defaultProductionAppUrl = 'https://talkingcalender.com/';
  static const String _defaultProductionApiBaseUrl = 'https://talkingcalender.com/';
  static const String _debugApiBaseUrl = 'http://10.150.201.189:5000/';

  static const String _configuredAppUrl =
      String.fromEnvironment('APP_URL', defaultValue: _defaultProductionAppUrl);
  static const String _configuredApiBaseUrl =
      String.fromEnvironment('API_BASE_URL', defaultValue: _defaultProductionApiBaseUrl);

  static String get appUrl => _configuredAppUrl;
  static String get apiBaseUrl => kDebugMode ? _debugApiBaseUrl : _configuredApiBaseUrl;
  static Uri get pushRegisterEndpoint => Uri.parse(apiBaseUrl).resolve('/api/push/register-token');
  static Uri get pushSendEndpoint => Uri.parse(apiBaseUrl).resolve('/api/push/send');
}
