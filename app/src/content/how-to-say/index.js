// "How to say X in Korean" pages. Each entry in entries.json is one page at
// /how-to-say/<slug>; the JSON shape is documented in README.md here.
import data from './entries.json';
import { getPhrase } from '@/content/phrases';

export const CATEGORIES = [
    { key: 'greetings', title: 'Hello and goodbye', dek: 'Greetings for every time of day and every kind of person.' },
    { key: 'polite', title: 'Polite basics', dek: 'Thank you, sorry, excuse me and the other words you need on day one.' },
    { key: 'feelings', title: 'Feelings', dek: 'Say how you feel: happy, tired, hungry, missing someone.' },
    { key: 'love', title: 'Love and compliments', dek: 'From "I like you" to "I love you", and how to tell someone they look great.' },
    { key: 'celebrate', title: 'Wishes and celebrations', dek: 'Birthdays, holidays, toasts and good luck.' },
    { key: 'people', title: 'Family and people', dek: 'Mom, dad, friends and the words for brothers and sisters.' },
    { key: 'reactions', title: 'Reactions', dek: 'Oh my god, really, no way: what to say when something happens.' },
    { key: 'travel', title: 'Eating out and getting around', dek: 'Ordering food, paying and finding the bathroom.' },
];

// Example chips arrive as [[{ t, g, p?, base? }]]; <Example> wants [{ parts: [{ t, g, particle?, base? }] }].
const toWords = (chips) => chips.map((word) => ({
    parts: word.map(({ t, g, p, base }) => ({ t, g, ...(p && { particle: true }), ...(base && { base }) })),
}));

export const sayings = data.map((entry) => ({
    ...entry,
    examples: entry.examples.map((ex) => ({ ...ex, words: toWords(ex.chips) })),
    ways: entry.ways.map((w) => ({ ...w, phrase: (w.phrase && getPhrase(w.phrase)) || null })),
}));

const bySlug = new Map(sayings.map((s) => [s.slug, s]));

export const getSaying = (slug) => bySlug.get(slug) || null;

export const sayingHref = (saying) => `/how-to-say/${saying.slug}`;
