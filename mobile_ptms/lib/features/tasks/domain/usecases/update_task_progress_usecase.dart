import 'package:debo_ptms/features/tasks/domain/entities/task_progress_update_input.dart';
import 'package:debo_ptms/features/tasks/domain/repositories/tasks_repository.dart';

class UpdateTaskProgressUseCase {
  const UpdateTaskProgressUseCase(this._repository);

  final TasksRepository _repository;

  Future<void> call(TaskProgressUpdateInput input) {
    return _repository.updateProgress(input);
  }
}
