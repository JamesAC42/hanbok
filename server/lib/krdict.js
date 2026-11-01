// Korean Learners' Dictionary (krdict.korean.go.kr) lookups: a word's learner
// level, its Hanja, and other common words that share each Hanja character.
// Results are cached in Mongo (krdict_cache) because the free key has a daily
// quota and the same words come up again and again.

const SEARCH_URL = 'https://krdict.korean.go.kr/api/search';
const FRESH_MS = 90 * 24 * 60 * 60 * 1000;
// Empty answers are kept only a day, so a word krdict missed (or a response
// we misread) is asked again soon instead of hiding the panel for months.
const EMPTY_FRESH_MS = 24 * 60 * 60 * 1000;
const TIMEOUT_MS = 6000;

// krdict translation language codes (trans_lang).
const TRANS_LANG = { en: 1, ja: 2, fr: 3, es: 4, ar: 5, mn: 6, vi: 7, th: 8, id: 9, ru: 10 };

const LEVELS = { '초급': 'beginner', '중급': 'intermediate', '고급': 'advanced' };

// Our analysis "type" (English) to krdict part of speech.
const POS = {
    noun: '명사', pronoun: '대명사', numeral: '수사', number: '수사', verb: '동사',
    adjective: '형용사', adverb: '부사', determiner: '관형사', interjection: '감탄사',
    exclamation: '감탄사', 'dependent noun': '의존 명사', 'bound noun': '의존 명사',
};

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'" };
const decode = (s) => s.replace(/&(#x[0-9a-f]+|#\d+|\w+);/gi, (m, e) => {
    if (e[0] === '#') {
        const code = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : m;
    }
    return ENTITIES[e.toLowerCase()] ?? m;
});

// Tiny parser for krdict's plain XML (no attributes we need, CDATA text).
// Elements become objects; repeated elements become arrays; leaf text is a string.
const parseXml = (xml) => {
    const root = { children: {} };
    const stack = [root];
    const re = /<!\[CDATA\[([\s\S]*?)\]\]>|<!--[\s\S]*?-->|<\?[\s\S]*?\?>|<(\/?)([\w:.-]+)[^>]*?(\/?)>|([^<]+)/g;
    let m;
    while ((m = re.exec(xml))) {
        const top = stack[stack.length - 1];
        if (m[1] !== undefined) { top.text = (top.text || '') + m[1]; continue; }
        if (m[3] !== undefined) {
            const [, , closing, name, selfClosing] = m;
            if (closing) {
                const node = stack.pop();
                const parent = stack[stack.length - 1];
                if (!parent) break;
                const value = Object.keys(node.children).length ? node.children : (node.text || '').trim();
                const prev = parent.children[name];
                if (prev === undefined) parent.children[name] = value;
                else if (Array.isArray(prev)) prev.push(value);
                else parent.children[name] = [prev, value];
            } else {
                const node = { children: {} };
                if (selfClosing) {
                    const prev = top.children[name];
                    if (prev === undefined) top.children[name] = '';
                    else if (Array.isArray(prev)) prev.push('');
                    else top.children[name] = [prev, ''];
                } else stack.push(node);
            }
            continue;
        }
        if (m[5] !== undefined && m[5].trim()) top.text = (top.text || '') + decode(m[5]);
    }
    return root.children;
};

const list = (v) => (v === undefined || v === '' ? [] : Array.isArray(v) ? v : [v]);
const str = (v) => (typeof v === 'string' ? v.trim() : '');

const isHanja = (ch) => /[㐀-䶿一-鿿豈-﫿]/u.test(ch);

// The Hanja characters of a word, each paired with its Korean syllable when
// the word lines up (학교 / 學校, 공부하다 / 工夫).
const hanjaOf = (word, origin) => {
    const chars = [...str(origin)].filter(isHanja);
    if (!chars.length) return [];
    const syllables = [...str(word)].filter(ch => /[가-힣]/.test(ch));
    const aligned = syllables.length >= chars.length;
    return chars.map((char, i) => ({ char, reading: aligned ? syllables[i] : null }));
};

const normalizeItem = (item) => {
    const word = str(item.word).replace(/[\^-]/g, '');
    const senses = list(item.sense).map(s => {
        const tr = list(s.translation)[0] || {};
        return {
            definition: str(s.definition),
            translation: str(tr.trans_word),
            translationDefinition: str(tr.trans_dfn),
        };
    }).filter(s => s.definition || s.translation);
    return {
        word,
        homograph: Number(str(item.sup_no)) || 0,
        origin: str(item.origin),
        hanja: hanjaOf(word, item.origin),
        level: LEVELS[str(item.word_grade)] || null,
        pos: str(item.pos),
        pronunciation: str(item.pronunciation),
        link: str(item.link),
        senses,
    };
};

