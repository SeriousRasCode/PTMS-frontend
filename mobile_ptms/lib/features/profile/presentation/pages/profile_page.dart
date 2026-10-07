import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:debo_ptms/core/theme/app_colors.dart';
import 'package:debo_ptms/core/constants/role_constants.dart';
import 'package:debo_ptms/features/user/presentation/bloc/user_auth_bloc.dart';
import 'package:debo_ptms/features/user/presentation/bloc/user_auth_event.dart';
import 'package:debo_ptms/features/user/presentation/bloc/user_auth_state.dart';
import 'package:debo_ptms/shared/widgets/app_drawer.dart';

class Profile extends StatefulWidget {
  const Profile({super.key, required this.title});

  final String title;

  @override
  State<Profile> createState() => _ProfileState();
}

class _ProfileState extends State<Profile> {
  void _showNotifications() {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('No new notifications right now.')),
    );
  }

  Future<void> _showUpdateProfileDialog() async {
    final user = context.read<UserAuthBloc>().state.user;
    final fullNameController = TextEditingController(text: user?.fullName ?? '');
    final emailController = TextEditingController(text: user?.email ?? '');

    final formKey = GlobalKey<FormState>();

    final shouldSubmit = await showDialog<bool>(
      context: context,
      builder: (context) {
        return AlertDialog(
          title: const Text('Update Profile'),
          content: Form(
            key: formKey,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                TextFormField(
                  controller: fullNameController,
                  decoration: const InputDecoration(labelText: 'Full name'),
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Full name is required';
                    }
                    return null;
                  },
                ),
                const SizedBox(height: 12),
                TextFormField(
                  controller: emailController,
                  decoration: const InputDecoration(labelText: 'Email'),
                  keyboardType: TextInputType.emailAddress,
                  validator: (value) {
                    if (value == null || value.trim().isEmpty) {
                      return 'Email is required';
                    }
                    if (!value.contains('@')) {
                      return 'Enter a valid email';
                    }
                    return null;
                  },
                ),
              ],
            ),
          ),
          actions: [
            TextButton(
              onPressed: () => Navigator.of(context).pop(false),
              child: const Text('Cancel'),
            ),
            ElevatedButton(
              onPressed: () {
                if (formKey.currentState?.validate() ?? false) {
                  Navigator.of(context).pop(true);
                }
              },
              child: const Text('Save'),
            ),
          ],
        );
      },
    );

    if (shouldSubmit == true && mounted) {
      context.read<UserAuthBloc>().add(
        UserProfileUpdateSubmitted(
          fullName: fullNameController.text.trim(),
          email: emailController.text.trim(),
        ),
      );
    }

    fullNameController.dispose();
    emailController.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return BlocConsumer<UserAuthBloc, UserAuthState>(
      listener: (context, state) {
        if (state.message != null && state.message!.isNotEmpty) {
          ScaffoldMessenger.of(
            context,
          ).showSnackBar(SnackBar(content: Text(state.message!)));
        }

        if (state.status == UserAuthStatus.unauthenticated) {
          Navigator.of(context).pushNamedAndRemoveUntil('/login', (_) => false);
        }
      },
      builder: (context, state) {
        final user = state.user;

        return Scaffold(
          drawer: const AppDrawer(),
          appBar: AppBar(
            systemOverlayStyle: SystemUiOverlayStyle.light,
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
              decoration: const BoxDecoration(
                gradient: AppColors.brandGradient,
              ),
            ),
            actions: [
              IconButton(
                onPressed: _showNotifications,
                icon: const Icon(Icons.notifications_none_rounded),
                tooltip: 'Notifications',
              ),
            ],
          ),
          body: state.status == UserAuthStatus.loading && user == null
              ? const Center(child: CircularProgressIndicator())
              : ListView(
                  padding: const EdgeInsets.all(16),
                  children: [
                    Card(
                      child: Container(
                        padding: const EdgeInsets.all(18),
                        width: double.infinity,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              AppRoles.isAdmin(user?.role)
                                  ? 'Admin Access'
                                  : AppRoles.isManager(user?.role)
                                      ? 'Project Manager Access'
                                      : 'Team Member Access',
                              style: const TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 16,
                              ),
                            ),
                            const SizedBox(height: 8),
                            Text(
                              AppRoles.isAdmin(user?.role)
                                  ? 'Manage users, teams, and view all projects.'
                                  : AppRoles.isManager(user?.role)
                                      ? 'Create projects, create tasks, and monitor progress.'
                                      : 'View assigned tasks, update progress, and complete work items.',
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Card(
                      child: Container(
                        padding: const EdgeInsets.all(20),
                        width: double.infinity,
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            const Text(
                              'Name',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 18,
                              ),
                            ),
                            Text(
                              user?.fullName ?? '-',
                              style: const TextStyle(
                                fontSize: 16,
                                color: AppColors.textMuted,
                              ),
                            ),
                            const SizedBox(height: 5),
                            const Text(
                              'Email',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 18,
                              ),
                            ),
                            Text(
                              user?.email ?? '-',
                              style: const TextStyle(
                                fontSize: 16,
                                color: AppColors.textMuted,
                              ),
                            ),
                            const SizedBox(height: 5),
                            const Text(
                              'Role',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 18,
                              ),
                            ),
                            Text(
                              user?.role ?? '-',
                              style: const TextStyle(
                                fontSize: 16,
                                color: AppColors.textMuted,
                              ),
                            ),
                            const SizedBox(height: 5),
                            const Text(
                              'Team',
                              style: TextStyle(
                                fontWeight: FontWeight.bold,
                                fontSize: 18,
                              ),
                            ),
                            Text(
                              user?.team ?? '-',
                              style: const TextStyle(
                                fontSize: 16,
                                color: AppColors.textMuted,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ),
                    const SizedBox(height: 12),
                    Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        gradient: AppColors.brandGradient,
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: ElevatedButton(
                        onPressed: () => _showUpdateProfileDialog(),
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: const Text(
                          'Update Profile',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(height: 10),
                    Container(
                      width: double.infinity,
                      decoration: BoxDecoration(
                        gradient: const LinearGradient(
                          colors: [Color(0xFF6C8090), Color(0xFF4D6273)],
                          begin: Alignment.topLeft,
                          end: Alignment.bottomRight,
                        ),
                        borderRadius: BorderRadius.circular(14),
                      ),
                      child: ElevatedButton(
                        onPressed: () {
                          context.read<UserAuthBloc>().add(
                            const UserLogoutRequested(),
                          );
                        },
                        style: ElevatedButton.styleFrom(
                          backgroundColor: Colors.transparent,
                          shadowColor: Colors.transparent,
                          shape: RoundedRectangleBorder(
                            borderRadius: BorderRadius.circular(14),
                          ),
                        ),
                        child: const Text(
                          'Log Out',
                          style: TextStyle(
                            color: Colors.white,
                            fontWeight: FontWeight.bold,
                            fontSize: 16,
                          ),
                        ),
                      ),
                    ),
                  ],
                ),
        );
      },
    );
  }
}
