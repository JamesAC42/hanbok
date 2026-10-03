// Builds the regular expression that finds saved vocabulary in page text.
// Kept separate from content.js so it can be tested without a browser.
(function (root) {
  // Common Korean particles a one-syllable noun may carry (책을, 물이).
  const KO_PARTICLES = '(?:은|는|이|가|을|를|의|에|도|만|로|으로|와|과|에서|에게|한테|까지|부터|처럼|보다)?';
  const LETTER = '[\\p{L}\\p{M}\\p{N}]';

  function escapeRegExp(text) {
    return text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function byLengthDesc(a, b) {
    return b.length - a.length;
  }

  // Korean attaches particles and verb endings directly to the word, so a
  // saved dictionary form rarely appears verbatim. Match the stem at the
  // start of a word and take the rest of that word with it:
  //   공부하다 -> 공부해요   기다리다 -> 기다리고   사람 -> 사람들은
  // Contracted endings (기다려요) are missed. One-syllable stems would
  // match too much (가다 -> 가방), so those only match on their own or
  // with a particle.
  function koreanPattern(words) {
    const prefixes = [];
    const exact = [];
    for (const word of words) {
      let stem = word;
      if (word.length > 2 && word.endsWith('하다')) stem = word.slice(0, -2);
      else if (word.length > 2 && word.endsWith('다')) stem = word.slice(0, -1);
      if (stem.length >= 2) prefixes.push(escapeRegExp(stem));
      else exact.push(escapeRegExp(word));
    }
    const parts = [];
    if (prefixes.length) parts.push(`(?:${prefixes.sort(byLengthDesc).join('|')})\\p{Script=Hangul}*`);
    if (exact.length) parts.push(`(?:${exact.sort(byLengthDesc).join('|')})${KO_PARTICLES}(?!${LETTER})`);
    return `(?<!${LETTER})(?:${parts.join('|')})`;
  }

  // Build a matcher for the given saved words, or null when there is nothing
  // to match. `language` is the learning language code.
  function buildVocabularyPattern(words, language) {
    const unique = [...new Set(words.map((word) => word.trim()).filter(Boolean))];
    if (!unique.length) return null;

    let source;
    if (language === 'ko') {
      source = koreanPattern(unique);
    } else if (language === 'ja' || language === 'zh' || language === 'zh-TW') {
      // No spaces between words, so match anywhere; longest first so 日本語
      // wins over 日本.
      source = `(?:${unique.map(escapeRegExp).sort(byLengthDesc).join('|')})`;
    } else {
      // JS \b only understands ASCII, so use Unicode letter lookarounds.
      source = `(?<!${LETTER})(?:${unique.map(escapeRegExp).sort(byLengthDesc).join('|')})(?!${LETTER})`;
    }
    return new RegExp(source, 'giu');
  }

  // Scripts used to decide whether a selection looks like the learning
  // language before offering to analyze it. Latin-script languages always
  // qualify since there is no cheap way to tell them apart.
  const SCRIPT_TESTS = {
    ko: /\p{Script=Hangul}/u,
    ja: /[\p{Script=Hiragana}\p{Script=Katakana}\p{Script=Han}]/u,
    zh: /\p{Script=Han}/u,
    'zh-TW': /\p{Script=Han}/u,
    ru: /\p{Script=Cyrillic}/u,
    hi: /\p{Script=Devanagari}/u
  };

  function looksLikeLanguage(text, language) {
    const test = SCRIPT_TESTS[language];
    return test ? test.test(text) : /\p{L}/u.test(text);
  }

  // Which saved word a highlighted piece of text came from (사람들은 ->
  // 사람). Uses the same rules as the page-wide pattern, one word at a
  // time; the longest matching word wins.
  function findVocabularyWord(text, words, language) {
    let best = null;
    for (const word of words) {
      const pattern = buildVocabularyPattern([word], language);
      if (!pattern) continue;
      const match = pattern.exec(text);
      if (match && match.index === 0 && match[0].length === text.length
          && (!best || word.length > best.length)) {
        best = word;
      }
    }
    return best;
  }

  const api = { buildVocabularyPattern, looksLikeLanguage, findVocabularyWord };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.HANBOK_HIGHLIGHT = api;
})(typeof self !== 'undefined' ? self : globalThis);
