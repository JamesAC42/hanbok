// How far the learner has read each passage, on this device: the number of
// sentences opened or scrolled past, never going down.
const key = (textId) => `reader-progress-${textId}`;

export const readProgress = (textId) => {
    try {
        return parseInt(localStorage.getItem(key(textId)), 10) || 0;
    } catch {
        return 0;
    }
};

export const saveProgress = (textId, count) => {
    try {
        if (count > readProgress(textId)) localStorage.setItem(key(textId), String(count));
    } catch {
        // Storage can be unavailable (private mode); progress just isn't kept.
    }
};

export const readPreference = (name, fallback) => {
    try {
        return localStorage.getItem(`reader-${name}`) || fallback;
    } catch {
        return fallback;
    }
};

export const savePreference = (name, value) => {
    try {
        localStorage.setItem(`reader-${name}`, value);
    } catch {
        // Not kept; the default is used next time.
    }
};
