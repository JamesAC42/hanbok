// Background service worker for the Hanbok extension.
// All requests to the Hanbok API go through here: the worker has host
// permissions for the site, so its fetches carry the user's session cookie
// and aren't subject to the page's CORS or CSP.
importScripts('shared.js');

const { SITE_URLS, DEFAULT_SETTINGS } = self.HANBOK;
const VOCAB_CACHE_MS = 5 * 60 * 1000;
const VOCAB_PAGE_SIZE = 200;

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.removeAll(() => {
    chrome.contextMenus.create({
      id: 'hanbokAnalyze',
      title: 'Analyze "%s" with Hanbok',
      contexts: ['selection']
    });
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  const text = info.selectionText?.trim();
  if (info.menuItemId !== 'hanbokAnalyze' || !text || !tab?.id) return;

  // The content script runs the analysis so it can show progress and the
  // result in the page. It isn't present on chrome:// or store pages.
  chrome.tabs.sendMessage(tab.id, { type: 'ANALYZE_SELECTION', text }).catch(() => {});
});

async function getSettings() {
  const stored = await chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS));
  return { ...DEFAULT_SETTINGS, ...stored };
}

async function getSiteUrl() {
  const { useLocalApi } = await getSettings();
  return useLocalApi ? SITE_URLS.local : SITE_URLS.production;
}

// Returns { ok, status, data }. Never throws, so callers can show the
// server's own error message.
async function api(path, options = {}) {
  const baseUrl = await getSiteUrl();
  try {
    const response = await fetch(`${baseUrl}${path}`, {
      credentials: 'include',
      ...options,
      headers: { 'Content-Type': 'application/json', ...options.headers }
    });
    let data = null;
    try {
      data = await response.json();
    } catch {
      // Non-JSON body (e.g. a proxy error page)
    }
    return { ok: response.ok, status: response.status, data };
  } catch (error) {
    console.error(`Hanbok API request to ${path} failed:`, error);
    return { ok: false, status: 0, data: null };
  }
}

function errorMessage(result, fallback) {
  if (result.status === 0) return 'Could not reach Hanbok. Check your connection.';
  if (result.status === 401) return 'Please log in to Hanbok first.';
  return result.data?.error?.message || result.data?.error || result.data?.message || fallback;
}

async function getSession() {
  const result = await api('/api/session');
  if (!result.ok || !result.data?.success) return { loggedIn: false };
  // Drop any cached logged-out state now that we know better.
  const { sourceLanguage } = await getSettings();
  const cacheKey = vocabCacheKey(await getSiteUrl(), sourceLanguage);
  const cached = (await chrome.storage.local.get(cacheKey))[cacheKey];
  if (cached?.loggedIn === false) await chrome.storage.local.remove(cacheKey);

  const { user } = result.data;
  return { loggedIn: true, name: user?.name || user?.email || '' };
}

function vocabCacheKey(siteUrl, language) {
  return `vocab2:${siteUrl}:${language}`;
}

async function clearVocabularyCache() {
  const all = await chrome.storage.local.get(null);
  const keys = Object.keys(all).filter((key) => key.startsWith('vocab'));
  if (keys.length) await chrome.storage.local.remove(keys);
}

// Saved words for the learning language, as [{ word, meaning }].
async function getVocabulary({ force = false } = {}) {
  const { sourceLanguage } = await getSettings();
  const siteUrl = await getSiteUrl();
  const cacheKey = vocabCacheKey(siteUrl, sourceLanguage);

  if (!force) {
    const cached = (await chrome.storage.local.get(cacheKey))[cacheKey];
    if (cached && Date.now() - cached.fetchedAt < VOCAB_CACHE_MS) {
      return { loggedIn: cached.loggedIn !== false, words: cached.words };
    }
  }

  const words = new Map();
  let page = 1;
  let totalPages = 1;
  do {
    const query = new URLSearchParams({
      page: String(page),
      limit: String(VOCAB_PAGE_SIZE),
      originalLanguage: sourceLanguage
    });
    const result = await api(`/api/words?${query}`);
    if (result.status === 401) {
      // Cache the logged-out state too, so browsing while logged out
      // doesn't send a request per page. getSession clears it once the
      // user is logged in (e.g. when they open the popup).
      await chrome.storage.local.set({ [cacheKey]: { fetchedAt: Date.now(), loggedIn: false, words: [] } });
      return { loggedIn: false, words: [] };
    }
    if (!result.ok || !result.data?.success) {
      return { loggedIn: true, words: [], error: errorMessage(result, 'Failed to load your words') };
    }
    for (const word of result.data.words || []) {
      const text = word.originalWord?.trim();
      if (text && !words.has(text)) words.set(text, { word: text, meaning: word.translatedWord || '' });
    }
    totalPages = result.data.totalPages || 1;
    page += 1;
  } while (page <= totalPages);

  const list = [...words.values()];
  await chrome.storage.local.set({ [cacheKey]: { fetchedAt: Date.now(), words: list } });
  return { loggedIn: true, words: list };
}

