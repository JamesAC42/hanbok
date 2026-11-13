// The "analysis done" chime. It plays when the breakdown is actually on screen
// (the result page calls it when it mounts with a handed-over analysis), not
// when the response arrives: navigating there can take a moment, and a chime
// over a still-spinning form made it look like something had stalled.
const finishedSound = typeof Audio !== 'undefined' ? new Audio('/sound_effects/finished_one.mp3') : null;

const chimed = new Set();

// `key` (the sentence id) keeps Back/Forward to the same result from chiming again.
export const playFinishedSound = (key) => {
    if (key != null) {
        if (chimed.has(String(key))) return;
        chimed.add(String(key));
    }
    try {
        if (localStorage.getItem('playSoundEffects') === 'false' || !finishedSound) return;
        finishedSound.currentTime = 0;
        finishedSound.volume = 0.02;
        finishedSound.play().catch(() => {});
    } catch {
        // Storage or audio blocked: no chime.
    }
};
