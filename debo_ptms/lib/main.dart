import 'package:flutter/material.dart';
import 'package:flutter_bloc/flutter_bloc.dart';
import 'package:debo_ptms/core/network/api_client.dart';
import 'package:debo_ptms/core/storage/token_storage.dart';
import 'package:debo_ptms/core/constants/role_constants.dart';
import 'package:debo_ptms/core/theme/app_colors.dart';
import 'package:debo_ptms/core/theme/app_theme.dart';
import 'package:debo_ptms/features/user/data/datasources/user_remote_data_source.dart';
import 'package:debo_ptms/features/user/data/repositories/user_repository_impl.dart';
import 'package:debo_ptms/features/user/domain/usecases/get_profile_usecase.dart';
import 'package:debo_ptms/features/user/domain/usecases/login_user_usecase.dart';
import 'package:debo_ptms/features/user/domain/usecases/logout_user_usecase.dart';
import 'package:debo_ptms/features/user/domain/usecases/register_user_usecase.dart';
import 'package:debo_ptms/features/user/domain/usecases/update_profile_usecase.dart';
import 'package:debo_ptms/features/user/presentation/bloc/user_auth_bloc.dart';
import 'package:debo_ptms/features/user/presentation/bloc/user_auth_event.dart';
import 'package:debo_ptms/features/user/presentation/bloc/user_auth_state.dart';
import 'package:debo_ptms/features/dashboard/presentation/pages/dashboard_page.dart';
import 'package:debo_ptms/features/admin/presentation/pages/admin_teams_page.dart';
import 'package:debo_ptms/features/admin/presentation/pages/admin_users_page.dart';
import 'package:debo_ptms/features/home/presentation/pages/home_page.dart';
import 'package:debo_ptms/features/tasks/presentation/pages/my_tasks_page.dart';
import 'package:debo_ptms/features/profile/presentation/pages/profile_page.dart';
import 'package:debo_ptms/features/projects/presentation/pages/projects_list_page.dart';
import 'package:debo_ptms/features/auth/presentation/pages/login_page.dart';
import 'package:debo_ptms/features/auth/presentation/pages/registered_page.dart';
import 'package:debo_ptms/features/auth/presentation/pages/signup_page.dart';
import 'package:debo_ptms/shared/widgets/app_drawer.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final tokenStorage = TokenStorage();
  final apiClient = ApiClient(tokenStorage: tokenStorage);
  final remoteDataSource = UserRemoteDataSourceImpl(apiClient);
  final repository = UserRepositoryImpl(
    remoteDataSource: remoteDataSource,
    tokenStorage: tokenStorage,
  );

  final authBloc = UserAuthBloc(
    loginUserUseCase: LoginUserUseCase(repository),
    registerUserUseCase: RegisterUserUseCase(repository),
    getProfileUseCase: GetProfileUseCase(repository),
    updateProfileUseCase: UpdateProfileUseCase(repository),
    logoutUserUseCase: LogoutUserUseCase(repository),
  )..add(const UserAuthStarted());

  runApp(
    MultiRepositoryProvider(
      providers: [RepositoryProvider.value(value: apiClient)],
      child: MyApp(authBloc: authBloc),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key, required this.authBloc});

  final UserAuthBloc authBloc;

  @override
  Widget build(BuildContext context) {
    return BlocProvider.value(
      value: authBloc,
      child: MaterialApp(
        debugShowCheckedModeBanner: false,
        title: 'DEBO PTMS',
        theme: AppTheme.lightTheme,
        home: const AuthGate(),
        routes: {
          '/home': (context) => const HomeWrapper(initialIndex: 0),
          '/dashboard': (context) =>
              const RoleBasedHome(target: HomeTarget.dashboard),
          '/projects': (context) =>
              const RoleBasedHome(target: HomeTarget.projects),
          '/my-tasks': (context) =>
              const RoleBasedHome(target: HomeTarget.myTasks),
          '/profile': (context) =>
              const RoleBasedHome(target: HomeTarget.profile),
            '/admin/users': (context) => const AdminUsersScreen(),
            '/admin/teams': (context) => const AdminTeamsScreen(),
          // Route still exists, but always delegates to AuthGate so we don't
          // get stuck on a static Login screen when auth state changes.
          '/login': (context) => const AuthGate(),
          '/signup': (context) => const Signup(),
          '/registered': (context) => const Registered(),
        },
      ),
    );
  }
}

