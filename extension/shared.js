// Shared constants for the background worker, content script and popup.
// Keep LANGUAGES in sync with server/supported_languages.js.
(function (root) {
  const LANGUAGES = {
    ko: 'Korean (한국어)',
    ja: 'Japanese (日本語)',
    zh: 'Chinese (中文)',
    en: 'English',
    es: 'Spanish (Español)',
    it: 'Italian (Italiano)',
    fr: 'French (Français)',
    de: 'German (Deutsch)',
    nl: 'Dutch (Nederlands)',
    ru: 'Russian (Русский)',
    tr: 'Turkish (Türkçe)',
    id: 'Indonesian (Bahasa Indonesia)',
    vi: 'Vietnamese (Tiếng Việt)',
    hi: 'Hindi (हिन्दी)'
  };

  // The web app serves the API under /api via its Next.js rewrite, so one
  // origin covers both the site links and the API calls (and its cookie).
  const SITE_URLS = {
    production: 'https://hanbokstudy.com',
    local: 'http://localhost:3000'
  };

  const DEFAULT_SETTINGS = {
    sourceLanguage: 'ko',
    targetLanguage: 'en',
    highlightEnabled: true,
    selectionButtonEnabled: true,
    useLocalApi: false
  };

  root.HANBOK = { LANGUAGES, SITE_URLS, DEFAULT_SETTINGS };
})(typeof self !== 'undefined' ? self : window);
