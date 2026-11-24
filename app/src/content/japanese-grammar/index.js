// Japanese grammar pages ("てしまう grammar"). Each entry in patterns.json is one
// page at /japanese/grammar/<slug>; the JSON shape is documented in README.md here.
import data from './patterns.json';

export const CATEGORIES = [
    { key: 'particles', title: 'Particles', dek: 'は, が, を, に, で and the other small words that mark what each word is doing.' },
    { key: 'forms', title: 'Verb forms', dek: 'Te-form, past, negative, potential, passive and causative: how to build them and what they do.' },
    { key: 'helpers', title: 'Te-form helpers', dek: 'ている, てしまう, てみる, てあげる: verbs added after the te-form to change the meaning.' },
    { key: 'linking', title: 'Linking ideas', dek: 'Because, but, while, if, before and after: join two ideas into one sentence.' },
    { key: 'expressing', title: 'Saying what you want, think and must do', dek: 'Want to, I think, maybe, must, may, have done before.' },
    { key: 'endings', title: 'Sentence endings', dek: 'よ, ね, かな, じゃん, んです: the endings that give a sentence its tone.' },
];

export const LEVELS = ['N5', 'N4', 'N3'];

// Example chips arrive as [[{ t, g, p?, base?, r? }]]; <Example> wants [{ parts: [{ t, g, particle?, base?, r? }] }].
const toWords = (chips) => chips.map((word) => ({
    parts: word.map(({ t, g, p, base, r }) => ({ t, g, ...(p && { particle: true }), ...(base && { base }), ...(r && { r }) })),
}));

export const jaPatterns = data.map((entry) => ({
    ...entry,
    examples: entry.examples.map((ex) => ({ ...ex, words: toWords(ex.chips) })),
}));

const bySlug = new Map(jaPatterns.map((p) => [p.slug, p]));

export const getJaPattern = (slug) => bySlug.get(slug) || null;

export const jaPatternHref = (pattern) => `/japanese/grammar/${pattern.slug}`;

// The sentence an example spells out (Japanese has no spaces between words).
export const exampleText = (ex) => ex.chips.map((word) => word.map((part) => part.t).join('')).join('');
