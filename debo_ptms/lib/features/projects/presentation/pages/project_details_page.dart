import 'package:debo_ptms/core/network/api_client.dart';
import 'package:debo_ptms/core/theme/app_colors.dart';
import 'package:debo_ptms/core/constants/role_constants.dart';
import 'package:debo_ptms/features/projects/data/datasources/projects_remote_data_source.dart';
import 'package:debo_ptms/features/projects/data/repositories/projects_repository_impl.dart';
import 'package:debo_ptms/features/projects/domain/entities/project_documentation_input.dart';
import 'package:debo_ptms/features/projects/domain/entities/project_task_entity.dart';
import 'package:debo_ptms/features/projects/domain/entities/update_project_input.dart';
import 'package:debo_ptms/features/projects/domain/usecases/get_project_tasks_usecase.dart';
import 'package:debo_ptms/features/projects/domain/usecases/submit_project_documentation_usecase.dart';
import 'package:debo_ptms/features/projects/domain/usecases/update_project_usecase.dart';
import 'package:debo_ptms/features/user/presentation/bloc/user_auth_bloc.dart';
import 'package:debo_ptms/features/tasks/presentation/pages/create_task_page.dart';
import 'package:debo_ptms/features/tasks/presentation/pages/task_details_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class ProjectDetailsScreen extends StatefulWidget {
  const ProjectDetailsScreen({
    super.key,
    required this.projectId,
    required this.projectName,
    this.initialStatus = 'planned',
  });

  final int projectId;
  final String projectName;
  final String initialStatus;

  @override
  State<ProjectDetailsScreen> createState() => _ProjectDetailsScreenState();
}

class _ProjectDetailsScreenState extends State<ProjectDetailsScreen> {
  bool _loading = true;
  bool _savingProject = false;
  bool _submittingDocumentation = false;
  String? _error;
  List<ProjectTaskEntity> _tasks = const [];
  String _projectStatus = 'planned';
  final _projectDescription = TextEditingController();
  final _documentationTitle = TextEditingController();
  final _documentationBody = TextEditingController();

  static const List<String> _projectStatuses = [
    'planned',
    'active',
    'completed',
    'on_hold',
  ];

  @override
  void initState() {
    super.initState();
    final status = widget.initialStatus.trim().toLowerCase();
    _projectStatus = _projectStatuses.contains(status) ? status : 'planned';
    _load();
  }

