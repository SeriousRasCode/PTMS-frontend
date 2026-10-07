import 'package:debo_ptms/core/network/api_client.dart';

abstract class HomeRemoteDataSource {
  Future<List<Map<String, dynamic>>> getMyTeams();
}

class HomeRemoteDataSourceImpl implements HomeRemoteDataSource {
  HomeRemoteDataSourceImpl(this._apiClient);

  final ApiClient _apiClient;

  @override
  Future<List<Map<String, dynamic>>> getMyTeams() async {
    final response = await _apiClient.get('/api/teams/my-teams');
    final payload = response['data'];
    if (payload is! List) {
      return const [];
    }

    return payload
        .whereType<Map>()
        .map((item) => item.map((k, v) => MapEntry(k.toString(), v)))
        .toList(growable: false);
  }
}
