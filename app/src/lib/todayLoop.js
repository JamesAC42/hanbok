// Remembers which loop stages the learner touched today on this device, for
// the parts the server doesn't count (opening a sentence to study it).
const key = () => {
    const d = new Date();
    return `loop-${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
};

export const markStage = (stage) => {
    try {
        const done = JSON.parse(localStorage.getItem(key()) || '{}');
        if (done[stage]) return;
        done[stage] = true;
        localStorage.setItem(key(), JSON.stringify(done));
    } catch {
        // Storage can be unavailable (private mode); the path just shows less.
    }
};

export const stagesToday = () => {
    try {
        return JSON.parse(localStorage.getItem(key()) || '{}');
    } catch {
        return {};
    }
};
