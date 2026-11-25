// Japanese word pages ("senpai meaning"). Each entry in phrases.json is one page
// at /japanese/phrases/<slug>; the JSON shape is documented in README.md here.
import data from './phrases.json';

export const CATEGORIES = [
    { key: 'everyday', title: 'Everyday phrases', dek: 'Hello, thank you, sorry, I\'m home: the words you hear every day in Japan.' },
    { key: 'reaction', title: 'Reactions', dek: 'Nani, sugoi, yabai, uso: what people blurt out when something happens.' },
    { key: 'people', title: 'Honorifics and calling people', dek: 'Senpai, -chan, -kun, onii-chan: who calls whom what.' },
    { key: 'love', title: 'Love and feelings', dek: 'Suki, daisuki, aishiteru and the words for what you feel.' },
    { key: 'anime', title: 'Anime words', dek: 'Tsundere, otaku, kisama: words you hear constantly in anime and what they really mean.' },
    { key: 'food', title: 'Food and drinking', dek: 'Itadakimasu, oishii, kanpai: the words around a Japanese table.' },
];

// Example chips arrive as [[{ t, g, p?, base?, r? }]]; <Example> wants [{ parts: [{ t, g, particle?, base?, r? }] }].
const toWords = (chips) => chips.map((word) => ({
    parts: word.map(({ t, g, p, base, r }) => ({ t, g, ...(p && { particle: true }), ...(base && { base }), ...(r && { r }) })),
}));

export const jaPhrases = data.map((entry) => ({
    ...entry,
    examples: entry.examples.map((ex) => ({ ...ex, words: toWords(ex.chips) })),
}));

const bySlug = new Map(jaPhrases.map((p) => [p.slug, p]));

export const getJaPhrase = (slug) => bySlug.get(slug) || null;

export const jaPhraseHref = (phrase) => `/japanese/phrases/${phrase.slug}`;
