// Logs what people do around Speak to our own server (for the admin Speak tab)
// and to Umami. Never throws and never blocks the page.
import { track } from '@/lib/analytics';

const VISITOR_KEY = 'speakVisitor';

const visitorId = () => {
    try {
        let id = localStorage.getItem(VISITOR_KEY);
        if (!id) {
            id = `v-${Math.random().toString(36).slice(2, 12)}${Date.now().toString(36)}`;
            localStorage.setItem(VISITOR_KEY, id);
        }
        return id;
    } catch {
        return undefined;
    }
};

export const speakEvent = (type, meta = {}, sessionId = null) => {
    if (typeof window === 'undefined') return;
    track(`speak_${type}`, { ...meta, ...(sessionId ? { session: sessionId } : {}) });
    try {
        fetch('/api/speak/event', {
            method: 'POST',
            credentials: 'include',
            keepalive: true,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, meta, sessionId: sessionId || undefined, visitorId: visitorId() }),
        }).catch(() => {});
    } catch { /* never break the page */ }
};
