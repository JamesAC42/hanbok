// Hands a just-finished analysis from the analyze form to /sentence/<id>, so the
// result page can draw it straight away instead of fetching it again (and
// showing an empty form while it waits). Module state survives client-side
// navigation; a full page load starts empty and falls back to the fetch.
const pending = new Map();
const MAX_AGE_MS = 5 * 60 * 1000;

export const rememberSentence = (sentence) => {
    const keys = [sentence?.publicId, sentence?.sentenceId].filter((k) => k !== null && k !== undefined);
    if (!sentence?.analysis || keys.length === 0) return;
    const entry = { ...sentence, savedAt: Date.now() };
    for (const key of keys) pending.set(String(key), entry);
};

export const takeSentence = (key) => {
    if (key === null || key === undefined) return null;
    const entry = pending.get(String(key));
    if (!entry) return null;
    if (Date.now() - entry.savedAt > MAX_AGE_MS) {
        pending.delete(String(key));
        return null;
    }
    return entry;
};
