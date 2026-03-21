import 'package:debo_ptms/core/network/api_client.dart';
import 'package:debo_ptms/core/theme/app_colors.dart';
import 'package:debo_ptms/core/constants/role_constants.dart';
import 'package:debo_ptms/features/dashboard/data/datasources/dashboard_remote_data_source.dart';
import 'package:debo_ptms/features/dashboard/data/repositories/dashboard_repository_impl.dart';
import 'package:debo_ptms/features/dashboard/domain/entities/dashboard_summary_entity.dart';
import 'package:debo_ptms/features/dashboard/domain/usecases/get_dashboard_summary_usecase.dart';
import 'package:debo_ptms/features/user/presentation/bloc/user_auth_bloc.dart';
import 'package:debo_ptms/shared/widgets/app_drawer.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

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
        DashboardRepositoryImpl(
          DashboardRemoteDataSourceImpl(apiClient),
        ),
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

  Widget _statCard(String title, String value) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    title,
                    style: const TextStyle(
                      fontWeight: FontWeight.w700,
                      color: AppColors.textMuted,
                    ),
                  ),
                  const SizedBox(height: 8),
                  Text(
                    value,
                    style: const TextStyle(
                      fontSize: 22,
                      fontWeight: FontWeight.bold,
                    ),
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
    final role = context.select((UserAuthBloc b) => b.state.user?.role);
    final isAdmin = AppRoles.isAdmin(role);

    return Scaffold(
      drawer: const AppDrawer(),
      appBar: AppBar(
        title: Text(isAdmin ? 'Admin Dashboard' : 'Manager Dashboard'),
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
                        if (isAdmin) ...[
                          _statCard('Total Users', '${_summary!.metric('total_users')}'),
                          _statCard('Total Projects', '${_summary!.metric('total_projects')}'),
                          _statCard('Active Projects', '${_summary!.metric('active_projects')}'),
                          _statCard('Completed Projects', '${_summary!.metric('completed_projects')}'),
                          _statCard('On Hold Projects', '${_summary!.metric('on_hold_projects')}'),
                        ] else ...[
                          _statCard('Total Projects', '${_summary!.metric('total_projects')}'),
                          _statCard('Active Projects', '${_summary!.metric('active_projects')}'),
                          _statCard('Total Tasks', '${_summary!.metric('total_tasks')}'),
                          _statCard('Completed Tasks', '${_summary!.metric('completed_tasks')}'),
                          _statCard('Overdue Tasks', '${_summary!.metric('overdue_tasks')}'),
                        ],
                      ],
                    ],
                  ),
                ),
    );
  }
}