  @override
  void dispose() {
    _projectDescription.dispose();
    _documentationTitle.dispose();
    _documentationBody.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final apiClient = context.read<ApiClient>();
      final useCase = GetProjectTasksUseCase(
        ProjectsRepositoryImpl(ProjectsRemoteDataSourceImpl(apiClient)),
      );
      _tasks = await useCase(projectId: widget.projectId);
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _openCreateTask() async {
    final created = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => CreateTaskScreen(projectId: widget.projectId),
      ),
    );
    if (created == true) {
      _load();
    }
  }

  Future<void> _updateProject() async {
    setState(() => _savingProject = true);
    try {
      final apiClient = context.read<ApiClient>();
      final repository = ProjectsRepositoryImpl(
        ProjectsRemoteDataSourceImpl(apiClient),
      );
      final useCase = UpdateProjectUseCase(repository);
      await useCase(
        UpdateProjectInput(
          projectId: widget.projectId,
          name: widget.projectName,
          description: _projectDescription.text.trim(),
          status: _projectStatus,
        ),
      );

      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Project updated successfully.')),
      );
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) {
        setState(() => _savingProject = false);
      }
    }
  }

  Future<void> _submitDocumentation() async {
    final title = _documentationTitle.text.trim();
    final content = _documentationBody.text.trim();
    if (title.isEmpty || content.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(
          content: Text('Documentation title and details are required.'),
        ),
      );
      return;
    }

    setState(() => _submittingDocumentation = true);
    try {
      final apiClient = context.read<ApiClient>();
      final repository = ProjectsRepositoryImpl(
        ProjectsRemoteDataSourceImpl(apiClient),
      );
      final useCase = SubmitProjectDocumentationUseCase(repository);
      await useCase(
        ProjectDocumentationInput(
          projectId: widget.projectId,
          projectName: widget.projectName,
          projectStatus: _projectStatus,
          title: title,
          content: content,
        ),
      );

      if (!mounted) return;
      _documentationTitle.clear();
      _documentationBody.clear();
      FocusScope.of(context).unfocus();
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Documentation submitted.')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.toString())));
    } finally {
      if (mounted) {
        setState(() => _submittingDocumentation = false);
      }
    }
  }

  @override
  Widget build(BuildContext context) {
    final role = context.select((UserAuthBloc b) => b.state.user?.role);
    final canCreateTask = AppRoles.isManager(role);
    final completedCount = _tasks.where((t) => t.progress >= 100).length;
    final averageProgress = _tasks.isEmpty
        ? 0
        : (_tasks.fold<int>(0, (sum, t) => sum + t.progress) / _tasks.length)
              .round();

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.projectName),
        flexibleSpace: Container(
          decoration: const BoxDecoration(gradient: AppColors.brandGradient),
        ),
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _error != null
          ? Center(
              child: Padding(
                padding: const EdgeInsets.all(16),
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Text(_error!, textAlign: TextAlign.center),
                    const SizedBox(height: 12),
                    ElevatedButton(
                      onPressed: _load,
                      child: const Text('Retry'),
                    ),
                  ],
                ),
              ),
            )
          : RefreshIndicator(
              onRefresh: _load,
              child: ListView(
                padding: const EdgeInsets.all(16),
                children: [
                  if (canCreateTask)
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Project Management',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 10),
                            DropdownButtonFormField<String>(
                              value: _projectStatus,
                              decoration: const InputDecoration(
                                labelText: 'Project status',
                              ),
                              items: _projectStatuses
                                  .map(
                                    (status) => DropdownMenuItem<String>(
                                      value: status,
                                      child: Text(status),
                                    ),
                                  )
                                  .toList(growable: false),
                              onChanged: _savingProject
                                  ? null
                                  : (value) {
                                      if (value == null) return;
                                      setState(() => _projectStatus = value);
                                    },
                            ),
                            const SizedBox(height: 10),
                            TextField(
                              controller: _projectDescription,
                              minLines: 2,
                              maxLines: 4,
                              decoration: const InputDecoration(
                                labelText: 'Project description',
                              ),
                            ),
                            const SizedBox(height: 12),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: _savingProject ? null : _updateProject,
                                child: _savingProject
                                    ? const SizedBox(
                                        height: 18,
                                        width: 18,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          color: Colors.white,
                                        ),
                                      )
                                    : const Text('Save Project Changes'),
                              ),
                            ),
                            const SizedBox(height: 14),
                            const Divider(),
                            const SizedBox(height: 8),
                            const Text(
                              'Submit Documentation',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 10),
                            TextField(
                              controller: _documentationTitle,
                              decoration: const InputDecoration(
                                labelText: 'Documentation title',
                              ),
                            ),
                            const SizedBox(height: 10),
                            TextField(
                              controller: _documentationBody,
                              minLines: 3,
                              maxLines: 6,
                              decoration: const InputDecoration(
                                labelText: 'Documentation details',
                              ),
                            ),
                            const SizedBox(height: 12),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton(
                                onPressed: _submittingDocumentation
                                    ? null
                                    : _submitDocumentation,
                                child: _submittingDocumentation
                                    ? const SizedBox(
                                        height: 18,
                                        width: 18,
                                        child: CircularProgressIndicator(
                                          strokeWidth: 2,
                                          color: Colors.white,
                                        ),
                                      )
                                    : const Text('Submit Documentation'),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                  if (canCreateTask) ...[
                    const SizedBox(height: 12),
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Create Task',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'Add a new task for this project.',
                              style: TextStyle(color: AppColors.textMuted),
                            ),
                            const SizedBox(height: 12),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton.icon(
                                onPressed: _openCreateTask,
                                icon: const Icon(Icons.add_task),
                                label: const Text('Create Task'),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                  const Text(
                    'Tasks',
                    style: TextStyle(fontWeight: FontWeight.bold),
                  ),
                  const SizedBox(height: 10),
                  if (_tasks.isNotEmpty)
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(14),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              'Project Progress: $averageProgress%',
                              style: const TextStyle(fontWeight: FontWeight.w700),
                            ),
                            const SizedBox(height: 8),
                            ClipRRect(
                              borderRadius: BorderRadius.circular(99),
                              child: LinearProgressIndicator(
                                value: averageProgress / 100,
                                minHeight: 8,
                                color: AppColors.brandPrimary,
                                backgroundColor: Colors.grey.shade300,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              'Completed Tasks: $completedCount/${_tasks.length}',
                              style: const TextStyle(color: AppColors.textMuted),
                            ),
                          ],
                        ),
                      ),
                    ),
                  if (_tasks.isNotEmpty) const SizedBox(height: 10),
                  if (_tasks.isEmpty)
                    const Card(
                      child: Padding(
                        padding: EdgeInsets.all(16),
                        child: Text('No tasks in this project.'),
                      ),
                    )
                  else
                    ..._tasks.map((t) {
                      final id = t.id;
                      final title = t.title;
                      final status = t.status;
                      final progress = t.progress;

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Card(
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                ListTile(
                                  contentPadding: EdgeInsets.zero,
                                  title: Text(title.isEmpty ? 'Task #$id' : title),
                                  subtitle: Text(
                                    'Status: $status • Progress: $progress%',
                                  ),
                                  trailing: const Icon(Icons.chevron_right),
                                  onTap: () {
                                    Navigator.of(context).push(
                                      MaterialPageRoute(
                                        builder: (_) => TaskDetailsScreen(
                                          taskId: id,
                                          initialTitle: title,
                                          initialStatus: status,
                                          initialProgress: progress,
                                        ),
                                      ),
                                    );
                                  },
                                ),
                                ClipRRect(
                                  borderRadius: BorderRadius.circular(99),
                                  child: LinearProgressIndicator(
                                    value: progress.clamp(0, 100) / 100,
                                    minHeight: 8,
                                    color: progress >= 100
                                        ? Colors.green
                                        : AppColors.brandPrimary,
                                    backgroundColor: Colors.grey.shade300,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      );
                    }),
                ],
              ),
            ),
    );
  }
}
