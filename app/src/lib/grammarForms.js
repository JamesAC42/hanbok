// Pulls the target-language grammar form out of the analysis's name for a
// grammar point ("-(으)니까 (because)" -> "-(으)니까"). Mirrors
// server/grammar/forms.js.
const SCRIPT_RUNS = {
    ko: /[-~(（]*[가-힣ㄱ-ㆎ][가-힣ㄱ-ㆎ\s()（）/\-~·]*/,
    ja: /[-~〜(（]*[぀-ヿ一-鿿][぀-ヿ一-鿿\s()（）/\-~〜・]*/,
    zh: /[-~(（]*[一-鿿][一-鿿\s()（）/\-~…]*/,
    'zh-TW': /[-~(（]*[一-鿿][一-鿿\s()（）/\-~…]*/,
};

export const normalizeForm = (form) => String(form || '').replace(/[-()（）\s~〜·・…]/g, '').toLowerCase();

export const extractForm = (pattern, language) => {
    const re = SCRIPT_RUNS[language];
    if (!re || typeof pattern !== 'string') return null;
    const match = pattern.match(re);
    if (!match) return null;
    let form = match[0].trim().replace(/[\s/(（]+$/, '').trim();
    const opens = (form.match(/[(（]/g) || []).length;
    const closes = (form.match(/[)）]/g) || []).length;
    if (closes > opens) form = form.replace(/[)）]+$/, '').trim();
    if (opens > closes) form = form.replace(/[\s(（][^()（）]*$/, '').trim();
    return normalizeForm(form) ? form : null;
};

// An ending attaches to a stem ("-는", "~ている"); a particle or word stands
// alone ("은/는"). Never match one with the other.
const isEnding = (form) => /^\s*[-~〜]/.test(String(form || ''));

// The whole form or one slash variant, like the server's catalog keys.
export const formsMatch = (a, b) => {
    const x = normalizeForm(a);
    const y = normalizeForm(b);
    if (!x || !y) return false;
    if (x === y) return true;
    if (isEnding(a) !== isEnding(b)) return false;
    return x.split('/').includes(y) || y.split('/').includes(x);
};