async function analyze(text) {
  const { sourceLanguage, targetLanguage } = await getSettings();
  const result = await api('/api/submit', {
    method: 'POST',
    body: JSON.stringify({
      text,
      originalLanguage: sourceLanguage,
      translationLanguage: targetLanguage
    })
  });

  const message = result.data?.message;
  if (!message?.isValid) {
    return {
      success: false,
      error: message?.error?.message || errorMessage(result, 'Failed to analyze the text')
    };
  }

  return {
    success: true,
    analysis: message.analysis,
    sentenceId: result.data.sentenceId,
    originalLanguage: result.data.originalLanguage,
    translationLanguage: result.data.translationLanguage,
    weeklyQuota: result.data.weeklyQuota || null,
    siteUrl: await getSiteUrl()
  };
}

async function addWord(word) {
  const result = await api('/api/words', {
    method: 'POST',
    body: JSON.stringify(word)
  });
  if (!result.ok || !result.data?.success) {
    if (result.data?.reachedLimit) {
      return { success: false, error: 'You have reached your saved words limit.' };
    }
    return { success: false, error: errorMessage(result, 'Failed to add the word') };
  }
  await clearVocabularyCache();
  return { success: true };
}

async function saveSentence(sentenceId) {
  const result = await api(`/api/sentences/${encodeURIComponent(sentenceId)}/save`, { method: 'POST' });
  if (!result.ok || !result.data?.success) {
    if (result.data?.reachedLimit) {
      return { success: false, error: 'You have reached your saved sentences limit.' };
    }
    return { success: false, error: errorMessage(result, 'Failed to save the sentence') };
  }
  return { success: true };
}

// Audio is only created up front for sentences someone analyzed before, so
// ask the server to generate it; it returns the existing audio when there
// is some. Free accounts have a limited number of generations, as on the site.
async function getAudio(sentenceId) {
  const result = await api(`/api/sentences/${encodeURIComponent(sentenceId)}/generate-audio`, { method: 'POST' });
  const url = result.data?.voice1 || result.data?.voice2;
  if (result.ok && result.data?.success && url) return { success: true, url };

  const code = result.data?.code;
  if (code === 'AUDIO_QUOTA_EXCEEDED') {
    return { success: false, upgrade: true, error: "You're out of free audio generations. Upgrade on Hanbok for unlimited audio." };
  }
  if (code === 'AUDIO_PREMIUM_LENGTH_REQUIRED') {
    return { success: false, upgrade: true, error: 'Audio for longer sentences is part of Hanbok Plus.' };
  }
  return { success: false, error: errorMessage(result, 'Audio is not available for this text') };
}

async function getWordAudio(word, translation) {
  const { sourceLanguage } = await getSettings();
  const query = new URLSearchParams({ word, language: sourceLanguage });
  if (sourceLanguage === 'ja' && translation) query.set('translation', translation);
  const result = await api(`/api/word-audio?${query}`);
  if (!result.ok || !result.data?.audioUrl) {
    return { success: false, error: errorMessage(result, 'Pronunciation is not available for this word') };
  }
  return { success: true, url: result.data.audioUrl };
}

// Synonyms and antonyms; the server limits this to Plus subscribers.
async function getWordRelations(word) {
  const { sourceLanguage, targetLanguage } = await getSettings();
  const query = new URLSearchParams({ word, originalLanguage: sourceLanguage, translationLanguage: targetLanguage });
  const result = await api(`/api/word-relations?${query}`);
  if (result.status === 403 && result.data?.error?.type === 'subscription') {
    return { success: false, upgrade: true, error: 'Synonyms and antonyms are part of Hanbok Plus.' };
  }
  if (!result.ok || !result.data?.success) {
    return { success: false, error: errorMessage(result, 'Could not load related words') };
  }
  return { success: true, synonyms: result.data.synonyms || [], antonyms: result.data.antonyms || [] };
}

const handlers = {
  GET_SESSION: () => getSession(),
  GET_VOCABULARY: (message) => getVocabulary({ force: message.force }),
  ANALYZE: (message) => analyze(message.text),
  ADD_WORD: (message) => addWord(message.word),
  SAVE_SENTENCE: (message) => saveSentence(message.sentenceId),
  GET_AUDIO: (message) => getAudio(message.sentenceId),
  GET_WORD_AUDIO: (message) => getWordAudio(message.word, message.translation),
  GET_WORD_RELATIONS: (message) => getWordRelations(message.word),
  GET_SITE_URL: () => getSiteUrl()
};

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  const handler = handlers[message?.type];
  if (!handler) return false;
  handler(message)
    .then(sendResponse)
    .catch((error) => {
      console.error(`Hanbok ${message.type} failed:`, error);
      sendResponse({ success: false, error: 'Something went wrong' });
    });
  return true; // Keep the channel open for the async response
});

// Changing language or server invalidates which words apply.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'sync' && (changes.sourceLanguage || changes.useLocalApi)) {
    clearVocabularyCache();
  }
});
