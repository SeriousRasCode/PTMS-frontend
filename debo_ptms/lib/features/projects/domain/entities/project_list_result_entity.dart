import 'package:debo_ptms/features/projects/domain/entities/project_entity.dart';

class ProjectListResultEntity {
  const ProjectListResultEntity({required this.projects, required this.notice});

  final List<ProjectEntity> projects;
  final String? notice;
}
