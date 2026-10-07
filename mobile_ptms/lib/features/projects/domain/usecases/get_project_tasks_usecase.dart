import 'package:debo_ptms/features/projects/domain/entities/project_task_entity.dart';
import 'package:debo_ptms/features/projects/domain/repositories/projects_repository.dart';

class GetProjectTasksUseCase {
  const GetProjectTasksUseCase(this._repository);

  final ProjectsRepository _repository;

  Future<List<ProjectTaskEntity>> call({required int projectId}) {
    return _repository.getProjectTasks(projectId: projectId);
  }
}
