import 'package:debo_ptms/features/tasks/domain/repositories/tasks_repository.dart';

class AssignTaskUseCase {
  const AssignTaskUseCase(this._repository);

  final TasksRepository _repository;

  Future<void> call({required int taskId, required int userId}) {
    return _repository.assignTask(taskId: taskId, userId: userId);
  }
}
