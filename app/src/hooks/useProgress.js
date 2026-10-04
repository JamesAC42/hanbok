'use client';
import { useEffect, useState } from 'react';

// Activity over time for the signed-in user (see server getProgress).
const useProgress = (enabled, days = 84) => {
    const [progress, setProgress] = useState(null);
    const [loading, setLoading] = useState(enabled);

    useEffect(() => {
        if (!enabled) {
            setLoading(false);
            return;
        }
        let cancelled = false;
        const tz = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
        setLoading(true);
        fetch(`/api/progress?days=${days}&tz=${encodeURIComponent(tz)}`)
            .then(res => (res.ok ? res.json() : null))
            .then(data => {
                if (!cancelled && data?.success) setProgress(data);
            })
            .catch(() => {})
            .finally(() => {
                if (!cancelled) setLoading(false);
            });
        return () => { cancelled = true; };
    }, [enabled, days]);

    return { progress, loading };
};

export default useProgress;
