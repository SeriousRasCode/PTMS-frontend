import 'package:debo_ptms/core/network/api_client.dart';
import 'package:debo_ptms/core/theme/app_colors.dart';
import 'package:debo_ptms/features/admin/data/datasources/admin_remote_data_source.dart';
import 'package:debo_ptms/features/admin/data/repositories/admin_repository_impl.dart';
import 'package:debo_ptms/features/admin/domain/entities/admin_user_entity.dart';
import 'package:debo_ptms/features/admin/domain/usecases/change_user_role_usecase.dart';
import 'package:debo_ptms/features/admin/domain/usecases/change_user_status_usecase.dart';
import 'package:debo_ptms/features/admin/domain/usecases/get_all_users_usecase.dart';
import 'package:debo_ptms/shared/widgets/app_drawer.dart';
import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';

class AdminUsersScreen extends StatefulWidget {
  const AdminUsersScreen({super.key});

  @override
  State<AdminUsersScreen> createState() => _AdminUsersScreenState();
}

class _AdminUsersScreenState extends State<AdminUsersScreen> {
  bool _loading = true;
  String? _error;
  List<AdminUserEntity> _users = const [];

  void _showNotifications() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('No new notifications right now.')),
    );
  }

  static const _roleOptions = [
    'Admin',
    'Project Manager',
    'Team Member',
    'Manager',
    'Member',
  ];

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
      final repository = AdminRepositoryImpl(
        AdminRemoteDataSourceImpl(apiClient),
      );
      final useCase = GetAllUsersUseCase(repository);
      _users = await useCase();
    } catch (e) {
      _error = e.toString();
    } finally {
      if (mounted) {
        setState(() => _loading = false);
      }
    }
  }

  Future<void> _toggleStatus(int userId, bool isActive) async {
    try {
      final apiClient = context.read<ApiClient>();
      final repository = AdminRepositoryImpl(
        AdminRemoteDataSourceImpl(apiClient),
      );
      final useCase = ChangeUserStatusUseCase(repository);
      await useCase(userId: userId, isActive: isActive);
      await _load();
    } catch (e) {
      if (!mounted) return;
      ScaffoldMessenger.of(
        context,
      ).showSnackBar(SnackBar(content: Text(e.toString())));
    }
  }

  Future<void> _changeRole(int userId, String roleName) async {
    try {
      final apiClient = context.read<ApiClient>();
      final repository = AdminRepositoryImpl(
        AdminRemoteDataSourceImpl(apiClient),
      );
      final useCase = ChangeUserRoleUseCase(repository);
      await useCase(userId: userId, roleName: roleName);
      await _load();
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
        title: const Text('User Management'),
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
              child: ListView.separated(
                padding: const EdgeInsets.all(16),
                itemCount: _users.length,
                separatorBuilder: (_, _) => const SizedBox(height: 10),
                itemBuilder: (context, index) {
                  final user = _users[index];
                  final userId = user.id;
                  final fullName = user.fullName;
                  final email = user.email;
                  final role = user.role;
                  final active = user.isActive;

                  return Card(
                    child: Padding(
                      padding: const EdgeInsets.all(12),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            fullName.isEmpty ? 'User #$userId' : fullName,
                            style: const TextStyle(fontWeight: FontWeight.bold),
                          ),
                          const SizedBox(height: 4),
                          Text(email),
                          const SizedBox(height: 4),
                          Text('Role: $role'),
                          const SizedBox(height: 12),
                          Row(
                            children: [
                              Expanded(
                                child: DropdownButtonFormField<String>(
                                  initialValue: null,
                                  hint: const Text('Change role'),
                                  items: _roleOptions
                                      .map(
                                        (r) => DropdownMenuItem<String>(
                                          value: r,
                                          child: Text(r),
                                        ),
                                      )
                                      .toList(growable: false),
                                  onChanged: (value) {
                                    if (value != null && value.isNotEmpty) {
                                      _changeRole(userId, value);
                                    }
                                  },
                                ),
                              ),
                              const SizedBox(width: 12),
                              Column(
                                children: [
                                  const Text('Active'),
                                  Switch(
                                    value: active,
                                    onChanged: (value) =>
                                        _toggleStatus(userId, value),
                                  ),
                                ],
                              ),
                            ],
                          ),
                        ],
                      ),
                    ),
                  );
                },
              ),
            ),
    );
  }
}
