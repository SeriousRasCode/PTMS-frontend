import 'package:flutter/material.dart';
import '../screens/dashboard/home.dart';
import '../screens/dashboard/projects.dart';
import '../screens/dashboard/profile.dart';
import '../screens/login.dart';
import '../screens/signup.dart';

void main() {
  runApp(const MyApp());
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  // This widget is the root of your application.
  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      debugShowCheckedModeBanner: false,
      title: 'Flutter Demo',
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(seedColor: const Color(0xFF0F5841)),
      ),
      initialRoute: '/',
      routes: {
        '/': (context) => const HomeWrapper(initialIndex: 0),
        '/home': (context) => const HomeWrapper(initialIndex: 0),
        '/projects': (context) => const HomeWrapper(initialIndex: 1),
        '/profile': (context) => const HomeWrapper(initialIndex: 2),
        '/login': (context) => const Login(),
        '/signup': (context) => const Signup(),
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

  final List<Widget> _screens = [
    const Home(title: 'Tasks'),
    const Projects(title: 'Projects'),
    const Profile(title: 'Profile'),
  ];

  @override
  void initState() {
    super.initState();
    _currentIndex = widget.initialIndex.clamp(0, _screens.length - 1);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: IndexedStack(index: _currentIndex, children: _screens),
      bottomNavigationBar: BottomNavigationBar(
        elevation: 5,
        currentIndex: _currentIndex,
        onTap: (index) {
          setState(() {
            _currentIndex = index;
          });
        },
        items: const [
          BottomNavigationBarItem(icon: Icon(Icons.home), label: 'Home'),
          BottomNavigationBarItem(icon: Icon(Icons.work), label: 'Projects'),
          BottomNavigationBarItem(icon: Icon(Icons.person), label: 'Profile'),
        ],
      ),
    );
  }
}
