import 'package:debo_ptms/core/network/api_client.dart';

abstract class DashboardRemoteDataSource {
  Future<Map<String, dynamic>> getAdminSummary();
  Future<Map<String, dynamic>> getManagerSummary();
}

class DashboardRemoteDataSourceImpl implements DashboardRemoteDataSource {
  DashboardRemoteDataSourceImpl(this._apiClient);

  final ApiClient _apiClient;

  @override
  Future<Map<String, dynamic>> getAdminSummary() async {
    final response = await _apiClient.get('/api/dashboard/admin-summary');
    final data = response['data'];
    if (data is Map<String, dynamic>) {
      return data;
    }
    return <String, dynamic>{'raw': data};
  }

  @override
  Future<Map<String, dynamic>> getManagerSummary() async {
    final response = await _apiClient.get('/api/dashboard/manager');
    final data = response['data'];
    if (data is Map<String, dynamic>) {
      return data;
    }
    return <String, dynamic>{'raw': data};
  }
}
