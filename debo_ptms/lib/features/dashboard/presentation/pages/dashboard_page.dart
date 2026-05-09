import 'package:debo_ptms/core/network/api_client.dart';
import 'package:debo_ptms/core/theme/app_colors.dart';
import 'package:debo_ptms/core/constants/role_constants.dart';
import 'package:debo_ptms/features/dashboard/data/datasources/dashboard_remote_data_source.dart';
import 'package:debo_ptms/features/dashboard/data/repositories/dashboard_repository_impl.dart';
import 'package:debo_ptms/features/dashboard/domain/entities/dashboard_summary_entity.dart';
import 'package:debo_ptms/features/dashboard/domain/usecases/get_dashboard_summary_usecase.dart';
import 'package:debo_ptms/features/user/presentation/bloc/user_auth_bloc.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key, this.onOpenDrawer});

  final VoidCallback? onOpenDrawer;

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  bool _loading = true;
  String? _error;
  DashboardSummaryEntity? _summary;

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
      _summary = null;
    });

    try {
      final apiClient = context.read<ApiClient>();
      final role = context.read<UserAuthBloc>().state.user?.role;
      final useCase = GetDashboardSummaryUseCase(
        DashboardRepositoryImpl(DashboardRemoteDataSourceImpl(apiClient)),
      );

      _summary = await useCase(isAdmin: AppRoles.isAdmin(role));
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Widget _heroCard({
    required BuildContext context,
    required bool isAdmin,
    required DashboardSummaryEntity summary,
  }) {
    final keyMetric = isAdmin
        ? summary.metric('total_users').toString()
        : summary.metric('total_tasks').toString();

    final keyLabel = isAdmin ? 'Total Users' : 'Total Tasks';

    return Container(
      padding: const EdgeInsets.all(18),
      decoration: BoxDecoration(
        gradient: const LinearGradient(
          colors: [Color(0xFF0B6E99), Color(0xFF2F80ED), Color(0xFF56CCF2)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(22),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text(
            isAdmin ? 'Admin Control Center' : 'Project Delivery Board',
            style: Theme.of(context).textTheme.titleLarge?.copyWith(
              color: Colors.white,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 8),
          const Text(
            'Realtime project pulse and performance metrics.',
            style: TextStyle(color: Colors.white70),
          ),
          const SizedBox(height: 16),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
            decoration: BoxDecoration(
              color: Colors.white.withValues(alpha: 0.18),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Row(
              children: [
                const Icon(Icons.auto_graph, color: Colors.white),
                const SizedBox(width: 10),
                Expanded(
                  child: Text(
                    '$keyLabel: $keyMetric',
                    style: const TextStyle(
                      color: Colors.white,
                      fontWeight: FontWeight.w700,
                    ),
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }

  Widget _metricTile({
    required String title,
    required String value,
    required IconData icon,
    required List<Color> colors,
  }) {
    return Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: colors,
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: Colors.white),
          const Spacer(),
          Text(
            value,
            style: const TextStyle(
              color: Colors.white,
              fontSize: 22,
              fontWeight: FontWeight.bold,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: const TextStyle(color: Colors.white70),
          ),
        ],
      ),
    );
  }

  Widget _metricGrid(List<Widget> tiles) {
    return LayoutBuilder(
      builder: (context, constraints) {
        final width = constraints.maxWidth;
        final tileWidth = (width - 10) / 2;

        return Wrap(
          spacing: 10,
          runSpacing: 10,
          children: tiles
              .map(
                (tile) => SizedBox(
                  width: tileWidth,
                  height: 132,
                  child: tile,
                ),
              )
              .toList(growable: false),
        );
      },
    );
  }

  Widget _adminActions(BuildContext context) {
    final titleStyle = Theme.of(context).textTheme.titleMedium?.copyWith(
          fontWeight: FontWeight.w600,
        );

    Widget actionButton({
      required IconData icon,
      required String label,
      required VoidCallback onTap,
      required List<Color> colors,
    }) {
      return InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 14),
          decoration: BoxDecoration(
            gradient: LinearGradient(
              colors: colors,
              begin: Alignment.topLeft,
              end: Alignment.bottomRight,
            ),
            borderRadius: BorderRadius.circular(18),
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.12),
                blurRadius: 14,
                offset: const Offset(0, 6),
              ),
            ],
          ),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(8),
                decoration: BoxDecoration(
                  color: Colors.white.withValues(alpha: 0.2),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: Colors.white, size: 20),
              ),
              const SizedBox(width: 10),
              Expanded(
                child: Text(
                  label,
                  maxLines: 1,
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const Icon(Icons.arrow_forward_rounded, color: Colors.white),
            ],
          ),
        ),
      );
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text('Admin Tools', style: titleStyle),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: actionButton(
                icon: Icons.manage_accounts,
                label: 'Users',
                onTap: () => Navigator.pushNamed(context, '/admin/users'),
                colors: const [Color(0xFF4A00E0), Color(0xFF8E2DE2)],
              ),
            ),
            const SizedBox(width: 12),
            Expanded(
              child: actionButton(
                icon: Icons.groups,
                label: 'Teams',
                onTap: () => Navigator.pushNamed(context, '/admin/teams'),
                colors: const [Color(0xFF11998E), Color(0xFF38EF7D)],
              ),
            ),
          ],
        ),
      ],
    );
  }

  @override
  Widget build(BuildContext context) {
    final role = context.select((UserAuthBloc b) => b.state.user?.role);
    final isAdmin = AppRoles.isAdmin(role);

    return Scaffold(
      appBar: AppBar(
        title: Text(isAdmin ? 'Admin Dashboard' : 'Manager Dashboard'),
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
                  if (_summary != null) ...[
                    _heroCard(
                      context: context,
                      isAdmin: isAdmin,
                      summary: _summary!,
                    ),
                    const SizedBox(height: 14),
                    if (isAdmin) ...[
                      _adminActions(context),
                      const SizedBox(height: 14),
                    ],
                    if (isAdmin) ...[
                      _metricGrid([
                        _metricTile(
                          title: 'Total Users',
                          value: '${_summary!.metric('total_users')}',
                          icon: Icons.people_alt_rounded,
                          colors: const [Color(0xFF8E2DE2), Color(0xFF4A00E0)],
                        ),
                        _metricTile(
                          title: 'Total Projects',
                          value: '${_summary!.metric('total_projects')}',
                          icon: Icons.folder_special_rounded,
                          colors: const [Color(0xFF11998E), Color(0xFF38EF7D)],
                        ),
                        _metricTile(
                          title: 'Active Projects',
                          value: '${_summary!.metric('active_projects')}',
                          icon: Icons.rocket_launch_rounded,
                          colors: const [Color(0xFF1D976C), Color(0xFF93F9B9)],
                        ),
                        _metricTile(
                          title: 'Completed Projects',
                          value: '${_summary!.metric('completed_projects')}',
                          icon: Icons.verified_rounded,
                          colors: const [Color(0xFF2193B0), Color(0xFF6DD5ED)],
                        ),
                      ]),
                      const SizedBox(height: 10),
                      SizedBox(
                        height: 132,
                        child: _metricTile(
                          title: 'On Hold Projects',
                          value: '${_summary!.metric('on_hold_projects')}',
                          icon: Icons.pause_circle_filled_rounded,
                          colors: const [Color(0xFFFF512F), Color(0xFFDD2476)],
                        ),
                      ),
                    ] else ...[
                      _metricGrid([
                        _metricTile(
                          title: 'Total Projects',
                          value: '${_summary!.metric('total_projects')}',
                          icon: Icons.workspaces_rounded,
                          colors: const [Color(0xFF36D1DC), Color(0xFF5B86E5)],
                        ),
                        _metricTile(
                          title: 'Active Projects',
                          value: '${_summary!.metric('active_projects')}',
                          icon: Icons.timeline_rounded,
                          colors: const [Color(0xFF00B09B), Color(0xFF96C93D)],
                        ),
                        _metricTile(
                          title: 'Total Tasks',
                          value: '${_summary!.metric('total_tasks')}',
                          icon: Icons.task_alt_rounded,
                          colors: const [Color(0xFF4776E6), Color(0xFF8E54E9)],
                        ),
                        _metricTile(
                          title: 'Completed Tasks',
                          value: '${_summary!.metric('completed_tasks')}',
                          icon: Icons.check_circle_rounded,
                          colors: const [Color(0xFF11998E), Color(0xFF38EF7D)],
                        ),
                      ]),
                      const SizedBox(height: 10),
                      SizedBox(
                        height: 132,
                        child: _metricTile(
                          title: 'Overdue Tasks',
                          value: '${_summary!.metric('overdue_tasks')}',
                          icon: Icons.warning_rounded,
                          colors: const [Color(0xFFFF8008), Color(0xFFFFC837)],
                        ),
                      ),
                    ],
                  ] else ...[
                    const Card(
                      child: Padding(
                        padding: EdgeInsets.all(16),
                        child: Text('No dashboard data available right now.'),
                      ),
                    ),
                  ],
                ],
              ),
            ),
    );
  }
}
