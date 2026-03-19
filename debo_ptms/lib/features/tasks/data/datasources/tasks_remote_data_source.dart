import 'package:debo_ptms/core/network/api_client.dart';
import 'package:debo_ptms/features/tasks/domain/entities/create_task_input.dart';
import 'package:debo_ptms/features/tasks/domain/entities/task_progress_update_input.dart';

abstract class TasksRemoteDataSource {
  Future<List<Map<String, dynamic>>> getMyTasks();
  Future<void> createTask(CreateTaskInput input);
  Future<void> updateProgress(TaskProgressUpdateInput input);
  Future<void> assignTask({required int taskId, required int userId});
  Future<List<Map<String, dynamic>>> getTaskHistory({required int taskId});
}

class TasksRemoteDataSourceImpl implements TasksRemoteDataSource {
  TasksRemoteDataSourceImpl(this._apiClient);

  final ApiClient _apiClient;

  @override
  Future<List<Map<String, dynamic>>> getMyTasks() async {
    final response = await _apiClient.get('/api/tasks/my-tasks');
    return _toListMap(response['data']);
  }

  @override
  Future<void> createTask(CreateTaskInput input) {
    return _apiClient.post(
      '/api/tasks/projects/${input.projectId}',
      body: {
        'title': input.title,
        'description': input.description,
        if (input.startDate != null) 'start_date': _fmtDate(input.startDate!),
        if (input.dueDate != null) 'due_date': _fmtDate(input.dueDate!),
        'progress_percentage': 0,
      },
    );
  }

  @override
  Future<void> updateProgress(TaskProgressUpdateInput input) {
    return _apiClient.patch(
      '/api/tasks/${input.taskId}/progress',
      body: {
        'progress_percentage': input.progress,
        if ((input.note ?? '').trim().isNotEmpty)
          'update_note': input.note!.trim(),
      },
    );
  }

  @override
  Future<void> assignTask({required int taskId, required int userId}) {
    return _apiClient.post(
      '/api/tasks/$taskId/assign',
      body: {'userId': userId},
    );
  }

  @override
  Future<List<Map<String, dynamic>>> getTaskHistory({
    required int taskId,
  }) async {
    final response = await _apiClient.get('/api/tasks/$taskId/history');
    return _toListMap(response['data']);
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
