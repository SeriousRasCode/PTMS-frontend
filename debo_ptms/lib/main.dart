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
          '/dashboard': (context) => const HomeWrapper(initialIndex: 0),
          '/projects': (context) => const RoleBasedHome(target: HomeTarget.projects),
          '/my-tasks': (context) => const RoleBasedHome(target: HomeTarget.myTasks),
          '/profile': (context) => const RoleBasedHome(target: HomeTarget.profile),
          '/admin/users': (context) => const RoleBasedHome(target: HomeTarget.adminUsers),
          '/admin/teams': (context) => const RoleBasedHome(target: HomeTarget.adminTeams),
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

enum HomeTarget { home, projects, myTasks, profile, adminUsers, adminTeams }

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
      // [0]=Home, [1]=Dashboard, [2]=Projects, [3]=Users, [4]=Teams, [5]=Profile
      index = switch (target) {
        HomeTarget.home => 0,
        HomeTarget.projects => 2,
        HomeTarget.adminUsers => 3,
        HomeTarget.adminTeams => 4,
        HomeTarget.profile => 5,
        HomeTarget.myTasks => 2,
      };
    } else if (isManager) {
      // [0]=Home, [1]=Dashboard, [2]=Projects, [3]=Profile
      index = switch (target) {
        HomeTarget.home => 0,
        HomeTarget.projects => 2,
        HomeTarget.profile => 3,
        HomeTarget.myTasks => 2,
        HomeTarget.adminUsers => 0,
        HomeTarget.adminTeams => 0,
      };
    } else if (isMember) {
      // [0]=Home, [1]=Projects, [2]=My Tasks, [3]=Profile
      index = switch (target) {
        HomeTarget.home => 0,
        HomeTarget.projects => 1,
        HomeTarget.myTasks => 2,
        HomeTarget.profile => 3,
        HomeTarget.adminUsers => 0,
        HomeTarget.adminTeams => 0,
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
          // HomeWrapper builds its tabs based on role.
          // Index 0 means: Dashboard (Admin/Manager) or Projects (Member).
          return const HomeWrapper(initialIndex: 0);
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

  @override
  void initState() {
    super.initState();
    // Actual clamping happens in build() because the available tabs can depend
    // on the authenticated user's role.
    _currentIndex = widget.initialIndex;
  }

  @override
  Widget build(BuildContext context) {
    final role = context.select((UserAuthBloc bloc) => bloc.state.user?.role);
    final isAdmin = AppRoles.isAdmin(role);
    final isManager = AppRoles.isManager(role);
    final isMember = AppRoles.isMember(role);

    final tabs = <({Widget screen, BottomNavigationBarItem item})>[];

    tabs.add((
      screen: const Home(title: 'Home'),
      item: const BottomNavigationBarItem(
        icon: Icon(Icons.home_rounded),
        label: 'Home',
      ),
    ));

    if (isAdmin || isManager) {
      tabs.add((
        screen: const DashboardScreen(),
        item: const BottomNavigationBarItem(
          icon: Icon(Icons.dashboard),
          label: 'Dashboard',
        ),
      ));
    }

    tabs.add((
      screen: const ProjectsListScreen(),
      item: const BottomNavigationBarItem(icon: Icon(Icons.work), label: 'Projects'),
    ));

    if (isMember) {
      tabs.add((
        screen: const MyTasksScreen(),
        item: const BottomNavigationBarItem(icon: Icon(Icons.task_alt), label: 'My Tasks'),
      ));
    }

    if (isAdmin) {
      tabs.add((
        screen: const AdminUsersScreen(),
        item: const BottomNavigationBarItem(icon: Icon(Icons.manage_accounts), label: 'Users'),
      ));
      tabs.add((
        screen: const AdminTeamsScreen(),
        item: const BottomNavigationBarItem(icon: Icon(Icons.groups), label: 'Teams'),
      ));
    }

    tabs.add((
      screen: const Profile(title: 'Profile'),
      item: const BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
    ));

    final screens = tabs.map((t) => t.screen).toList(growable: false);
    final items = tabs.map((t) => t.item).toList(growable: false);

    if (_currentIndex < 0 || _currentIndex > screens.length - 1) {
      _currentIndex = 0;
    }

    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: screens),
      bottomNavigationBar: BottomNavigationBar(
        elevation: 6,
        backgroundColor: AppColors.brandPrimary,
        selectedItemColor: Colors.white,
        unselectedItemColor: Colors.white70,
        type: BottomNavigationBarType.fixed,
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        items: items,
      ),
    );
  }
}
