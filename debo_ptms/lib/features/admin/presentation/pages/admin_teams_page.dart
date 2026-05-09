import 'package:debo_ptms/core/network/api_client.dart';
import 'package:debo_ptms/core/theme/app_colors.dart';
import 'package:debo_ptms/features/admin/data/datasources/admin_remote_data_source.dart';
import 'package:debo_ptms/features/admin/data/repositories/admin_repository_impl.dart';
import 'package:debo_ptms/features/admin/domain/entities/admin_team_entity.dart';
import 'package:debo_ptms/features/admin/domain/usecases/create_team_usecase.dart';
import 'package:debo_ptms/features/admin/domain/usecases/get_all_teams_usecase.dart';
import 'package:debo_ptms/shared/widgets/app_drawer.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class AdminTeamsScreen extends StatefulWidget {
  const AdminTeamsScreen({super.key});

  @override
  State<AdminTeamsScreen> createState() => _AdminTeamsScreenState();
}

class _AdminTeamsScreenState extends State<AdminTeamsScreen> {
  bool _loading = true;
  String? _error;
  List<AdminTeamEntity> _teams = const [];
  final TextEditingController _teamNameController = TextEditingController();

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

  @override
  void dispose() {
    _teamNameController.dispose();
    super.dispose();
  }

  Future<void> _load() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final apiClient = context.read<ApiClient>();
      final repository = AdminRepositoryImpl(
        AdminRemoteDataSourceImpl(apiClient),
      );
      final useCase = GetAllTeamsUseCase(repository);
      _teams = await useCase();
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _createTeam() async {
    final teamName = _teamNameController.text.trim();
    if (teamName.isEmpty) {
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(const SnackBar(content: Text('Team name is required.')));
      return;
    }

    try {
      final apiClient = context.read<ApiClient>();
      final repository = AdminRepositoryImpl(
        AdminRemoteDataSourceImpl(apiClient),
      );
      final useCase = CreateTeamUseCase(repository);
      await useCase(name: teamName);
      _teamNameController.clear();
      if (!mounted) return;
      FocusScope.of(context).unfocus();
      await _load();
      if (!mounted) return;
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Team created successfully.')),
      );
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const AppDrawer(),
      appBar: AppBar(
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          tooltip: 'Back',
          onPressed: () => Navigator.maybePop(context),
        ),
        title: const Text('Team Management'),
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
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(16),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const Text(
                            'Create Team',
                            style: TextStyle(fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 6),
                          const Text(
                            'Create a new team for project assignments.',
                            style: TextStyle(color: AppColors.textMuted),
                          ),
                          const SizedBox(height: 10),
                          TextField(
                            controller: _teamNameController,
                            decoration: const InputDecoration(
                              labelText: 'Team name',
                            ),
                          ),
                          const SizedBox(height: 10),
                          SizedBox(
                            width: double.infinity,
                            child: ElevatedButton.icon(
                              onPressed: _createTeam,
                              icon: const Icon(Icons.group_add),
                              label: const Text('Create Team'),
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  const SizedBox(height: 12),
                  ..._teams.map((team) {
                    final id = team.id.toString();
                    final name = team.name.isEmpty ? 'Team' : team.name;
                    final createdBy = team.createdBy;
                    return Padding(
                      padding: const EdgeInsets.only(bottom: 10),
                      child: Card(
                        child: ListTile(
                          title: Text(name),
                          subtitle: Text(
                            [
                              'Team ID: $id',
                              if (createdBy.isNotEmpty)
                                'Created by: $createdBy',
                            ].join(' • '),
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
