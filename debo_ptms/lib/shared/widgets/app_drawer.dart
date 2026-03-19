import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:debo_ptms/core/theme/app_colors.dart';
import 'package:debo_ptms/features/user/presentation/bloc/user_auth_bloc.dart';
import 'package:debo_ptms/features/user/presentation/bloc/user_auth_event.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  bool _selectedForPrimary(String? currentRoute) {
    return currentRoute == '/' ||
        currentRoute == '/home' ||
        currentRoute == '/dashboard' ||
        currentRoute == null;
  }

  void _goTo(
    BuildContext context, {
    required String route,
    required bool replace,
    bool Function(String? currentRoute)? isSelected,
  }) {
    final navigator = Navigator.of(context);
    final current = ModalRoute.of(context)?.settings.name;

    navigator.pop();

    final selected = isSelected != null
        ? isSelected(current)
        : current == route;
    if (selected) return;

    Future.microtask(() {
      if (replace) {
        navigator.pushReplacementNamed(route);
      } else {
        navigator.pushNamed(route);
      }
    });
  }

  ListTile _tile(
    BuildContext context, {
    required IconData icon,
    required String title,
    required bool selected,
    required VoidCallback onTap,
  }) {
    return ListTile(
      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(10)),
      leading: Icon(icon, color: selected ? AppColors.brandPrimary : null),
      title: Text(title),
      selected: selected,
      selectedTileColor: AppColors.brandAccent.withValues(alpha: 0.16),
      onTap: onTap,
    );
  }

  @override
  Widget build(BuildContext context) {
    final current = ModalRoute.of(context)?.settings.name;
    final role = context.select(
      (UserAuthBloc bloc) => bloc.state.user?.role,
    );
    final roleLower = (role ?? '').toLowerCase();
    final isAdmin = roleLower.contains('admin');
    final isManager = roleLower.contains('manager');
    final isMember = roleLower.contains('member');
    final canViewTasks = isManager || isMember;

    return Drawer(
      child: ListView(
        padding: const EdgeInsets.fromLTRB(12, 0, 12, 12),
        children: [
          DrawerHeader(
            decoration: const BoxDecoration(
              gradient: AppColors.brandGradient,
              borderRadius: BorderRadius.only(
                bottomLeft: Radius.circular(18),
                bottomRight: Radius.circular(18),
              ),
            ),
            child: const Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              mainAxisAlignment: MainAxisAlignment.end,
              children: [
                Text(
                  'DEBO PTMS',
                  style: TextStyle(
                    color: Colors.white,
                    fontWeight: FontWeight.bold,
                    fontSize: 22,
                  ),
                ),
                SizedBox(height: 6),
                Text(
                  'Navigation',
                  style: TextStyle(color: Colors.white, fontSize: 14),
                ),
              ],
            ),
          ),
          if (isAdmin || isManager)
            _tile(
              context,
              icon: Icons.dashboard,
              title: 'Dashboard',
              selected: _selectedForPrimary(current),
              onTap: () => _goTo(
                context,
                route: '/dashboard',
                replace: true,
                isSelected: _selectedForPrimary,
              ),
            ),

          _tile(
            context,
            icon: Icons.work,
            title: 'Projects',
            selected: current == '/projects',
            onTap: () => _goTo(context, route: '/projects', replace: true),
          ),

          if (canViewTasks)
            _tile(
              context,
              icon: Icons.task_alt,
              title: 'My Tasks',
              selected: current == '/my-tasks',
              onTap: () => _goTo(context, route: '/my-tasks', replace: true),
            ),

          _tile(
            context,
            icon: Icons.person,
            title: 'Profile',
            selected: current == '/profile',
            onTap: () => _goTo(context, route: '/profile', replace: true),
          ),
          _tile(
            context,
            icon: Icons.logout,
            title: 'Logout',
            selected: false,
            onTap: () {
              Navigator.of(context).pop();
              context.read<UserAuthBloc>().add(const UserLogoutRequested());
              Navigator.of(
                context,
              ).pushNamedAndRemoveUntil('/login', (_) => false);
            },
          ),
        ],
      ),
    );
  }
}
