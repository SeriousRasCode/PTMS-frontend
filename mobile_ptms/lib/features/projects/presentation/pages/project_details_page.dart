import 'package:debo_ptms/core/network/api_client.dart';
import 'package:debo_ptms/core/theme/app_colors.dart';
import 'package:debo_ptms/core/constants/role_constants.dart';
import 'package:debo_ptms/features/projects/data/datasources/projects_remote_data_source.dart';
import 'package:debo_ptms/features/projects/data/repositories/projects_repository_impl.dart';
import 'package:debo_ptms/features/projects/domain/entities/project_task_entity.dart';
import 'package:debo_ptms/features/projects/domain/usecases/get_project_tasks_usecase.dart';
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
  });

  final int projectId;
  final String projectName;

  @override
  State<ProjectDetailsScreen> createState() => _ProjectDetailsScreenState();
}

class _ProjectDetailsScreenState extends State<ProjectDetailsScreen> {
  bool _loading = true;
  String? _error;
  List<ProjectTaskEntity> _tasks = const [];

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final apiClient = context.read<ApiClient>();
      final useCase = GetProjectTasksUseCase(
        ProjectsRepositoryImpl(
          ProjectsRemoteDataSourceImpl(apiClient),
        ),
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

  @override
  Widget build(BuildContext context) {
    final role = context.select((UserAuthBloc b) => b.state.user?.role);
    final canCreateTask = AppRoles.isManager(role);

    return Scaffold(
      appBar: AppBar(
        title: Text(widget.projectName),
        flexibleSpace: Container(
          decoration: const BoxDecoration(gradient: AppColors.brandGradient),
        ),
        actions: [
          if (canCreateTask)
            IconButton(
              onPressed: () async {
                final created = await Navigator.of(context).push<bool>(
                  MaterialPageRoute(
                    builder: (_) => CreateTaskScreen(projectId: widget.projectId),
                  ),
                );
                if (created == true) {
                  _load();
                }
              },
              icon: const Icon(Icons.add_task),
              tooltip: 'Create task',
            ),
        ],
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
                        ElevatedButton(onPressed: _load, child: const Text('Retry')),
                      ],
                    ),
                  ),
                )
              : RefreshIndicator(
                  onRefresh: _load,
                  child: _tasks.isEmpty
                      ? ListView(
                          padding: const EdgeInsets.all(16),
                          children: const [
                            Card(
                              child: Padding(
                                padding: EdgeInsets.all(16),
                                child: Text('No tasks in this project.'),
                              ),
                            ),
                          ],
                        )
                      : ListView.separated(
                          padding: const EdgeInsets.all(16),
                          itemCount: _tasks.length,
                          separatorBuilder: (_, _) => const SizedBox(height: 10),
                          itemBuilder: (context, index) {
                            final t = _tasks[index];
                            final id = t.id;
                            final title = t.title;
                            final status = t.status;
                            final progress = t.progress;

                            return Card(
                              child: ListTile(
                                title: Text(title.isEmpty ? 'Task #$id' : title),
                                subtitle: Text('Status: $status • Progress: $progress%'),
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
                            );
                          },
                        ),
                ),
    );
  }

}
