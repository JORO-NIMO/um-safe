import 'dart:convert';
import 'package:flutter/foundation.dart';
import 'package:supabase_flutter/supabase_flutter.dart';
import 'package:http/http.dart' as http;
import '../config.dart';
import '../models/models.dart';
import 'supabase_service.dart';
import 'translation_service.dart';

class AppState extends ChangeNotifier {
  final SupabaseService _supabaseService = SupabaseService();
  final TranslationService _translationService = TranslationService();

  User? _currentUser;
  bool _isLoading = true;
  String _preferredLanguage = 'en';
  List<ChatMessage> _messages = [];
  bool _isChatLoading = false;

  // Knowledge Base Cached Lists
  List<Embassy> _embassies = [];
  List<Recruiter> _recruiters = [];
  List<RightsResource> _resources = [];
  bool _loadingKb = false;

  User? get currentUser => _currentUser;
  bool get isLoading => _isLoading;
  String get preferredLanguage => _preferredLanguage;
  List<ChatMessage> get messages => _messages;
  bool get isChatLoading => _isChatLoading;

  List<Embassy> get embassies => _embassies;
  List<Recruiter> get recruiters => _recruiters;
  List<RightsResource> get resources => _resources;
  bool get loadingKb => _loadingKb;

  AppState() {
    _initSession();
  }

  void _initSession() {
    _currentUser = _supabaseService.currentUser;
    _isLoading = false;
    notifyListeners();

    _supabaseService.authStateChanges.listen((data) async {
      _currentUser = data.session?.user ?? _supabaseService.currentUser;
      if (_currentUser != null) {
        _isLoading = true;
        notifyListeners();

        _preferredLanguage = await _supabaseService.getPreferredLanguage(_currentUser!.id);
        await loadChatHistory();
        await loadKnowledgeBase();
      } else {
        _preferredLanguage = 'en';
        _messages = [];
      }
      _isLoading = false;
      notifyListeners();
    });
  }

  Future<void> changeLanguage(String newLang) async {
    _preferredLanguage = newLang;
    notifyListeners();

    if (_currentUser != null) {
      try {
        await _supabaseService.updatePreferredLanguage(_currentUser!.id, newLang);
      } catch (e) {
        print('Error updating language preference in DB: $e');
      }
    }
  }

  Future<void> loadChatHistory() async {
    if (_currentUser == null) return;
    try {
      final List<ChatMessage> history = await _supabaseService.getChatHistory(_currentUser!.id);
      if (history.isEmpty) {
        final welcome = '👋 Hello! I am UM-SAFE, your safe migration assistant. I can help you with:\n\n✓ Recruiter verification\n✓ Understanding your rights\n✓ Emergency contacts\n✓ Travel safety tips\n\nHow can I assist you today?';
        final translatedWelcome = await _translationService.translate(welcome, _preferredLanguage);
        _messages = [
          ChatMessage(
            id: 'welcome',
            role: 'assistant',
            content: translatedWelcome,
            language: _preferredLanguage,
            createdAt: DateTime.now(),
          )
        ];
      } else {
        _messages = history;
      }
      notifyListeners();
    } catch (e) {
      print('Error loading chat history: $e');
    }
  }

  Future<void> loadKnowledgeBase() async {
    _loadingKb = true;
    notifyListeners();
    try {
      final results = await Future.wait([
        _supabaseService.getEmbassies(),
        _supabaseService.getRecruiters(),
        _supabaseService.getRightsResources(),
      ]);
      _embassies = results[0] as List<Embassy>;
      _recruiters = results[1] as List<Recruiter>;
      _resources = results[2] as List<RightsResource>;
    } catch (e) {
      print('Error loading knowledge base data: $e');
    } finally {
      _loadingKb = false;
      notifyListeners();
    }
  }

  // Stream chatbot responses
  Future<void> sendMessage(String text) async {
    if (_currentUser == null || text.trim().isEmpty) return;

    final userMsgText = text.trim();
    // 1. Add user message to local UI
    final localUserMsg = ChatMessage(
      id: DateTime.now().toIso8601String(),
      role: 'user',
      content: userMsgText,
      language: _preferredLanguage,
      createdAt: DateTime.now(),
    );
    _messages.add(localUserMsg);
    _isChatLoading = true;
    notifyListeners();

    try {
      // 2. Translate outgoing message if preferred language is not English (Backend assumes English context)
      String outboundMsgText = userMsgText;
      if (_preferredLanguage != 'en') {
        outboundMsgText = await _translationService.translate(userMsgText, 'en');
      }

      // 3. Make HTTP post request to Supabase edge function 'chat'
      final chatUrl = '${AppConfig.supabaseUrl}/functions/v1/chat';
      final session = _supabaseService.currentSession;
      if (session == null) throw Exception('No authenticated session');

      final List<Map<String, String>> apiMessages = _messages.map((m) {
        return {
          'role': m.role,
          'content': m.role == 'user' ? outboundMsgText : m.content,
        };
      }).toList();

      final response = await http.post(
        Uri.parse(chatUrl),
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer ${session.accessToken}',
        },
        body: jsonEncode({
          'messages': apiMessages,
          'language': _preferredLanguage,
        }),
      );

      if (response.statusCode != 200) {
        throw Exception('Chat API returned status code ${response.statusCode}');
      }

      // Parse non-streaming JSON response or extract content
      String assistantText = "";
      try {
        final decoded = jsonDecode(response.body);
        if (decoded is Map && decoded['choices'] != null) {
          assistantText = decoded['choices'][0]['message']['content'] ?? '';
        } else {
          assistantText = response.body;
        }
      } catch (_) {
        // If SSE stream format or non-JSON, read lines
        final lines = response.body.split('\n');
        for (var line in lines) {
          if (line.startsWith('data: ')) {
            final dataStr = line.substring(6).trim();
            if (dataStr == '[DONE]') break;
            try {
              final parsed = jsonDecode(dataStr);
              final delta = parsed['choices']?[0]?['delta']?['content'];
              if (delta != null) {
                assistantText += delta;
              }
            } catch (_) {}
          }
        }
        if (assistantText.isEmpty) {
          assistantText = response.body;
        }
      }

      if (assistantText.isEmpty) {
        throw Exception('Could not parse response content.');
      }

      // 4. Translate incoming text back to preferred language if necessary
      String finalAssistantText = assistantText;
      if (_preferredLanguage != 'en') {
        finalAssistantText = await _translationService.translate(assistantText, _preferredLanguage);
      }

      // 5. Add assistant message to local UI
      final assistantMsg = ChatMessage(
        id: DateTime.now().toIso8601String(),
        role: 'assistant',
        content: finalAssistantText,
        language: _preferredLanguage,
        createdAt: DateTime.now(),
      );
      _messages.add(assistantMsg);

    } catch (e) {
      print('Send message error: $e');
      _messages.add(ChatMessage(
        id: DateTime.now().toIso8601String(),
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please try again or contact support if the issue persists.',
        language: _preferredLanguage,
        createdAt: DateTime.now(),
      ));
    } finally {
      _isChatLoading = false;
      notifyListeners();
    }
  }
}
