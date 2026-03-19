import 'package:debo_ptms/features/projects/domain/entities/create_project_input.dart';
import 'package:debo_ptms/features/projects/domain/entities/project_documentation_input.dart';
import 'package:debo_ptms/features/projects/domain/entities/project_list_result_entity.dart';
import 'package:debo_ptms/features/projects/domain/entities/project_task_entity.dart';
import 'package:debo_ptms/features/projects/domain/entities/update_project_input.dart';

abstract class ProjectsRepository {
  Future<ProjectListResultEntity> getProjects({required bool isAdmin});
  Future<List<ProjectTaskEntity>> getProjectTasks({required int projectId});
  Future<void> createProject(CreateProjectInput input);
  Future<void> updateProject(UpdateProjectInput input);
  Future<void> submitProjectDocumentation(ProjectDocumentationInput input);
}
