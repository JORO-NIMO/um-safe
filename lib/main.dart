import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'config.dart';
import 'services/app_state.dart';
import 'screens/landing_page.dart';
import 'screens/login_screen.dart';
import 'screens/signup_screen.dart';
import 'screens/recruiters_list_screen.dart';
import 'screens/chat_interface_screen.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize Supabase
  await Supabase.initialize(
    url: AppConfig.supabaseUrl,
    anonKey: AppConfig.supabaseAnonKey,
  );

  runApp(
    ChangeNotifierProvider(
      create: (context) => AppState(),
      child: const MyApp(),
    ),
  );
}

class MyApp extends StatelessWidget {
  const MyApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: 'UM-SAFE',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        brightness: Brightness.dark,
        primaryColor: const Color(0xFF38BDF8),
        scaffoldBackgroundColor: const Color(0xFF0F172A),
        colorScheme: const ColorScheme.dark(
          primary: Color(0xFF38BDF8),
          secondary: Color(0xFF0284C7),
          surface: Color(0xFF1E293B),
        ),
        useMaterial3: true,
      ),
      home: const RootNavigationCoordinator(),
    );
  }
}

class RootNavigationCoordinator extends StatefulWidget {
  const RootNavigationCoordinator({super.key});

  @override
  State<RootNavigationCoordinator> createState() => _RootNavigationCoordinatorState();
}

class _RootNavigationCoordinatorState extends State<RootNavigationCoordinator> {
  // Navigation states: 'landing', 'login', 'signup', 'chat'
  String _currentScreen = 'landing';

  void _navigateTo(String screen) {
    setState(() {
      _currentScreen = screen;
    });
  }

  @override
  Widget build(BuildContext context) {
    final state = Provider.of<AppState>(context);

    if (state.isLoading) {
      return const Scaffold(
        body: Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CircularProgressIndicator(color: Color(0xFF38BDF8)),
              SizedBox(height: 16),
              Text(
                'Loading UM-SAFE...',
                style: TextStyle(color: Color(0xFF94A3B8), fontSize: 15),
              ),
            ],
          ),
        ),
      );
    }

    // Force chat interface if user logged in and has moved beyond landing screen
    final userIsLoggedIn = state.currentUser != null;

    if (userIsLoggedIn && _currentScreen != 'landing') {
      _currentScreen = 'chat';
    } else if (!userIsLoggedIn && _currentScreen == 'chat') {
      _currentScreen = 'landing';
    }

    switch (_currentScreen) {
      case 'landing':
        return LandingPage(
          onGetStarted: () {
            if (userIsLoggedIn) {
              _navigateTo('chat');
            } else {
              _navigateTo('login');
            }
          },
          onViewRecruiters: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const RecruitersListScreen()),
            );
          },
        );

      case 'login':
        return LoginScreen(
          onSignUpTap: () => _navigateTo('signup'),
          onBackTap: () => _navigateTo('landing'),
        );

      case 'signup':
        return SignUpScreen(
          onSignInTap: () => _navigateTo('login'),
        );

      case 'chat':
        return ChatInterfaceScreen(
          onBack: () => _navigateTo('landing'),
        );

      default:
        return LandingPage(
          onGetStarted: () {
            if (userIsLoggedIn) {
              _navigateTo('chat');
            } else {
              _navigateTo('login');
            }
          },
          onViewRecruiters: () {
            Navigator.push(
              context,
              MaterialPageRoute(builder: (context) => const RecruitersListScreen()),
            );
          },
        );
    }
  }
}
