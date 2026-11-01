// Korean pronunciation from spelling: applies the standard sound-change rules
// (표준 발음법) and reports each change so the page can explain it.
// No LLM involved, so the output is the same every time. Inside a word every
// syllable boundary is handled; across a space only the tensing after the
// -(으)ㄹ ending (할 수 → [할 쑤]), which is the one that standard speech applies.

const BASE = 0xac00;
const CHO = ['ㄱ','ㄲ','ㄴ','ㄷ','ㄸ','ㄹ','ㅁ','ㅂ','ㅃ','ㅅ','ㅆ','ㅇ','ㅈ','ㅉ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];
const JUNG = ['ㅏ','ㅐ','ㅑ','ㅒ','ㅓ','ㅔ','ㅕ','ㅖ','ㅗ','ㅘ','ㅙ','ㅚ','ㅛ','ㅜ','ㅝ','ㅞ','ㅟ','ㅠ','ㅡ','ㅢ','ㅣ'];
const JONG = ['','ㄱ','ㄲ','ㄳ','ㄴ','ㄵ','ㄶ','ㄷ','ㄹ','ㄺ','ㄻ','ㄼ','ㄽ','ㄾ','ㄿ','ㅀ','ㅁ','ㅂ','ㅄ','ㅅ','ㅆ','ㅇ','ㅈ','ㅊ','ㅋ','ㅌ','ㅍ','ㅎ'];

const SPLIT = {
    'ㄳ': ['ㄱ','ㅅ'], 'ㄵ': ['ㄴ','ㅈ'], 'ㄶ': ['ㄴ','ㅎ'], 'ㄺ': ['ㄹ','ㄱ'], 'ㄻ': ['ㄹ','ㅁ'], 'ㄼ': ['ㄹ','ㅂ'],
    'ㄽ': ['ㄹ','ㅅ'], 'ㄾ': ['ㄹ','ㅌ'], 'ㄿ': ['ㄹ','ㅍ'], 'ㅀ': ['ㄹ','ㅎ'], 'ㅄ': ['ㅂ','ㅅ'],
};
// The seven sounds a final consonant can have.
const NEUTRAL = {
    'ㄱ':'ㄱ','ㄲ':'ㄱ','ㅋ':'ㄱ','ㄳ':'ㄱ','ㄺ':'ㄱ',
    'ㄴ':'ㄴ','ㄵ':'ㄴ','ㄶ':'ㄴ',
    'ㄷ':'ㄷ','ㅅ':'ㄷ','ㅆ':'ㄷ','ㅈ':'ㄷ','ㅊ':'ㄷ','ㅌ':'ㄷ','ㅎ':'ㄷ',
    'ㄹ':'ㄹ','ㄼ':'ㄹ','ㄽ':'ㄹ','ㄾ':'ㄹ','ㅀ':'ㄹ',
    'ㅁ':'ㅁ','ㄻ':'ㅁ',
    'ㅂ':'ㅂ','ㅍ':'ㅂ','ㅄ':'ㅂ','ㄿ':'ㅂ',
    'ㅇ':'ㅇ',
};
const TENSE = { 'ㄱ':'ㄲ','ㄷ':'ㄸ','ㅂ':'ㅃ','ㅅ':'ㅆ','ㅈ':'ㅉ' };
const ASPIRATE = { 'ㄱ':'ㅋ','ㄷ':'ㅌ','ㅂ':'ㅍ','ㅈ':'ㅊ' };
const NASAL = { 'ㄱ':'ㅇ','ㄷ':'ㄴ','ㅂ':'ㅁ' };
// Finals that sound like ㄱ, ㄷ or ㅂ and so make the next consonant tense.
// ㄵ and ㄻ only end verb stems (앉고 [안꼬], 젊다 [점따]), so they count too.
const TENSING_FINALS = new Set(['ㄱ','ㄲ','ㅋ','ㄳ','ㄺ','ㄷ','ㅅ','ㅆ','ㅈ','ㅊ','ㅌ','ㅂ','ㅍ','ㅄ','ㄿ','ㄼ','ㄵ','ㄻ']);

// Common Sino-Korean words where ㄷ ㅅ ㅈ after ㄹ turn tense (열심 [열씸]).
// Spelling can't show which words are Sino-Korean, so this is a list.
export const SINO_TENSE_WORDS = [
    '열심','열정','발전','발생','발달','발사','발상','발주','실제','실수','실시','실정','실종','실적',
    '활동','활자','결정','결석','결심','결전','일정','일상','일단','일생','일등','일시','일자','갈등',
    '절대','절정','필수','필자','물질','물자','설정','설득','출신','출석','출장','출동','별도',
    '열등','몰상식','팔자','말살','멸종','철저','철도','칠십','팔십','일주','질서','절실','실장',
];

const isSyllable = (ch) => {
    const c = ch.charCodeAt(0);
    return c >= BASE && c <= 0xd7a3;
};

const decompose = (ch) => {
    const n = ch.charCodeAt(0) - BASE;
    return { cho: CHO[Math.floor(n / 588)], jung: JUNG[Math.floor((n % 588) / 28)], jong: JONG[n % 28] };
};

const compose = ({ cho, jung, jong }) =>
    String.fromCharCode(BASE + (CHO.indexOf(cho) * 21 + JUNG.indexOf(jung)) * 28 + JONG.indexOf(jong || ''));

export const RULES = {
    linking: {
        name: 'Linking', ko: '연음',
        why: 'A final consonant slides onto the next syllable when that syllable starts with a vowel sound.',
    },
    nasal: {
        name: 'Nasal sound', ko: '비음화',
        why: 'A ㄱ, ㄷ or ㅂ sound right before ㄴ or ㅁ turns into ㅇ, ㄴ or ㅁ.',
    },
    nasalR: {
        name: 'ㄹ becomes ㄴ', ko: 'ㄹ의 비음화',
        why: 'After ㅁ or ㅇ (and after ㄱ or ㅂ, which then turn into ㅇ or ㅁ), ㄹ is said as ㄴ.',
    },
    liquid: {
        name: 'Double ㄹ', ko: '유음화',
        why: 'ㄴ next to ㄹ is said as ㄹ, so the pair sounds like ㄹㄹ.',
    },
    aspirate: {
        name: 'ㅎ merges', ko: '격음화',
        why: 'ㅎ blends with a ㄱ, ㄷ, ㅂ or ㅈ next to it into the breathy ㅋ, ㅌ, ㅍ or ㅊ.',
    },
    hdrop: {
        name: 'Silent ㅎ', ko: 'ㅎ 탈락',
        why: 'A final ㅎ goes silent before a vowel. If it shares the final with another consonant, that one slides over instead.',
    },
    hNasal: {
        name: 'ㅎ before ㄴ', ko: 'ㅎ의 비음화',
        why: 'A final ㅎ before ㄴ is said as ㄴ (놓는 [논는]).',
    },
    palatal: {
        name: 'ㄷ/ㅌ + 이', ko: '구개음화',
        why: 'ㄷ and ㅌ before the vowel 이 are said as ㅈ and ㅊ (같이 [가치]).',
    },
    tense: {
        name: 'Tense sound', ko: '경음화',
        why: 'After a ㄱ, ㄷ or ㅂ sound, the next ㄱ ㄷ ㅂ ㅅ ㅈ is said tense: ㄲ ㄸ ㅃ ㅆ ㅉ.',
    },
    tenseStem: {
        name: 'Tense after a stem', ko: '경음화',
        why: 'When a verb stem ends in ㄴ or ㅁ, the ending\'s ㄱ ㄷ ㅅ ㅈ is said tense (신고 [신꼬]).',
    },
    tenseFuture: {
        name: 'Tense after -(으)ㄹ', ko: '경음화',
        why: 'After the -(으)ㄹ ending, the next ㄱ ㄷ ㅂ ㅅ ㅈ is said tense, even across a space (할 수 [할 쑤], 갈게요 [갈께요]).',
    },
    tenseSino: {
        name: 'Tense in Sino-Korean', ko: '경음화',
        why: 'In Sino-Korean words, ㄷ ㅅ ㅈ after a final ㄹ are said tense (열심 [열씸]). Spelling never shows this.',
    },
    final: {
        name: 'Final sound', ko: '음절의 끝소리',
        why: 'A syllable can only end in 7 sounds: ㄱ ㄴ ㄷ ㄹ ㅁ ㅂ ㅇ. So ㅅ ㅆ ㅈ ㅊ ㅌ ㅎ end like ㄷ, ㅋ ㄲ like ㄱ, ㅍ like ㅂ, and a double final keeps one sound.',
    },
};

// Resolves one boundary between a syllable's final (coda) and the next
// syllable's first consonant (onset). `ctx.tense` names a tensing rule the
// caller found from the word's grammar.
export const resolveBoundary = (coda, onset, nextVowel, ctx = {}) => {
    if (!coda) return { coda, onset, rules: [] };
    const [first, second] = SPLIT[coda] || [coda, null];

    // Finals with ㅎ: ㅎ, ㄶ, ㅀ
    if (coda === 'ㅎ' || coda === 'ㄶ' || coda === 'ㅀ') {
        const rest = coda === 'ㅎ' ? '' : first;
        if (ASPIRATE[onset]) return { coda: rest, onset: ASPIRATE[onset], rules: ['aspirate'] };
        if (onset === 'ㅅ') return { coda: rest, onset: 'ㅆ', rules: ['tense'] };
        if (onset === 'ㄴ') {
            if (rest === 'ㄹ') return { coda: 'ㄹ', onset: 'ㄹ', rules: ['liquid'] };
            return { coda: 'ㄴ', onset, rules: [rest ? 'hdrop' : 'hNasal'] };
        }
        if (onset === 'ㅇ') return rest ? { coda: '', onset: rest, rules: ['hdrop'] } : { coda: '', onset, rules: ['hdrop'] };
        return { coda: rest || 'ㄷ', onset, rules: [] };
    }

    // ㅎ after ㄱ ㄷ ㅂ ㅈ: the two merge into one breathy consonant.
    if (onset === 'ㅎ') {
        const tail = second || coda;
        const keep = second ? first : '';
        const n = NEUTRAL[tail];
        if (n === 'ㄱ') return { coda: keep, onset: 'ㅋ', rules: ['aspirate'] };
        if (n === 'ㅂ') return { coda: keep, onset: 'ㅍ', rules: ['aspirate'] };
        if (n === 'ㄷ') {
            if (tail === 'ㅈ' || tail === 'ㅊ') return { coda: keep, onset: 'ㅊ', rules: ['aspirate'] };
            if ((tail === 'ㄷ' || tail === 'ㅌ') && nextVowel === 'ㅣ') return { coda: keep, onset: 'ㅊ', rules: ['palatal'] };
            return { coda: keep, onset: 'ㅌ', rules: ['aspirate'] };
        }
        // ㄴ ㄹ ㅁ ㅇ + ㅎ: standard speech keeps both sounds.
        return { coda: NEUTRAL[coda], onset, rules: NEUTRAL[coda] !== coda ? ['final'] : [] };
    }

    // Next syllable starts with a vowel sound.
    if (onset === 'ㅇ') {
        if (coda === 'ㅇ') return { coda, onset, rules: [] };
        if (nextVowel === 'ㅣ' && (coda === 'ㄷ' || coda === 'ㅌ' || coda === 'ㄾ')) {
            const moved = coda === 'ㄷ' ? 'ㅈ' : 'ㅊ';
            return { coda: coda === 'ㄾ' ? 'ㄹ' : '', onset: moved, rules: ['palatal'] };
        }
        if (second) {
            const moved = second === 'ㅅ' && (first === 'ㄱ' || first === 'ㅂ') ? 'ㅆ' : second;
            return { coda: first, onset: moved, rules: ['linking'] };
        }
        return { coda: '', onset: coda, rules: ['linking'] };
    }

    // Any other consonant: the final takes one of its seven sounds first.
    let n = NEUTRAL[coda];
    if (coda === 'ㄺ' && onset === 'ㄱ') n = 'ㄹ'; // 읽고 [일꼬]
    let next = onset;
    const rules = [];

    if (onset === 'ㄴ' || onset === 'ㅁ') {
        if (NASAL[n]) { n = NASAL[n]; rules.push('nasal'); }
        else if (n === 'ㄹ' && onset === 'ㄴ') { next = 'ㄹ'; rules.push('liquid'); }
    } else if (onset === 'ㄹ') {
        if (n === 'ㄴ') { n = 'ㄹ'; rules.push('liquid'); }
        else if (n === 'ㅁ' || n === 'ㅇ') { next = 'ㄴ'; rules.push('nasalR'); }
        else if (NASAL[n]) { n = NASAL[n]; next = 'ㄴ'; rules.push('nasalR'); }
    } else if (TENSE[onset]) {
        if (TENSING_FINALS.has(coda)) {
            next = TENSE[onset];
            rules.push('tense');
        } else if (ctx.tense) {
            next = TENSE[onset];
            rules.push(ctx.tense);
        }
    }

    if (!rules.length && n !== coda) rules.push('final');
    return { coda: n, onset: next, rules };
};

const verbLike = (type = '') => /verb|adjective|형용사|동사/i.test(type);

// Finds boundaries where the word's grammar (not its spelling) makes a sound
// tense: stems ending in ㄴ/ㅁ, the -(으)ㄹ ending, and Sino-Korean ㄹ + ㄷㅅㅈ.
// Returns a map from the index of the syllable before the boundary to a rule.
const grammarTensing = (sylls, components = []) => {
    const marks = new Map();
    const flat = sylls.map(s => s.ch).join('');
    let cursor = 0;

    for (const comp of components) {
        const text = (comp?.text || '').replace(/[^가-힣]/g, '');
        if (!text) continue;
        const at = flat.indexOf(text, cursor);
        if (at === -1) continue;
        cursor = at + text.length;

        const dict = (comp.dictionary_form || '').replace(/[^가-힣]/g, '');
        if (verbLike(comp.type) && dict.endsWith('다') && dict.length > 1) {
            const stem = dict.slice(0, -1);
            // Stem ending in ㄴ or ㅁ, spelled unchanged in this word
            if (text.startsWith(stem)) {
                const last = decompose(stem[stem.length - 1]).jong;
                if (['ㄴ','ㄵ','ㅁ','ㄻ'].includes(last)) marks.set(at + stem.length - 1, 'tenseStem');
            }
            // A final ㄹ that the stem doesn't have comes from the -(으)ㄹ ending
            for (let i = 0; i < text.length; i++) {
                if (decompose(text[i]).jong !== 'ㄹ') continue;
                const fromStem = i < stem.length && text[i] === stem[i];
                if (!fromStem && i >= stem.length - 1) marks.set(at + i, 'tenseFuture');
            }
        }

        for (const word of SINO_TENSE_WORDS) {
            const k = text.indexOf(word);
            if (k === -1) continue;
            for (let i = 0; i < word.length - 1; i++) {
                const coda = decompose(word[i]).jong;
                const onset = decompose(word[i + 1]).cho;
                if (coda === 'ㄹ' && ['ㄷ','ㅅ','ㅈ'].includes(onset)) marks.set(at + k + i, 'tenseSino');
            }
        }
    }
    return marks;
};

// Main entry. `text` is the sentence, `components` the analysis components
// (optional; they add the grammar-based tensing rules).
export const pronounce = (text = '', components = []) => {
    const chars = Array.from(text);
    const sylls = [];
    chars.forEach((ch, i) => {
        if (isSyllable(ch)) sylls.push({ ch, at: i, ...decompose(ch) });
    });
    const marks = grammarTensing(sylls, components);

    const out = sylls.map(s => ({ ...s }));
    const changes = [];

    for (let k = 0; k < sylls.length - 1; k++) {
        const a = sylls[k];
        const b = sylls[k + 1];
        const between = chars.slice(a.at + 1, b.at).join('');
        const sameWord = between === '';
        const acrossSpace = /^\s+$/.test(between);
        const ctxRule = marks.get(k);
        if (!sameWord && !(acrossSpace && ctxRule === 'tenseFuture')) continue;

        const { coda, onset, rules } = sameWord
            ? resolveBoundary(out[k].jong, out[k + 1].cho, out[k + 1].jung, { tense: ctxRule })
            : (TENSE[out[k + 1].cho] && out[k].jong === 'ㄹ'
                ? { coda: 'ㄹ', onset: TENSE[out[k + 1].cho], rules: ['tenseFuture'] }
                : { coda: out[k].jong, onset: out[k + 1].cho, rules: [] });

        const changed = coda !== out[k].jong || onset !== out[k + 1].cho;
        out[k].jong = coda;
        out[k + 1].cho = onset;
        if (changed && rules.length) changes.push({ rule: rules[0], syllables: [k, k + 1] });
    }

    // Word-final syllables still need their final reduced to one of 7 sounds.
    sylls.forEach((s, k) => {
        const next = sylls[k + 1];
        const endsWord = !next || chars.slice(s.at + 1, next.at).join('') !== '';
        if (!endsWord || !out[k].jong) return;
        const n = NEUTRAL[out[k].jong];
        if (n !== out[k].jong) {
            out[k].jong = n;
            if (!changes.some(c => c.syllables.includes(k))) changes.push({ rule: 'final', syllables: [k] });
        }
    });

    const spokenChars = chars.slice();
    out.forEach(s => { spokenChars[s.at] = compose(s); });

    const changeOf = new Map();
    changes.forEach((c, i) => c.syllables.forEach(k => { if (!changeOf.has(k)) changeOf.set(k, i); }));

    // Per-character view for rendering: each Hangul character knows its
    // spoken form and which change touched it.
    const units = chars.map((ch, i) => ({ written: ch, spoken: spokenChars[i], change: null }));
    sylls.forEach((s, k) => { if (changeOf.has(k)) units[s.at].change = changeOf.get(k); });

    // A readable label per change: the written and spoken word it happens in.
    const wordAround = (k, source) => {
        let start = sylls[k].at;
        let end = sylls[k].at;
        while (start > 0 && !/\s/.test(chars[start - 1])) start--;
        while (end < chars.length - 1 && !/\s/.test(chars[end + 1])) end++;
        return source.slice(start, end + 1).join('').replace(/[^가-힣\s]/g, '');
    };
    changes.forEach(c => {
        const [k1, k2] = c.syllables;
        const crosses = k2 !== undefined && chars.slice(sylls[k1].at + 1, sylls[k2].at).join('') !== '';
        c.written = crosses ? `${wordAround(k1, chars)} ${wordAround(k2, chars)}` : wordAround(k1, chars);
        c.spoken = crosses ? `${wordAround(k1, spokenChars)} ${wordAround(k2, spokenChars)}` : wordAround(k1, spokenChars);
    });

    return {
        written: text,
        spoken: spokenChars.join(''),
        units,
        changes,
    };
};
