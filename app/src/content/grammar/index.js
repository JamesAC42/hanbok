// Korean grammar pattern pages ("-잖아 meaning"). Each entry in patterns.json is
// one page at /grammar/<slug>; the JSON shape is documented in README.md here.
import data from './patterns.json';
import { getArticle } from '@/content/learn';
import { normalizeForm } from '@/lib/grammarForms';

export const CATEGORIES = [
    { key: 'endings', title: 'Sentence endings', dek: 'The endings that give a sentence its mood: you know, I noticed, shall we, let\'s.' },
    { key: 'linking', title: 'Linking ideas', dek: 'Because, before, while, even if: join two ideas into one sentence.' },
    { key: 'expressing', title: 'Saying what you think and feel', dek: 'I think, it seems, almost, I wish, have ever done.' },
    { key: 'helpers', title: 'Helper verbs', dek: 'Small verbs added after another verb: do for someone, finish off, keep doing.' },
    { key: 'quoting', title: 'Quoting and reporting', dek: 'Pass on what someone said, asked, suggested or told you to do.' },
    { key: 'particles', title: 'Particles', dek: 'Also, only, than, like, to and from: the little words after a noun.' },
    { key: 'words', title: 'Word endings and look-alikes', dek: 'Endings that build new words, and forms that are easy to mix up.' },
];

export const LEVELS = ['Beginner', 'Intermediate', 'Advanced'];

// Example chips arrive as [[{ t, g, p?, base? }]]; <Example> wants [{ parts: [{ t, g, particle?, base? }] }].
const toWords = (chips) => chips.map((word) => ({
    parts: word.map(({ t, g, p, base }) => ({ t, g, ...(p && { particle: true }), ...(base && { base }) })),
}));

export const patterns = data.map((entry) => ({
    ...entry,
    examples: entry.examples.map((ex) => ({ ...ex, words: toWords(ex.chips) })),
    guide: (entry.guide && getArticle(entry.guide)) || null,
}));

const bySlug = new Map(patterns.map((p) => [p.slug, p]));

export const getPattern = (slug) => bySlug.get(slug) || null;

export const patternHref = (pattern) => `/grammar/${pattern.slug}`;

// An ending written as a slash pair ("-아/어 주다", "-ㄴ/는다") splits into a
// one-letter half ("-아") that would match far too much, so such forms only
// ever match whole.
const splitsBadly = (form) => /^\s*-/.test(form) && form.includes('/')
    && normalizeForm(form).split('/').some((part) => part.length <= 1);

// Forms the saved-grammar links (grammar-guides.json) may use for a pattern.
// Those links also match on slash halves, so leave out forms that split badly.
export const matchForms = (p) => [p.form, ...(p.match || [])].filter((form) => !splitsBadly(form));

// The page for a grammar form as an analysis names it ("-잖아요", "-는 것 같다").
const byForm = new Map();
for (const p of patterns) {
    for (const form of [p.form, ...(p.match || [])]) {
        const key = normalizeForm(form);
        const keys = splitsBadly(form) || /\s/.test(form) ? [key] : [key, ...key.split('/')];
        for (const k of keys) {
            if (k && !byForm.has(k)) byForm.set(k, p);
        }
    }
}

export const patternForForm = (form) => byForm.get(normalizeForm(form)) || null;
