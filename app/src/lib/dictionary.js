// Korean Learners' Dictionary lookups (server: /api/dictionary/word), cached
// for the page session so reopening a word is instant.

export const LEVELS = {
    beginner: { label: 'Beginner word', topik: 'TOPIK 1–2' },
    intermediate: { label: 'Intermediate word', topik: 'TOPIK 3–4' },
    advanced: { label: 'Advanced word', topik: 'TOPIK 5–6' },
};

const HANGUL = /[가-힣]/;

export const canLookUp = (wordInfo, language) =>
    language === 'ko' && !!wordInfo && !wordInfo.isParticle &&
    typeof wordInfo.dictionary_form === 'string' && HANGUL.test(wordInfo.dictionary_form) &&
    wordInfo.type !== 'punctuation';

export const lookupParams = (wordInfo, lang = 'en') => {
    const params = new URLSearchParams({ word: wordInfo.dictionary_form.trim() });
    if (wordInfo.type) params.set('type', wordInfo.type);
    if (wordInfo.meaning?.description) params.set('meaning', wordInfo.meaning.description.slice(0, 200));
    params.set('lang', lang || 'en');
    return params;
};

const cache = new Map();

export const fetchDictionary = (wordInfo, lang, fetchImpl = fetch) => {
    const params = lookupParams(wordInfo, lang);
    const key = params.toString();
    if (!cache.has(key)) {
        const p = fetchImpl(`/api/dictionary/word?${key}`, { credentials: 'include' })
            .then(res => res.json().catch(() => ({})).then(data => {
                if (!res.ok || !data.success) throw new Error(data.message || 'Dictionary lookup failed');
                return data.available ? data.entry : null;
            }))
            .catch(err => { cache.delete(key); throw err; });
        cache.set(key, p);
    }
    return cache.get(key);
};

export const clearDictionaryCache = () => cache.clear();