enum HomeTarget {
  home,
  dashboard,
  projects,
  myTasks,
  profile,
}

class RoleBasedHome extends StatelessWidget {
  const RoleBasedHome({super.key, required this.target});

  final HomeTarget target;

  @override
  Widget build(BuildContext context) {
    final role = context.select((UserAuthBloc b) => b.state.user?.role);
    final isAdmin = AppRoles.isAdmin(role);
    final isManager = AppRoles.isManager(role);
    final isMember = AppRoles.isMember(role);

    int index;
    if (isAdmin) {
      // [0]=Home, [1]=Dashboard, [2]=Projects, [3]=Profile
      index = switch (target) {
        HomeTarget.home => 0,
        HomeTarget.dashboard => 1,
        HomeTarget.projects => 2,
        HomeTarget.profile => 3,
        HomeTarget.myTasks => 2,
      };
    } else if (isManager) {
      // [0]=Home, [1]=Dashboard, [2]=Projects, [3]=Profile
      index = switch (target) {
        HomeTarget.home => 0,
        HomeTarget.dashboard => 1,
        HomeTarget.projects => 2,
        HomeTarget.myTasks => 2,
        HomeTarget.profile => 3,
      };
    } else if (isMember) {
      // [0]=Home, [1]=Projects, [2]=My Tasks, [3]=Profile
      index = switch (target) {
        HomeTarget.home => 0,
        HomeTarget.dashboard => 1,
        HomeTarget.projects => 1,
        HomeTarget.myTasks => 2,
        HomeTarget.profile => 3,
      };
    } else {
      index = 0;
    }

    return HomeWrapper(initialIndex: index);
  }
}

class AuthGate extends StatelessWidget {
  const AuthGate({super.key});

  @override
  Widget build(BuildContext context) {
    return BlocBuilder<UserAuthBloc, UserAuthState>(
      builder: (context, state) {
        if ((state.status == UserAuthStatus.loading ||
                state.status == UserAuthStatus.initial) &&
            state.user == null) {
          return const Scaffold(
            body: Center(child: CircularProgressIndicator()),
          );
        }

        if (state.status == UserAuthStatus.authenticated) {
          return const RoleBasedHome(target: HomeTarget.dashboard);
        }

        return const Login();
      },
    );
  }
}

class HomeWrapper extends StatefulWidget {
  const HomeWrapper({super.key, this.initialIndex = 0});

  final int initialIndex;

  @override
  State<HomeWrapper> createState() => _HomeWrapperState();
}

class _HomeWrapperState extends State<HomeWrapper> {
  late int _currentIndex;
  final GlobalKey<ScaffoldState> _scaffoldKey = GlobalKey<ScaffoldState>();

  @override
  void initState() {
    super.initState();
    // Actual clamping happens in build() because the available tabs can depend
    // on the authenticated user's role.
    _currentIndex = widget.initialIndex;
  }

