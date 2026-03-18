import 'package:debo_ptms/features/tasks/domain/entities/create_task_input.dart';
import 'package:debo_ptms/features/tasks/domain/entities/task_entity.dart';
import 'package:debo_ptms/features/tasks/domain/entities/task_history_entity.dart';
import 'package:debo_ptms/features/tasks/domain/entities/task_progress_update_input.dart';

abstract class TasksRepository {
  Future<List<TaskEntity>> getMyTasks();
  Future<void> createTask(CreateTaskInput input);
  Future<void> updateProgress(TaskProgressUpdateInput input);
  Future<void> assignTask({required int taskId, required int userId});
  Future<List<TaskHistoryEntity>> getTaskHistory({required int taskId});
}
