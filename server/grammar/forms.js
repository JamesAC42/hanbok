// Turning the grammar names the analysis writes ("-(으)니까 (because)",
// "Topic particle 은/는") into keys we can match on. The model names the same
// point differently every time, so saves match on the target-language form
// first and fall back to the exact wording.

// Characters of each learning language's own script, plus the punctuation that
// grammar forms use (-(으)니까, ~ている, 은/는).
const SCRIPT_RUNS = {
    ko: /[-~(（]*[가-힣ㄱ-ㆎ][가-힣ㄱ-ㆎ\s()（）/\-~·]*/,
    ja: /[-~〜(（]*[぀-ヿ一-鿿][぀-ヿ一-鿿\s()（）/\-~〜・]*/,
    zh: /[-~(（]*[一-鿿][一-鿿\s()（）/\-~…]*/,
    'zh-TW': /[-~(（]*[一-鿿][一-鿿\s()（）/\-~…]*/,
    hi: /[-~(]*[ऀ-ॿ][ऀ-ॿ\s()/\-~]*/,
    ru: /[-~(]*[Ѐ-ӿ][Ѐ-ӿ\s()/\-~]*/,
};

// Same rule as the Learn registry's normalizeForm (app/src/content/learn/index.js),
// so a catalog form can be passed straight to articlesForGrammar.
const normalizeForm = (form) => String(form || '').replace(/[-()（）\s~〜·・…]/g, '').toLowerCase();

// The first run of the language's own script in a grammar name, trimmed of
// unbalanced brackets: "-(으)니까 (because)" -> "-(으)니까".
const extractForm = (pattern, language) => {
    const re = SCRIPT_RUNS[language];
    if (!re || typeof pattern !== 'string') return null;
    const match = pattern.match(re);
    if (!match) return null;
    let form = match[0].trim();
    // Drop a trailing "(" or "/" left from "은/는 (topic" style names.
    form = form.replace(/[\s/(（]+$/, '').trim();
    const opens = (form.match(/[(（]/g) || []).length;
    const closes = (form.match(/[)）]/g) || []).length;
    if (closes > opens) form = form.replace(/[)）]+$/, '').trim();
    if (opens > closes) form = form.replace(/[\s(（][^()（）]*$/, '').trim();
    return normalizeForm(form) ? form : null;
};

// Exact wording, for names the script form can't separate (Spanish, Italian...).
const aliasKey = (pattern) => String(pattern || '').toLowerCase().replace(/\s+/g, ' ').trim().slice(0, 200);

// Keys a catalog entry is found by: the whole form and each slash variant,
// so "는" finds "은/는" and "-아요/어요" is found by "어요".
const formKeys = (form) => {
    const whole = normalizeForm(form);
    if (!whole) return [];
    const keys = new Set([whole]);
    whole.split('/').filter(Boolean).forEach((part) => keys.add(part));
    return [...keys];
};

module.exports = { normalizeForm, extractForm, aliasKey, formKeys };