  @override
  void didUpdateWidget(covariant HomeWrapper oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.initialIndex != widget.initialIndex) {
      _currentIndex = widget.initialIndex;
    }
  }

  @override
  Widget build(BuildContext context) {
    final role = context.select((UserAuthBloc bloc) => bloc.state.user?.role);
    final isAdmin = AppRoles.isAdmin(role);
    final isManager = AppRoles.isManager(role);
    final isMember = AppRoles.isMember(role);
    final openDrawer = () => _scaffoldKey.currentState?.openDrawer();

    final tabs = <({Widget screen, BottomNavigationBarItem item})>[];

    tabs.add((
      screen: Home(title: 'Home', onOpenDrawer: openDrawer),
      item: const BottomNavigationBarItem(
        icon: Icon(Icons.home_rounded),
        label: 'Home',
      ),
    ));

    if (isAdmin || isManager) {
      tabs.add((
        screen: DashboardScreen(onOpenDrawer: openDrawer),
        item: const BottomNavigationBarItem(
          icon: Icon(Icons.dashboard),
          label: 'Dashboard',
        ),
      ));
    }

    tabs.add((
      screen: ProjectsListScreen(onOpenDrawer: openDrawer),
      item: const BottomNavigationBarItem(
        icon: Icon(Icons.work),
        label: 'Projects',
      ),
    ));

    if (isMember) {
      tabs.add((
        screen: MyTasksScreen(onOpenDrawer: openDrawer),
        item: const BottomNavigationBarItem(
          icon: Icon(Icons.task_alt),
          label: 'My Tasks',
        ),
      ));
    }

    tabs.add((
      screen: Profile(title: 'Profile', onOpenDrawer: openDrawer),
      item: const BottomNavigationBarItem(
        icon: Icon(Icons.person),
        label: 'Profile',
      ),
    ));

    final screens = tabs.map((t) => t.screen).toList(growable: false);
    final items = tabs.map((t) => t.item).toList(growable: false);

    if (_currentIndex < 0 || _currentIndex > screens.length - 1) {
      _currentIndex = 0;
    }

    return Scaffold(
      key: _scaffoldKey,
      drawer: const AppDrawer(),
      body: IndexedStack(index: _currentIndex, children: screens),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          color: AppColors.brandPrimary,
          borderRadius: const BorderRadius.only(
            topLeft: Radius.circular(28),
            topRight: Radius.circular(28),
          ),
          boxShadow: [
            BoxShadow(
              color: Colors.black.withValues(alpha: 0.12),
              blurRadius: 18,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: SafeArea(
          top: false,
          child: Padding(
            padding: const EdgeInsets.fromLTRB(12, 8, 12, 10),
            child: Row(
              children: List.generate(items.length, (index) {
                final item = items[index];
                final isActive = index == _currentIndex;
                return Expanded(
                  flex: isActive ? 2 : 1,
                  child: Padding(
                    padding: EdgeInsets.symmetric(
                      horizontal: isActive ? 6 : 2,
                    ),
                    child: _BlueNavItem(
                      isActive: isActive,
                      label: item.label ?? '',
                      icon: item.icon,
                      onTap: () {
                        setState(() {
                          _currentIndex = index;
                        });
                      },
                    ),
                  ),
                );
              }),
            ),
          ),
        ),
      ),
    );
  }
}

class _BlueNavItem extends StatelessWidget {
  const _BlueNavItem({
    required this.isActive,
    required this.label,
    required this.icon,
    required this.onTap,
  });

  final bool isActive;
  final String label;
  final Widget icon;
  final VoidCallback onTap;

  @override
  Widget build(BuildContext context) {
    return Material(
      color: Colors.transparent,
      child: InkWell(
        borderRadius: BorderRadius.circular(18),
        onTap: onTap,
        child: AnimatedContainer(
          duration: const Duration(milliseconds: 160),
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 6),
          decoration: const BoxDecoration(color: Colors.transparent),
          child: Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                padding: EdgeInsets.symmetric(
                  horizontal: isActive ? 12 : 6,
                  vertical: 6,
                ),
                decoration: BoxDecoration(
                  color: isActive
                      ? Colors.white.withValues(alpha: 0.18)
                      : Colors.transparent,
                  borderRadius: BorderRadius.circular(16),
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    IconTheme(
                      data: const IconThemeData(size: 22, color: Colors.white),
                      child: icon,
                    ),
                    if (isActive) ...[
                      const SizedBox(width: 6),
                      Flexible(
                        child: Text(
                          label,
                          maxLines: 1,
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(
                            fontSize: 11,
                            fontWeight: FontWeight.w600,
                            color: Colors.white,
                          ),
                        ),
                      ),
                    ],
                  ],
                ),
              ),
              const SizedBox(height: 6),
              AnimatedContainer(
                duration: const Duration(milliseconds: 160),
                height: 3,
                width: isActive ? 24 : 0,
                decoration: BoxDecoration(
                  color: isActive ? Colors.white : Colors.transparent,
                  borderRadius: BorderRadius.circular(2),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
