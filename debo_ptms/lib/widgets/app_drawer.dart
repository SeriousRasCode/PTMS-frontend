import 'package:flutter/material.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  static const _primary = Color(0xFF0F5841);
  static const _secondary = Color(0xFF194F87);

  bool _selectedForHome(String? currentRoute) {
    return currentRoute == '/' ||
        currentRoute == '/home' ||
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
      leading: Icon(icon),
      title: Text(title),
      selected: selected,
      onTap: onTap,
    );
  }

  @override
  Widget build(BuildContext context) {
    final current = ModalRoute.of(context)?.settings.name;

    return Drawer(
      child: ListView(
        padding: EdgeInsets.zero,
        children: [
          DrawerHeader(
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [_primary, _secondary],
                begin: Alignment.bottomCenter,
                end: Alignment.topCenter,
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
          _tile(
            context,
            icon: Icons.task_alt,
            title: 'Tasks',
            selected: _selectedForHome(current),
            onTap: () => _goTo(
              context,
              route: '/home',
              replace: true,
              isSelected: _selectedForHome,
            ),
          ),
          _tile(
            context,
            icon: Icons.info_rounded,
            title: 'About',
            selected: current == '/about',
            onTap: () => _goTo(context, route: '/about', replace: true),
          ),

          _tile(
            context,
            icon: Icons.person_add,
            title: 'Logout',
            selected: current == '/logout',
            onTap: () => _goTo(context, route: '/logout', replace: false),
          ),
        ],
      ),
    );
  }
}
