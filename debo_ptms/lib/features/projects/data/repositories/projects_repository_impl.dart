import 'package:debo_ptms/features/projects/data/datasources/projects_remote_data_source.dart';
import 'package:debo_ptms/features/projects/domain/entities/create_project_input.dart';
import 'package:debo_ptms/features/projects/domain/entities/project_documentation_input.dart';
import 'package:debo_ptms/features/projects/domain/entities/project_entity.dart';
import 'package:debo_ptms/features/projects/domain/entities/project_list_result_entity.dart';
import 'package:debo_ptms/features/projects/domain/entities/project_task_entity.dart';
import 'package:debo_ptms/features/projects/domain/entities/update_project_input.dart';
import 'package:debo_ptms/features/projects/domain/repositories/projects_repository.dart';

class ProjectsRepositoryImpl implements ProjectsRepository {
  ProjectsRepositoryImpl(this._remoteDataSource);

  final ProjectsRemoteDataSource _remoteDataSource;

  @override
  Future<ProjectListResultEntity> getProjects({required bool isAdmin}) async {
    if (isAdmin) {
      final rows = await _remoteDataSource.getAllProjects();
      return ProjectListResultEntity(
        projects: rows.map(_mapProject).toList(growable: false),
        notice: null,
      );
    }

    try {
      final rows = await _remoteDataSource.getMyProjects();
      return ProjectListResultEntity(
        projects: rows.map(_mapProject).toList(growable: false),
        notice: null,
      );
    } catch (error) {
      final text = error.toString().toLowerCase();
      if (!(text.contains('order by clause') && text.contains('distinct'))) {
        rethrow;
      }

      final taskRows = await _remoteDataSource.getMyTasks();
      final deduped = <int, ProjectEntity>{};

      for (final row in taskRows) {
        final id = _readInt(row['project_id']);
        if (id == null) {
          continue;
        }

        deduped.putIfAbsent(
          id,
          () => ProjectEntity(
            id: id,
            name: _toProjectName(row['project_name'], id),
            status: 'active',
            teamName: (row['team_name'] ?? '').toString(),
          ),
        );
      }

      return ProjectListResultEntity(
        projects: deduped.values.toList(growable: false),
        notice:
            'Projects service is temporarily unavailable. Showing projects from your tasks.',
      );
    }
  }

  @override
  Future<List<ProjectTaskEntity>> getProjectTasks({
    required int projectId,
  }) async {
    final rows = await _remoteDataSource.getProjectTasks(projectId: projectId);
    return rows
        .map(
          (row) => ProjectTaskEntity(
            id: _readInt(row['id']) ?? 0,
            title: (row['title'] ?? '').toString(),
            status: (row['status'] ?? '').toString(),
            progress: _readInt(row['progress_percentage']) ?? 0,
          ),
        )
        .toList(growable: false);
  }

  @override
  Future<void> createProject(CreateProjectInput input) {
    return _remoteDataSource.createProject(input);
  }

  @override
  Future<void> updateProject(UpdateProjectInput input) {
    return _remoteDataSource.updateProject(input);
  }

  @override
  Future<void> submitProjectDocumentation(ProjectDocumentationInput input) {
    return _remoteDataSource.submitProjectDocumentation(input);
  }

  ProjectEntity _mapProject(Map<String, dynamic> row) {
    final id = _readInt(row['id']) ?? 0;
    return ProjectEntity(
      id: id,
      name: _toProjectName(row['name'], id),
      status: (row['status'] ?? '').toString(),
      teamName: (row['team_name'] ?? '').toString(),
    );
  }

  String _toProjectName(dynamic value, int id) {
    final name = (value ?? '').toString();
    return name.isEmpty ? 'Project #$id' : name;
  }

  int? _readInt(dynamic value) {
    if (value is int) return value;
    if (value is num) return value.round();
    final text = value?.toString() ?? '';
    return int.tryParse(text) ?? double.tryParse(text)?.round();
  }
}
