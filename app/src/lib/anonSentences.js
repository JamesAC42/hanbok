// Sentences analyzed while signed out, remembered in this browser so they can
// join the account's history once the visitor signs in (POST /api/user/history/claim).
const KEY = 'hanbok_anon_sentences';
const MAX = 20;

const read = () => {
    try {
        const ids = JSON.parse(localStorage.getItem(KEY) || '[]');
        return Array.isArray(ids) ? ids.filter(id => typeof id === 'string') : [];
    } catch {
        return [];
    }
};

export const rememberAnonSentence = (publicId) => {
    if (!publicId) return;
    try {
        const ids = [publicId, ...read().filter(id => id !== publicId)].slice(0, MAX);
        localStorage.setItem(KEY, JSON.stringify(ids));
    } catch {}
};

export const claimAnonSentences = async () => {
    const publicIds = read();
    if (publicIds.length === 0) return 0;
    try {
        const res = await fetch('/api/user/history/claim', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ publicIds })
        });
        if (!res.ok) return 0;
        const data = await res.json();
        localStorage.removeItem(KEY);
        return data.claimed || 0;
    } catch {
        return 0;
    }
};

// Where to come back to after signing in from a signed-out page.
export const loginHref = (signup = true) => {
    if (typeof window === 'undefined') return signup ? '/login?signup' : '/login';
    const next = encodeURIComponent(window.location.pathname + window.location.search);
    return `/login?${signup ? 'signup&' : ''}next=${next}`;
};
