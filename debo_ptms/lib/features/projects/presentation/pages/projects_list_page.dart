import 'package:debo_ptms/core/network/api_client.dart';
import 'package:debo_ptms/core/theme/app_colors.dart';
import 'package:debo_ptms/core/constants/role_constants.dart';
import 'package:debo_ptms/features/projects/data/datasources/projects_remote_data_source.dart';
import 'package:debo_ptms/features/projects/data/repositories/projects_repository_impl.dart';
import 'package:debo_ptms/features/projects/domain/entities/project_entity.dart';
import 'package:debo_ptms/features/projects/domain/usecases/get_projects_usecase.dart';
import 'package:debo_ptms/features/user/presentation/bloc/user_auth_bloc.dart';
import 'package:debo_ptms/features/projects/presentation/pages/project_details_page.dart';
import 'package:debo_ptms/features/projects/presentation/pages/create_project_page.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class ProjectsListScreen extends StatefulWidget {
  const ProjectsListScreen({super.key, this.onOpenDrawer});

  final VoidCallback? onOpenDrawer;

  @override
  State<ProjectsListScreen> createState() => _ProjectsListScreenState();
}

class _ProjectsListScreenState extends State<ProjectsListScreen> {
  bool _loading = true;
  String? _error;
  String? _notice;
  List<ProjectEntity> _projects = const [];

  void _showNotifications() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('No new notifications right now.')),
    );
  }

  @override
  void initState() {
    super.initState();
    _load();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
      _notice = null;
    });

    try {
      final apiClient = context.read<ApiClient>();
      final role = context.read<UserAuthBloc>().state.user?.role;

      final useCase = GetProjectsUseCase(
        ProjectsRepositoryImpl(ProjectsRemoteDataSourceImpl(apiClient)),
      );

      final result = await useCase(isAdmin: AppRoles.isAdmin(role));
      _projects = result.projects;
      _notice = result.notice;
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _openCreateProject() async {
    final created = await Navigator.of(context).push<bool>(
      MaterialPageRoute(
        builder: (_) => const CreateProjectScreen(),
      ),
    );
    if (created == true) {
      _load();
    }
  }

  @override
  Widget build(BuildContext context) {
    final role = context.select((UserAuthBloc b) => b.state.user?.role);
    final canCreate = AppRoles.isManager(role);

    return Scaffold(
      appBar: AppBar(
        leading: Builder(
          builder: (context) => IconButton(
            icon: const Icon(Icons.menu_rounded),
            tooltip: 'Menu',
            onPressed: () {
              if (widget.onOpenDrawer != null) {
                widget.onOpenDrawer!();
              } else {
                Scaffold.maybeOf(context)?.openDrawer();
              }
            },
          ),
        ),
        title: const Text('Projects'),
        flexibleSpace: Container(
          decoration: const BoxDecoration(gradient: AppColors.brandGradient),
        ),
        actions: [
          IconButton(
            onPressed: _showNotifications,
            icon: const Icon(Icons.notifications_none_rounded),
            tooltip: 'Notifications',
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
                  if (_notice != null) ...[
                    Card(
                      color: const Color(0xFFE8F2FF),
                      child: Padding(
                        padding: const EdgeInsets.all(12),
                        child: Text(
                          _notice!,
                          style: const TextStyle(
                            color: AppColors.brandPrimary,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                  if (canCreate) ...[
                    Card(
                      child: Padding(
                        padding: const EdgeInsets.all(16),
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Create Project',
                              style: TextStyle(fontWeight: FontWeight.bold),
                            ),
                            const SizedBox(height: 6),
                            const Text(
                              'Start a new project and assign a team.',
                              style: TextStyle(color: AppColors.textMuted),
                            ),
                            const SizedBox(height: 12),
                            SizedBox(
                              width: double.infinity,
                              child: ElevatedButton.icon(
                                onPressed: _openCreateProject,
                                icon: const Icon(Icons.add_circle_outline),
                                label: const Text('Create Project'),
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                  ],
                  if (_projects.isEmpty)
                    const Card(
                      child: Padding(
                        padding: EdgeInsets.all(16),
                        child: Text('No projects found yet.'),
                      ),
                    )
                  else
                    ..._projects.map((p) {
                      final id = p.id;
                      final name = p.name;
                      final status = p.status;
                      final teamName = p.teamName;

                      return Padding(
                        padding: const EdgeInsets.only(bottom: 10),
                        child: Card(
                          child: ListTile(
                            title: Text(name.isEmpty ? 'Project #$id' : name),
                            subtitle: Text(
                              [
                                if (teamName.isNotEmpty) 'Team: $teamName',
                                if (status.isNotEmpty) 'Status: $status',
                              ].join(' • '),
                            ),
                            trailing: const Icon(Icons.chevron_right),
                            onTap: () {
                              Navigator.of(context).push(
                                MaterialPageRoute(
                                  builder: (_) => ProjectDetailsScreen(
                                    projectId: id,
                                    projectName:
                                        name.isEmpty ? 'Project' : name,
                                    initialStatus: status,
                                  ),
                                ),
                              );
                            },
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
