import 'package:debo_ptms/core/network/api_client.dart';

abstract class AdminRemoteDataSource {
  Future<List<Map<String, dynamic>>> getAllUsers();
  Future<void> changeUserStatus({required int userId, required bool isActive});
  Future<void> changeUserRole({required int userId, required String roleName});

  Future<List<Map<String, dynamic>>> getAllTeams();
  Future<void> createTeam({required String name});
}

//hello
class AdminRemoteDataSourceImpl implements AdminRemoteDataSource {
  AdminRemoteDataSourceImpl(this._apiClient);

  final ApiClient _apiClient;

  @override
  Future<List<Map<String, dynamic>>> getAllUsers() async {
    final response = await _apiClient.get('/api/admin/all-users');
    return _toListMap(response['data']);
  }

  @override
  Future<void> changeUserStatus({required int userId, required bool isActive}) {
    return _apiClient.patch(
      '/api/admin/users/$userId/change-status',
      body: {'is_active': isActive},
    );
  }

  @override
  Future<void> changeUserRole({required int userId, required String roleName}) {
    return _apiClient.post(
      '/api/admin/users/$userId/change-roles',
      body: {'roleName': roleName},
    );
  }

  @override
  Future<List<Map<String, dynamic>>> getAllTeams() async {
    final response = await _apiClient.get('/api/teams/all-teams');
    return _toListMap(response['data']);
  }

  @override
  Future<void> createTeam({required String name}) {
    return _apiClient.post('/api/teams/create', body: {'name': name});
  }

  List<Map<String, dynamic>> _toListMap(dynamic payload) {
    if (payload is! List) {
      return const [];
    }

    return payload
        .whereType<Map>()
        .map((item) => item.map((k, v) => MapEntry(k.toString(), v)))
        .toList(growable: false);
  }
}
