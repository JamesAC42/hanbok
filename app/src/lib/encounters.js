// What this learner has already met: per-analysis word and grammar counts
// from their own history (server: /api/analysis/encounters).
import { useEffect, useState } from 'react';

const cache = new Map();

export const canFetchEncounters = (sentenceId, signedIn) => !!signedIn && /^\d+$/.test(String(sentenceId ?? ''));

export const fetchEncounters = (sentenceId, fetchImpl = fetch) => {
    const key = String(sentenceId);
    if (!cache.has(key)) {
        const p = fetchImpl(`/api/analysis/encounters?sentenceId=${encodeURIComponent(key)}`, { credentials: 'include' })
            .then(res => res.json().catch(() => ({})).then(data => {
                if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load');
                return data;
            }))
            .catch(err => { cache.delete(key); throw err; });
        cache.set(key, p);
    }
    return cache.get(key);
};

export const clearEncounters = () => cache.clear();

export const useEncounters = (sentenceId, signedIn) => {
    const [data, setData] = useState(null);
    const enabled = canFetchEncounters(sentenceId, signedIn);
    useEffect(() => {
        setData(null);
        if (!enabled) return;
        let live = true;
        fetchEncounters(sentenceId).then(d => { if (live) setData(d); }).catch(() => {});
        return () => { live = false; };
    }, [sentenceId, enabled]);
    return data;
};

const plural = (n, one, many = `${one}s`) => `${n} new ${n === 1 ? one : many}`;

// "Just right for you" + "2 new words, 1 new grammar point".
export const fitSummary = (fit) => {
    if (!fit?.verdict) return null;
    const headline = { review: 'Good review for you', just_right: 'Just right for you', stretch: 'A stretch for you' }[fit.verdict];
    const parts = [];
    if (fit.newWords?.length) parts.push(plural(fit.newWords.length, 'word'));
    if (fit.newGrammar) parts.push(plural(fit.newGrammar, 'grammar point'));
    const detail = parts.length ? parts.join(', ') : 'You have met every word and grammar point before';
    return { headline, detail, verdict: fit.verdict };
};

export const encounterLine = (g) => {
    if (!g) return null;
    if (!g.count) return 'New to you';
    return `You've met this ${g.count === 1 ? 'once' : `${g.count} times`} before`;
};
