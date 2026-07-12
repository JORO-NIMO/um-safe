import 'package:supabase_flutter/supabase_flutter.dart';
import '../models/models.dart';

class SupabaseService {
  static final SupabaseService _instance = SupabaseService._internal();
  factory SupabaseService() => _instance;
  SupabaseService._internal();

  final SupabaseClient _client = Supabase.instance.client;

  SupabaseClient get client => _client;

  // Auth Operations
  User? get currentUser => _client.auth.currentUser;
  Session? get currentSession => _client.auth.currentSession;
  Stream<AuthState> get authStateChanges => _client.auth.onAuthStateChange;

  Future<AuthResponse> signIn(String email, String password) async {
    return await _client.auth.signInWithPassword(email: email, password: password);
  }

  Future<AuthResponse> signUp(String email, String password, {required String fullName, required String preferredLanguage}) async {
    final response = await _client.auth.signUp(
      email: email,
      password: password,
      data: {
        'full_name': fullName,
        'preferred_language': preferredLanguage,
      },
    );

    if (response.user != null) {
      // Create user profile
      await createProfile(response.user!.id, preferredLanguage);
    }

    return response;
  }

  Future<void> signOut() async {
    await _client.auth.signOut();
  }

  Future<void> resetPassword(String email, String redirectUrl) async {
    await _client.auth.resetPasswordForEmail(email, redirectTo: redirectUrl);
  }

  // Profile Operations
  Future<void> createProfile(String userId, String preferredLanguage) async {
    await _client.from('profiles').upsert({
      'user_id': userId,
      'preferred_language': preferredLanguage,
    });
  }

  Future<String> getPreferredLanguage(String userId) async {
    try {
      final response = await _client
          .from('profiles')
          .select('preferred_language')
          .eq('user_id', userId)
          .maybeSingle();
      if (response != null && response['preferred_language'] != null) {
        return response['preferred_language'] as String;
      }
    } catch (e) {
      print('Error getting preferred language: $e');
    }
    return 'en';
  }

  Future<void> updatePreferredLanguage(String userId, String lang) async {
    await _client.from('profiles').upsert({
      'user_id': userId,
      'preferred_language': lang,
    });
  }

  // Chat History
  Future<List<ChatMessage>> getChatHistory(String userId) async {
    final List<dynamic> response = await _client
        .from('chat_messages')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', ascending: true)
        .limit(50);

    return response.map((json) => ChatMessage.fromJson(json)).toList();
  }

  // Knowledge Base Data
  Future<List<Embassy>> getEmbassies() async {
    final List<dynamic> response = await _client
        .from('embassy_contacts')
        .select('*')
        .order('country');

    return response.map((json) => Embassy.fromJson(json)).toList();
  }

  Future<List<Recruiter>> getRecruiters() async {
    final List<dynamic> response = await _client
        .from('recruiters')
        .select('*')
        .order('company_name');

    return response.map((json) => Recruiter.fromJson(json)).toList();
  }

  Future<List<RightsResource>> getRightsResources() async {
    final List<dynamic> response = await _client
        .from('rights_resources')
        .select('*')
        .order('priority', ascending: false);

    return response.map((json) => RightsResource.fromJson(json)).toList();
  }
}
