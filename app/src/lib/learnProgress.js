// Learn progress lives in the browser so it works signed in or out: the level a
// visitor picked on /learn, and the guides they have read to the end.
const LEVEL_KEY = 'hanbok.learn.level';
const READ_KEY = 'hanbok.learn.read';

// Where each starting point begins in the reading order (see content/learn).
export const START_POINTS = [
    { key: 'new', label: 'Brand new', hint: 'Start from the very first sentence.', from: 'korean-sentence-structure' },
    { key: 'beginner', label: 'I know the basics', hint: 'I can make simple present-tense sentences.', from: 'korean-past-tense' },
    { key: 'intermediate', label: 'Intermediate', hint: 'I know the tenses and want to sound natural.', from: 'korean-neunde' },
];

const safeGet = (key) => {
    try { return window.localStorage.getItem(key); } catch { return null; }
};
const safeSet = (key, value) => {
    try { window.localStorage.setItem(key, value); } catch { /* private mode */ }
};

export const getStartPoint = () => {
    const v = safeGet(LEVEL_KEY);
    return START_POINTS.some((p) => p.key === v) ? v : null;
};
export const setStartPoint = (key) => safeSet(LEVEL_KEY, key);

export const getRead = () => {
    try {
        const list = JSON.parse(safeGet(READ_KEY) || '[]');
        return Array.isArray(list) ? list.filter((s) => typeof s === 'string') : [];
    } catch {
        return [];
    }
};
export const markRead = (slug) => {
    const list = getRead();
    if (!list.includes(slug)) safeSet(READ_KEY, JSON.stringify([...list, slug]));
};
export const setRead = (list) => safeSet(READ_KEY, JSON.stringify(list));

// The next few unread guides for a starting point, in reading order. `items` is
// the hub's ordered list of { slug, level, topic }.
export const pickNext = (items, start, read, count = 3) => {
    const readSet = new Set(read);
    const point = START_POINTS.find((p) => p.key === start);
    const from = Math.max(0, items.findIndex((i) => i.slug === point?.from));
    const ordered = [...items.slice(from), ...items.slice(0, from)];
    return ordered.filter((i) => !readSet.has(i.slug)).slice(0, count);
};
