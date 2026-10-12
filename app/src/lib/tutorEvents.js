// Logs what people do on the Tutor page to our own server (for the admin Tutor
// tab) and to Umami. Never throws and never blocks the page.
import { track } from '@/lib/analytics';

export const tutorEvent = (type, meta = {}, conversationId = null) => {
    if (typeof window === 'undefined') return;
    track(`tutor_${type}`, { ...meta, ...(conversationId ? { conversation: conversationId } : {}) });
    try {
        fetch('/api/tutor/event', {
            method: 'POST',
            credentials: 'include',
            keepalive: true,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type, meta, conversationId: conversationId || undefined }),
        }).catch(() => {});
    } catch { /* never break the page */ }
};
