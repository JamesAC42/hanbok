// Korean phrase pages ("what does 대박 mean"). Each entry in phrases.json is
// one page at /phrases/<slug>; the JSON shape is documented in README.md here.
import data from './phrases.json';

export const CATEGORIES = [
    { key: 'reaction', title: 'Reactions', dek: 'What people blurt out when something happens.' },
    { key: 'people', title: 'Calling people', dek: 'Oppa, unnie, sunbae: who calls whom what.' },
    { key: 'love', title: 'Love and friendship', dek: 'From a crush to saying I love you.' },
    { key: 'everyday', title: 'Everyday phrases', dek: 'Hello, thanks, sorry and the other words you hear every day.' },
    { key: 'slang', title: 'Slang', dek: 'Casual words friends use with each other.' },
    { key: 'internet', title: 'Internet and texting', dek: 'Words born online and in group chats.' },
];

// Example chips arrive as [[{ t, g, p?, base? }]]; <Example> wants [{ parts: [{ t, g, particle?, base? }] }].
const toWords = (chips) => chips.map((word) => ({
    parts: word.map(({ t, g, p, base }) => ({ t, g, ...(p && { particle: true }), ...(base && { base }) })),
}));

export const phrases = data.map((entry) => ({
    ...entry,
    examples: entry.examples.map((ex) => ({ ...ex, words: toWords(ex.chips) })),
}));

const bySlug = new Map(phrases.map((p) => [p.slug, p]));
const byKo = new Map(phrases.map((p) => [p.ko, p]));

export const getPhrase = (slug) => bySlug.get(slug) || null;

// The phrase page for a Korean word, if there is one (used to link song study notes and articles).
export const phraseForWord = (ko) => byKo.get(ko) || null;

export const phraseHref = (phrase) => `/phrases/${phrase.slug}`;
