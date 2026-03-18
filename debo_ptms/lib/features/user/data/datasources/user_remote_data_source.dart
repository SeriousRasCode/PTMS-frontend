import 'package:debo_ptms/core/error/app_exception.dart';
import 'package:debo_ptms/core/network/api_client.dart';
import 'package:debo_ptms/features/user/data/models/auth_response_model.dart';
import 'package:debo_ptms/features/user/data/models/user_model.dart';

abstract class UserRemoteDataSource {
  Future<AuthResponseModel> login({
    required String email,
    required String password,
  });

  Future<void> register({
    required String fullName,
    required String email,
    required String password,
    required int roleId,
  });

  Future<UserModel> getProfile();

  Future<UserModel> updateProfile({
    required String fullName,
    required String email,
  });
}

class UserRemoteDataSourceImpl implements UserRemoteDataSource {
  UserRemoteDataSourceImpl(this._apiClient);

  final ApiClient _apiClient;

  @override
  Future<AuthResponseModel> login({
    required String email,
    required String password,
  }) async {
    final response = await _apiClient.post(
      '/api/auth/login',
      body: {'email': email, 'password': password},
    );

    final auth = AuthResponseModel.fromJson(response);
    if (auth.token.isEmpty) {
      throw AppException('Token was not returned by the API.');
    }
    return auth;
  }

  @override
  Future<void> register({
    required String fullName,
    required String email,
    required String password,
    required int roleId,
  }) async {
    await _apiClient.post(
      '/api/auth/register',
      body: {
        'full_name': fullName,
        'email': email,
        'password': password,
        'role_id': roleId,
      },
    );
  }

  @override
  Future<UserModel> getProfile() async {
    final response = await _apiClient.get('/api/users/profile');
    final data = response['data'];
    if (data is Map<String, dynamic>) {
      return UserModel.fromJson(
        data['user'] is Map<String, dynamic>
            ? data['user'] as Map<String, dynamic>
            : data,
      );
    }

    return UserModel.fromJson(response);
  }

  @override
  Future<UserModel> updateProfile({
    required String fullName,
    required String email,
  }) async {
    final response = await _apiClient.put(
      '/api/users/update-me',
      body: {'full_name': fullName, 'email': email},
    );

    final data = response['data'];
    if (data is Map<String, dynamic>) {
      return UserModel.fromJson(
        data['user'] is Map<String, dynamic>
            ? data['user'] as Map<String, dynamic>
            : data,
      );
    }

    return UserModel.fromJson(response);
  }
}
