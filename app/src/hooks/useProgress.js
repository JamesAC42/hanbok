'use client';
import { useEffect, useState } from 'react';

// Shared across components (the top bar and Home both read it) so a page
// load asks the server once. Entries go stale after a minute.
const cache = new Map();
const FRESH_MS = 60 * 1000;

// Activity over time for the signed-in user (see server getProgress).
const useProgress = (enabled, days = 84) => {
    const cached = enabled ? cache.get(days) : null;
    const [progress, setProgress] = useState(cached?.data || null);
    const [loading, setLoading] = useState(enabled && !cached);

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            return;
        }
        const hit = cache.get(days);
        if (hit && Date.now() - hit.at < FRESH_MS) {
            setProgress(hit.data);
            setLoading(false);
            return;
        }
        let cancelled = false;
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        setLoading(!hit);
        const request = hit?.pending || fetch(`/api/progress?days=${days}&tz=${encodeURIComponent(tz)}`)
            .then(res => (res.ok ? res.json() : null))
            .then(data => {
                if (data?.success) cache.set(days, { at: Date.now(), data });
                else cache.delete(days);
                return data?.success ? data : null;
            })
            .catch(() => {
                cache.delete(days);
                return null;
            });
        if (!hit?.pending) cache.set(days, { ...(hit || {}), at: hit?.at || 0, pending: request });
        request.then(data => {
            if (cancelled) return;
            if (data) setProgress(data);
            setLoading(false);
        });
        return () => { cancelled = true; };
    }, [enabled, days]);

    return { progress, loading };
};

export default useProgress;
