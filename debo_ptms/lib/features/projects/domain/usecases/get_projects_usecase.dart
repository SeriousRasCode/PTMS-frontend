import 'package:debo_ptms/features/projects/domain/entities/project_list_result_entity.dart';
import 'package:debo_ptms/features/projects/domain/repositories/projects_repository.dart';

class GetProjectsUseCase {
  const GetProjectsUseCase(this._repository);

  final ProjectsRepository _repository;

  Future<ProjectListResultEntity> call({required bool isAdmin}) {
    return _repository.getProjects(isAdmin: isAdmin);
  }
}
