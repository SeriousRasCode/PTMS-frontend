import 'package:debo_ptms/features/projects/domain/entities/project_documentation_input.dart';
import 'package:debo_ptms/features/projects/domain/repositories/projects_repository.dart';

class SubmitProjectDocumentationUseCase {
  const SubmitProjectDocumentationUseCase(this._repository);

  final ProjectsRepository _repository;

  Future<void> call(ProjectDocumentationInput input) {
    return _repository.submitProjectDocumentation(input);
  }
}
