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
import 'package:debo_ptms/shared/widgets/app_drawer.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class ProjectsListScreen extends StatefulWidget {
  const ProjectsListScreen({super.key});

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

  @override
  Widget build(BuildContext context) {
    final role = context.select((UserAuthBloc b) => b.state.user?.role);
    final canCreate = AppRoles.isManager(role);

    return Scaffold(
      drawer: const AppDrawer(),
      appBar: AppBar(
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
          if (canCreate)
            IconButton(
              onPressed: () async {
                final created = await Navigator.of(context).push<bool>(
                  MaterialPageRoute(
                    builder: (_) => const CreateProjectScreen(),
                  ),
                );
                if (created == true) {
                  _load();
                }
              },
              icon: const Icon(Icons.add),
              tooltip: 'Create project',
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
              child: _projects.isEmpty
                  ? ListView(
                      padding: const EdgeInsets.all(16),
                      children: [
                        if (_notice != null)
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
                        const Card(
                          child: Padding(
                            padding: EdgeInsets.all(16),
                            child: Text('No projects found. Project Managers can create one using the + button.'),
                          ),
                        ),
                      ],
                    )
                  : ListView.builder(
                      padding: const EdgeInsets.all(16),
                      itemCount: _projects.length + (_notice != null ? 1 : 0),
                      itemBuilder: (context, index) {
                        if (_notice != null && index == 0) {
                          return Card(
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
                          );
                        }

                        final adjustedIndex = index - (_notice != null ? 1 : 0);
                        final p = _projects[adjustedIndex];
                        final id = p.id;
                        final name = p.name;
                        final status = p.status;
                        final teamName = p.teamName;

                        return Padding(
                          padding: EdgeInsets.only(
                            top: adjustedIndex == 0 && _notice == null ? 0 : 10,
                          ),
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
                                      projectName: name.isEmpty
                                          ? 'Project'
                                          : name,
                                      initialStatus: status,
                                    ),
                                  ),
                                );
                              },
                            ),
                          ),
                        );
                      },
                    ),
            ),
    );
  }
}
