import 'package:debo_ptms/features/tasks/domain/entities/task_history_entity.dart';
import 'package:debo_ptms/features/tasks/domain/repositories/tasks_repository.dart';

class GetTaskHistoryUseCase {
  const GetTaskHistoryUseCase(this._repository);

  final TasksRepository _repository;

  Future<List<TaskHistoryEntity>> call({required int taskId}) {
    return _repository.getTaskHistory(taskId: taskId);
  }
}
