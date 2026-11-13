// Words a signed-out visitor tapped Save on (mostly on search pages). Kept in
// this browser and added to their flashcards as soon as they sign up or sign
// in, so "Save" is a promise we keep instead of a dead end.
const KEY = 'hanbok_pending_saves';
const MAX = 20;

const read = () => {
    try {
        const list = JSON.parse(localStorage.getItem(KEY) || '[]');
        return Array.isArray(list) ? list.filter((w) => w && typeof w.ko === 'string') : [];
    } catch {
        return [];
    }
};

export const queuePendingSave = ({ ko, en, lang = 'ko' }) => {
    if (!ko) return;
    try {
        const list = [{ ko, en: en || '', lang }, ...read().filter((w) => w.ko !== ko)].slice(0, MAX);
        localStorage.setItem(KEY, JSON.stringify(list));
    } catch {}
};

export const takePendingSaves = () => {
    const list = read();
    try { localStorage.removeItem(KEY); } catch {}
    return list;
};
