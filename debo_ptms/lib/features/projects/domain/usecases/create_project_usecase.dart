import 'package:debo_ptms/features/projects/domain/entities/create_project_input.dart';
import 'package:debo_ptms/features/projects/domain/repositories/projects_repository.dart';

class CreateProjectUseCase {
  const CreateProjectUseCase(this._repository);

  final ProjectsRepository _repository;

  Future<void> call(CreateProjectInput input) {
    return _repository.createProject(input);
  }
}
