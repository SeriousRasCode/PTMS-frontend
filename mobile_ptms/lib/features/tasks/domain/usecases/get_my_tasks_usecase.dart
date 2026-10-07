import 'package:debo_ptms/features/tasks/domain/entities/task_entity.dart';
import 'package:debo_ptms/features/tasks/domain/repositories/tasks_repository.dart';

class GetMyTasksUseCase {
  const GetMyTasksUseCase(this._repository);

  final TasksRepository _repository;

  Future<List<TaskEntity>> call() {
    return _repository.getMyTasks();
  }
}
