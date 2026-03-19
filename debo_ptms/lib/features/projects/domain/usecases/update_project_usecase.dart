import 'package:debo_ptms/features/projects/domain/entities/update_project_input.dart';
import 'package:debo_ptms/features/projects/domain/repositories/projects_repository.dart';

class UpdateProjectUseCase {
  const UpdateProjectUseCase(this._repository);

  final ProjectsRepository _repository;

  Future<void> call(UpdateProjectInput input) {
    return _repository.updateProject(input);
  }
}
