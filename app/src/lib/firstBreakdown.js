// The sentence a visitor was just looking at (the prefilled line on a phrase or
// how-to-say page), so the welcome sheet after sign-up can break that one down
// instead of a generic example. Session only.
const CONTEXT_KEY = 'hanbok_context_sentence';
const NEW_SIGNUP_KEY = 'hanbok_new_signup';

export const rememberContextSentence = (text, lang, source) => {
    if (!text) return;
    try { sessionStorage.setItem(CONTEXT_KEY, JSON.stringify({ text: text.slice(0, 300), lang, source })); } catch {}
};

export const readContextSentence = () => {
    try {
        const raw = sessionStorage.getItem(CONTEXT_KEY);
        const ctx = raw ? JSON.parse(raw) : null;
        return ctx?.text ? ctx : null;
    } catch {
        return null;
    }
};

// Set by AuthContext the moment a brand-new account signs in.
export const markNewSignup = () => {
    try { sessionStorage.setItem(NEW_SIGNUP_KEY, String(Date.now())); } catch {}
};

// True once, right after sign-up (within 10 minutes), then forgotten.
export const takeNewSignup = () => {
    try {
        const at = Number(sessionStorage.getItem(NEW_SIGNUP_KEY));
        sessionStorage.removeItem(NEW_SIGNUP_KEY);
        return at > 0 && Date.now() - at < 10 * 60 * 1000;
    } catch {
        return false;
    }
};