const parseSearch = (xml) => {
    const doc = parseXml(xml);
    if (doc.error) {
        const err = new Error(`krdict error ${str(doc.error.error_code)}: ${str(doc.error.message)}`);
        err.code = str(doc.error.error_code);
        throw err;
    }
    if (!doc.channel) throw new Error('krdict: unexpected response');
    return list(doc.channel.item).map(normalizeItem).filter(e => e.word);
};

const words = (s) => new Set(String(s || '').toLowerCase().match(/[\p{L}\p{N}]+/gu) || []);

// Choose the dictionary entry that matches the word in this sentence:
// right part of speech, meaning that overlaps the analysis, a learner level.
const pickEntry = (entries, query, { type, meaning } = {}) => {
    const exact = entries.filter(e => e.word === query);
    if (!exact.length) return null;
    const wantPos = POS[String(type || '').toLowerCase().replace(/_/g, ' ').trim()];
    const meaningWords = words(meaning);
    const score = (e) => {
        let s = 0;
        if (wantPos && e.pos === wantPos) s += 3;
        if (meaningWords.size) {
            const sense = words(e.senses.map(x => `${x.translation} ${x.translationDefinition}`).join(' '));
            for (const w of meaningWords) if (w.length > 2 && sense.has(w)) s += 2;
        }
        if (e.level) s += 1;
        return s;
    };
    return exact
        .map((e, i) => ({ e, s: score(e), i }))
        .sort((a, b) => b.s - a.s || a.e.homograph - b.e.homograph || a.i - b.i)[0].e;
};

const LEVEL_ORDER = { beginner: 0, intermediate: 1, advanced: 2 };

// Words that contain a Hanja character: learner-level words first, then the
// rest, never the word itself.
const familyFrom = (entries, char, exclude) => {
    const seen = new Set([exclude]);
    return entries
        .filter(e => e.origin.includes(char) && !seen.has(e.word) && seen.add(e.word))
        .sort((a, b) => (LEVEL_ORDER[a.level] ?? 3) - (LEVEL_ORDER[b.level] ?? 3))
        .map(e => ({
            word: e.word,
            origin: e.origin,
            level: e.level,
            meaning: e.senses[0]?.translation || e.senses[0]?.definition || '',
        }));
};

const createKrdict = ({ apiKey = process.env.KRDICT_API_KEY, getDb, fetchImpl = globalThis.fetch, now = Date.now } = {}) => {
    const pending = new Map();

    const request = async (params) => {
        const url = `${SEARCH_URL}?${new URLSearchParams({ key: apiKey, ...params })}`;
        const res = await fetchImpl(url, { signal: AbortSignal.timeout(TIMEOUT_MS) });
        if (!res.ok) throw new Error(`krdict HTTP ${res.status}`);
        return parseSearch(await res.text());
    };

    const cached = async (key, load) => {
        const col = getDb?.()?.collection('krdict_cache');
        const hit = col && await col.findOne({ _id: key }).catch(() => null);
        if (hit && now() - new Date(hit.at).getTime() < (hit.entries?.length ? FRESH_MS : EMPTY_FRESH_MS)) return hit.entries;
        if (pending.has(key)) return pending.get(key);
        const p = load().then(async (entries) => {
            if (col) await col.updateOne({ _id: key }, { $set: { entries, at: new Date(now()) } }, { upsert: true }).catch(() => {});
            return entries;
        }).finally(() => pending.delete(key));
        pending.set(key, p);
        return p;
    };

    const transLang = (lang) => TRANS_LANG[lang] || TRANS_LANG.en;

    const search = (q, lang) => cached(`w:${transLang(lang)}:${q}`, () => request({
        q, part: 'word', sort: 'dict', num: '20', translated: 'y', trans_lang: String(transLang(lang)),
    }));

    const searchHanja = (char, lang) => cached(`h:${transLang(lang)}:${char}`, () => request({
        q: char, part: 'word', sort: 'popular', num: '30', translated: 'y', trans_lang: String(transLang(lang)),
        advanced: 'y', target: '4', method: 'include', type2: 'chinese',
    }));

    const lookup = async (word, { type, meaning, lang = 'en', family = true, familySize = 8 } = {}) => {
        const q = String(word || '').trim();
        if (!q) return null;
        const entry = pickEntry(await search(q, lang), q, { type, meaning });
        if (!entry) return null;
        const families = family && entry.hanja.length
            ? await Promise.all(entry.hanja.map(async (h) => ({
                ...h,
                words: familyFrom(await searchHanja(h.char, lang).catch(() => []), h.char, entry.word).slice(0, familySize),
            })))
            : [];
        return { ...entry, families };
    };

    return { enabled: !!apiKey, lookup, search };
};

module.exports = { createKrdict, parseXml, parseSearch, pickEntry, hanjaOf, familyFrom, TRANS_LANG };
