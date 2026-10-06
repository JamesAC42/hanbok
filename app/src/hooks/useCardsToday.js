'use client';
import { useEffect, useState } from 'react';

// Cards the user can study today across all decks (new + learning + due).
// Cached briefly so the sidebar badge doesn't refetch on every page.
const CACHE_MS = 60 * 1000;
let cache = { at: 0, count: null, pending: null };

const fetchCardsToday = () => {
    if (cache.pending) return cache.pending;
    cache.pending = fetch('/api/decks')
        .then(res => (res.ok ? res.json() : null))
        .then(data => {
            if (!data?.decks) return null;
            const total = data.decks.reduce((sum, deck) => {
                const stats = deck.stats || {};
                return sum + (stats.new || 0) + (stats.learning || 0) + (stats.due || 0);
            }, 0);
            cache = { at: Date.now(), count: total, pending: null };
            return total;
        })
        .catch(() => {
            cache.pending = null;
            return null;
        });
    return cache.pending;
};

export const invalidateCardsToday = () => {
    cache = { at: 0, count: null, pending: null };
};

const useCardsToday = (enabled, refreshKey) => {
    const fresh = Date.now() - cache.at < CACHE_MS;
    const [count, setCount] = useState(enabled && fresh ? cache.count : null);

    useEffect(() => {
        if (!enabled) {
            setCount(null);
            return;
        }
        let cancelled = false;
        if (Date.now() - cache.at < CACHE_MS && refreshKey === undefined) {
            setCount(cache.count);
            return;
        }
        if (refreshKey !== undefined) invalidateCardsToday();
        fetchCardsToday().then(total => {
            if (!cancelled && total !== null) setCount(total);
        });
        return () => { cancelled = true; };
    }, [enabled, refreshKey]);

    return count;
};

export default useCardsToday;
