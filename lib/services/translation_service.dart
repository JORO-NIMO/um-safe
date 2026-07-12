import 'dart:convert';
import 'package:http/http.dart' as http;

class TranslationService {
  static final TranslationService _instance = TranslationService._internal();
  factory TranslationService() => _instance;
  TranslationService._internal();

  final Map<String, String> _cache = {};

  final Map<String, String> _languageCodeMap = {
    'lug': 'lg', // Luganda
    'ach': 'ach',
    'teo': 'teo',
    'lgg': 'lgg',
    'nyn': 'nyn',
  };

  String _normalizeTarget(String lang) {
    if (lang == 'en') return 'en';
    return _languageCodeMap[lang] ?? lang;
  }

  // MyMemory Translation API (completely free, no key needed)
  Future<String?> _myMemoryTranslate(String text, String source, String target) async {
    try {
      final url = Uri.parse(
        'https://api.mymemory.translated.net/get?q=${Uri.encodeComponent(text)}&langpair=$source|$target',
      );
      final response = await http.get(url);
      if (response.statusCode == 200) {
        final data = jsonDecode(response.body);
        final translatedText = data['responseData']?['translatedText'] as String?;
        if (translatedText != null && translatedText.isNotEmpty) {
          return translatedText;
        }
      }
    } catch (e) {
      print('MyMemory translation error: $e');
    }
    return null;
  }

  Future<String> translate(String text, String targetLang) async {
    if (text.isEmpty || targetLang == 'en') {
      return text;
    }

    final normalized = _normalizeTarget(targetLang);
    final cacheKey = '$normalized:$text';
    if (_cache.containsKey(cacheKey)) {
      return _cache[cacheKey]!;
    }

    // Try MyMemory translation
    final myMemoryResult = await _myMemoryTranslate(text, 'en', normalized);
    if (myMemoryResult != null) {
      _cache[cacheKey] = myMemoryResult;
      return myMemoryResult;
    }

    // Fallback to original text if unsupported or failed
    return text;
  }
}
