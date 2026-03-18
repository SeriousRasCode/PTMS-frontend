import 'package:debo_ptms/features/tasks/data/datasources/tasks_remote_data_source.dart';
import 'package:debo_ptms/features/tasks/domain/entities/create_task_input.dart';
import 'package:debo_ptms/features/tasks/domain/entities/task_entity.dart';
import 'package:debo_ptms/features/tasks/domain/entities/task_history_entity.dart';
import 'package:debo_ptms/features/tasks/domain/entities/task_progress_update_input.dart';
import 'package:debo_ptms/features/tasks/domain/repositories/tasks_repository.dart';

class TasksRepositoryImpl implements TasksRepository {
  TasksRepositoryImpl(this._remoteDataSource);

  final TasksRemoteDataSource _remoteDataSource;

  @override
  Future<List<TaskEntity>> getMyTasks() async {
    final rows = await _remoteDataSource.getMyTasks();
    return rows
        .map(
          (row) => TaskEntity(
            id: _readInt(row['id']) ?? 0,
            title: (row['title'] ?? '').toString(),
            status: (row['status'] ?? '').toString(),
            progress: _readInt(row['progress_percentage']) ?? 0,
            projectName: (row['project_name'] ?? '').toString(),
          ),
        )
        .toList(growable: false);
  }

  @override
  Future<void> createTask(CreateTaskInput input) {
    return _remoteDataSource.createTask(input);
  }

  @override
  Future<void> updateProgress(TaskProgressUpdateInput input) {
    return _remoteDataSource.updateProgress(input);
  }

  @override
  Future<void> assignTask({required int taskId, required int userId}) {
    return _remoteDataSource.assignTask(taskId: taskId, userId: userId);
  }

  @override
  Future<List<TaskHistoryEntity>> getTaskHistory({required int taskId}) async {
    final rows = await _remoteDataSource.getTaskHistory(taskId: taskId);
    return rows
        .map(
          (row) => TaskHistoryEntity(
            progress: _readInt(row['progress_percentage']) ?? 0,
            status: (row['status'] ?? '').toString(),
            note: (row['update_note'] ?? '').toString(),
            updatedBy: (row['full_name'] ?? '').toString(),
            updatedAt: (row['updated_at'] ?? '').toString(),
          ),
        )
        .toList(growable: false);
  }

  int? _readInt(dynamic value) {
    if (value is int) return value;
    return int.tryParse(value?.toString() ?? '');
  }
}
