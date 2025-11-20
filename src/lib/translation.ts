// Lightweight translation abstraction with provider fallback and in-memory caching.
// Attempts providers in configured order, returns first successful translation.

type ProviderFn = (text: string, targetLang: string) => Promise<string | null>;

const cache = new Map<string, string>();

// Map custom app language codes to provider-compatible codes.
// NOTE: Many local languages may not be supported by external APIs; we fall back gracefully.
const LANGUAGE_CODE_MAP: Record<string, string> = {
  lug: 'lg', // Luganda (Google uses 'lg')
  ach: 'ach', // Likely unsupported; will fail and return original
  teo: 'teo', // Likely unsupported
  lgg: 'lgg', // Likely unsupported
  nyn: 'nyn', // Likely unsupported
};

function normalizeTarget(lang: string): string {
  if (lang === 'en') return 'en';
  return LANGUAGE_CODE_MAP[lang] || lang;
}

// LibreTranslate (self-host or public). Requires VITE_LIBRETRANSLATE_URL
const libreTranslate: ProviderFn = async (text, targetLang) => {
  const base = import.meta.env.VITE_LIBRETRANSLATE_URL;
  if (!base) return null;
  try {
    const resp = await fetch(`${base.replace(/\/$/, '')}/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, source: 'auto', target: targetLang, format: 'text' })
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    return data.translatedText || null;
  } catch { return null; }
};

// DeepL (free or paid). Requires VITE_DEEPL_API_KEY
const deepL: ProviderFn = async (text, targetLang) => {
  const key = import.meta.env.VITE_DEEPL_API_KEY;
  if (!key) return null;
  // DeepL only supports certain languages; skip if obviously unsupported.
  if (targetLang.length > 3) return null;
  try {
    const form = new URLSearchParams();
    form.set('auth_key', key);
    form.set('text', text);
    form.set('target_lang', targetLang.toUpperCase());
    const resp = await fetch('https://api-free.deepl.com/v2/translate', { method: 'POST', body: form });
    if (!resp.ok) return null;
    const data = await resp.json();
    const translated = data.translations?.[0]?.text;
    return translated || null;
  } catch { return null; }
};

// Google Translate v2. Requires VITE_GOOGLE_TRANSLATE_API_KEY
const googleTranslate: ProviderFn = async (text, targetLang) => {
  const key = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;
  if (!key) return null;
  try {
    const resp = await fetch(`https://translation.googleapis.com/language/translate/v2?key=${key}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ q: text, target: targetLang })
    });
    if (!resp.ok) return null;
    const data = await resp.json();
    const translated = data.data?.translations?.[0]?.translatedText;
    return translated || null;
  } catch { return null; }
};

function buildProviderOrder(): ProviderFn[] {
  const orderRaw = import.meta.env.VITE_TRANSLATE_PROVIDER_ORDER as string | undefined;
  const order = orderRaw ? orderRaw.split(',').map(s => s.trim().toLowerCase()) : ['google', 'deepl', 'libre'];
  const mapping: Record<string, ProviderFn> = {
    google: googleTranslate,
    deepl: deepL,
    libre: libreTranslate,
  };
  return order.map(o => mapping[o]).filter(Boolean);
}

const providers = buildProviderOrder();

export async function translateText(text: string, targetLang: string): Promise<string> {
  const meta = await translateWithMeta(text, targetLang);
  return meta.text;
}

export interface TranslationMeta {
  text: string;              // final text (translated or original)
  translated: boolean;       // whether translation happened
  provider?: string;         // provider that succeeded
  targetLang: string;        // requested target language
  normalizedTarget: string;  // normalized provider language code
  attempts: number;          // number of provider attempts
  failedProviders: string[]; // provider names that failed
}

export async function translateWithMeta(text: string, targetLang: string): Promise<TranslationMeta> {
  const normalized = normalizeTarget(targetLang);
  const failedProviders: string[] = [];
  if (!text || normalized === 'en') {
    return {
      text,
      translated: false,
      provider: undefined,
      targetLang,
      normalizedTarget: normalized,
      attempts: 0,
      failedProviders
    };
  }

  const cacheKey = `${normalized}:${text}`;
  if (cache.has(cacheKey)) {
    return {
      text: cache.get(cacheKey)!,
      translated: true,
      provider: 'cache',
      targetLang,
      normalizedTarget: normalized,
      attempts: 0,
      failedProviders
    };
  }

  let attempts = 0;
  for (const provider of providers) {
    attempts++;
    try {
      const result = await provider(text, normalized);
      if (result && typeof result === 'string' && result.trim()) {
        cache.set(cacheKey, result);
        return {
          text: result,
          translated: true,
          provider: provider.name || 'anonymous-provider',
          targetLang,
          normalizedTarget: normalized,
          attempts,
          failedProviders
        };
      } else {
        failedProviders.push(provider.name || 'unknown');
      }
    } catch (e) {
      failedProviders.push(provider.name || 'unknown');
      if (import.meta.env.DEV && import.meta.env.VITE_TRANSLATION_LOG === 'verbose') {
        console.warn('[translation] provider failure', provider.name, e);
      }
    }
  }

  if (import.meta.env.VITE_TRANSLATION_LOG) {
    console.warn('[translation] all providers failed for', targetLang, 'normalized:', normalized, 'returning original text');
  }
  return {
    text,
    translated: false,
    provider: undefined,
    targetLang,
    normalizedTarget: normalized,
    attempts,
    failedProviders
  };
}

export function clearTranslationCache() {
  cache.clear();
}