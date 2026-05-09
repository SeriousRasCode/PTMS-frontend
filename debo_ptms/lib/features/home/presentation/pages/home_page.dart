import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:debo_ptms/core/network/api_client.dart';
import 'package:debo_ptms/core/theme/app_colors.dart';
import 'package:debo_ptms/core/constants/role_constants.dart';
import 'package:debo_ptms/features/home/data/datasources/home_remote_data_source.dart';
import 'package:debo_ptms/features/home/data/repositories/home_repository_impl.dart';
import 'package:debo_ptms/features/home/domain/entities/home_team_entity.dart';
import 'package:debo_ptms/features/home/domain/usecases/get_my_teams_usecase.dart';
import 'package:debo_ptms/features/user/presentation/bloc/user_auth_bloc.dart';

class Home extends StatefulWidget {
  const Home({super.key, required this.title, this.onOpenDrawer});

  final String title;
  final VoidCallback? onOpenDrawer;

  @override
  State<Home> createState() => _HomeState();
}

class _HomeState extends State<Home> {
  bool _loadingTeams = true;
  List<HomeTeamEntity> _teams = const [];

  void _showNotifications() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('No new notifications right now.')),
    );
  }

  @override
  void initState() {
    super.initState();
    _loadTeams();
  }

  Future<void> _loadTeams() async {
    setState(() => _loadingTeams = true);
    try {
      final apiClient = context.read<ApiClient>();
      final useCase = GetMyTeamsUseCase(
        HomeRepositoryImpl(HomeRemoteDataSourceImpl(apiClient)),
      );
      _teams = await useCase();
    } catch (_) {
      _teams = const [];
    } finally {
      if (mounted) {
        setState(() => _loadingTeams = false);
      }
    }
  }

  String _roleLabel(String? role) {
    if (AppRoles.isAdmin(role)) return 'Admin';
    if (AppRoles.isManager(role)) return 'Project Manager';
    return 'Team Member';
  }

  Widget _quickCard({
    required BuildContext context,
    required IconData icon,
    required String title,
    required String subtitle,
  }) {
    return Container(
      decoration: BoxDecoration(
        color: Colors.white,
        borderRadius: BorderRadius.circular(18),
        boxShadow: [
          BoxShadow(
            color: Colors.black.withValues(alpha: 0.05),
            blurRadius: 12,
            offset: const Offset(0, 6),
          ),
        ],
      ),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(
              height: 46,
              width: 46,
              decoration: BoxDecoration(
                gradient: AppColors.brandGradient,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Icon(icon, color: Colors.white),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(title, style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 4),
                  Text(
                    subtitle,
                    style: const TextStyle(color: AppColors.textMuted),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final user = context.select((UserAuthBloc bloc) => bloc.state.user);
    final name = (user?.fullName ?? '').trim();
    final role = user?.role;
    final teamFromProfile = (user?.team ?? '').trim();

    final teamNames = _teams
        .map((team) => team.name.trim())
        .where((name) => name.isNotEmpty)
        .toSet()
        .toList(growable: false);

    final activeTeam = teamNames.isNotEmpty
        ? teamNames.first
        : (teamFromProfile.isNotEmpty
              ? teamFromProfile
              : 'No team assigned yet');

    return Scaffold(
      appBar: AppBar(
        systemOverlayStyle: SystemUiOverlayStyle.light,
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
        title: Text(
          widget.title,
          textAlign: TextAlign.center,
          style: const TextStyle(
            color: Colors.white,
            fontWeight: FontWeight.bold,
            fontSize: 20,
          ),
        ),
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
      body: RefreshIndicator(
        onRefresh: _loadTeams,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            Container(
              padding: const EdgeInsets.all(18),
              decoration: BoxDecoration(
                gradient: AppColors.brandGradient,
                borderRadius: BorderRadius.circular(22),
                boxShadow: [
                  BoxShadow(
                    color: AppColors.brandPrimary.withValues(alpha: 0.18),
                    blurRadius: 18,
                    offset: const Offset(0, 10),
                  ),
                ],
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    'Welcome, ${name.isEmpty ? 'User' : name}',
                    style: Theme.of(
                      context,
                    ).textTheme.titleLarge?.copyWith(color: Colors.white),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Role: ${_roleLabel(role)}',
                    style: const TextStyle(color: Colors.white70),
                  ),
                  const SizedBox(height: 14),
                  Container(
                    width: double.infinity,
                    padding: const EdgeInsets.all(12),
                    decoration: BoxDecoration(
                      color: Colors.white.withValues(alpha: 0.16),
                      borderRadius: BorderRadius.circular(14),
                    ),
                    child: Row(
                      children: [
                        const Icon(Icons.groups_2, color: Colors.white),
                        const SizedBox(width: 8),
                        Expanded(
                          child: Text(
                            _loadingTeams ? 'Loading team...' : activeTeam,
                            style: const TextStyle(
                              color: Colors.white,
                              fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(height: 18),
            Text(
              'Overview',
              style: Theme.of(context).textTheme.titleMedium,
            ),
            _quickCard(
              context: context,
              icon: Icons.badge,
              title: 'Profile Name',
              subtitle: name.isEmpty ? '-' : name,
            ),
            const SizedBox(height: 12),
            _quickCard(
              context: context,
              icon: Icons.group_work,
              title: 'Working Team',
              subtitle: _loadingTeams ? 'Loading team...' : activeTeam,
            ),
            const SizedBox(height: 12),
            _quickCard(
              context: context,
              icon: Icons.analytics_outlined,
              title: 'Workspace',
              subtitle: AppRoles.isAdmin(role)
                  ? 'Administration and system operations'
                  : AppRoles.isManager(role)
                  ? 'Project planning and delivery'
                  : 'Assigned task execution',
            ),
            const SizedBox(height: 6),
          ],
        ),
      ),
    );
  }
}
