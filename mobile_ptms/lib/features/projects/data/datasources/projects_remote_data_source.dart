import 'package:debo_ptms/core/network/api_client.dart';
import 'package:debo_ptms/features/projects/domain/entities/create_project_input.dart';

abstract class ProjectsRemoteDataSource {
  Future<List<Map<String, dynamic>>> getAllProjects();
  Future<List<Map<String, dynamic>>> getMyProjects();
  Future<List<Map<String, dynamic>>> getMyTasks();
  Future<List<Map<String, dynamic>>> getProjectTasks({required int projectId});
  Future<void> createProject(CreateProjectInput input);
}

class ProjectsRemoteDataSourceImpl implements ProjectsRemoteDataSource {
  ProjectsRemoteDataSourceImpl(this._apiClient);

  final ApiClient _apiClient;

  @override
  Future<List<Map<String, dynamic>>> getAllProjects() async {
    final response = await _apiClient.get('/api/all-projects');
    return _toListMap(response['data']);
  }

  @override
  Future<List<Map<String, dynamic>>> getMyProjects() async {
    final response = await _apiClient.get('/api/projects/my-projects');
    return _toListMap(response['data']);
  }

  @override
  Future<List<Map<String, dynamic>>> getMyTasks() async {
    final response = await _apiClient.get('/api/tasks/my-tasks');
    return _toListMap(response['data']);
  }

  @override
  Future<List<Map<String, dynamic>>> getProjectTasks({required int projectId}) async {
    final response = await _apiClient.get('/api/tasks/projects/$projectId');
    return _toListMap(response['data']);
  }

  @override
  Future<void> createProject(CreateProjectInput input) {
    return _apiClient.post(
      '/api/create-projects',
      body: {
        'name': input.name,
        'description': input.description,
        'team_id': input.teamId,
        if (input.startDate != null) 'start_date': _fmtDate(input.startDate!),
        if (input.endDate != null) 'end_date': _fmtDate(input.endDate!),
      },
    );
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

  String _fmtDate(DateTime date) {
    final mm = date.month.toString().padLeft(2, '0');
    final dd = date.day.toString().padLeft(2, '0');
    return '${date.year}-$mm-$dd';
  }
}
