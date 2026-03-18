import 'package:debo_ptms/features/user/data/models/user_model.dart';

class AuthResponseModel {
  const AuthResponseModel({required this.token, required this.user});

  final String token;
  final UserModel user;

  factory AuthResponseModel.fromJson(Map<String, dynamic> json) {
    final token = _extractToken(json);
    final userJson = _extractUser(json);

    return AuthResponseModel(token: token, user: UserModel.fromJson(userJson));
  }

  static String _extractToken(Map<String, dynamic> json) {
    final directToken =
        json['token'] ?? json['accessToken'] ?? json['access_token'];

    if (directToken != null && directToken.toString().isNotEmpty) {
      return directToken.toString();
    }

    final data = json['data'];
    if (data is Map<String, dynamic>) {
      final nestedToken =
          data['token'] ?? data['accessToken'] ?? data['access_token'];
      if (nestedToken != null && nestedToken.toString().isNotEmpty) {
        return nestedToken.toString();
      }
    }

    return '';
  }

  static Map<String, dynamic> _extractUser(Map<String, dynamic> json) {
    final directUser = json['user'];
    if (directUser is Map<String, dynamic>) return directUser;

    final data = json['data'];
    if (data is Map<String, dynamic>) {
      final nestedUser = data['user'];
      if (nestedUser is Map<String, dynamic>) return nestedUser;

      // Some APIs return profile fields directly under data.
      if (data['email'] != null || data['full_name'] != null) {
        return data;
      }
    }

    return json;
  }
}
