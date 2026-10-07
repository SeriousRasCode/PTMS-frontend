import 'package:flutter/foundation.dart';

class ApiConstants {
  ApiConstants._();

  static String get baseUrl {
    const fromEnv = String.fromEnvironment('BASE_URL', defaultValue: '');
    if (fromEnv.isNotEmpty) return fromEnv;

    // Defaults for local development.
    // Web: localhost points to the machine running Chrome.
    // Android emulator: 10.0.2.2 reaches the host machine.
    if (kIsWeb) return 'http://localhost:3000';

    switch (defaultTargetPlatform) {
      case TargetPlatform.android:
        return 'http://10.0.2.2:3000';
      default:
        return 'http://localhost:3000';
    }
  }
}
