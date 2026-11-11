// Simple / Standard / Detailed grammar explanations. The choice is remembered
// in this browser; Simple and Detailed come from /api/analysis/grammar-depth.
import { useEffect, useState } from 'react';

export const DEPTHS = [
    { id: 'simple', label: 'Simple' },
    { id: 'standard', label: 'Standard' },
    { id: 'detailed', label: 'Detailed' },
];
const STORAGE_KEY = 'grammarDepth';
const cache = new Map();

export const normalizeDepth = (d) => (DEPTHS.some(x => x.id === d) ? d : 'standard');

export const readDepth = () => {
    try { return normalizeDepth(localStorage.getItem(STORAGE_KEY)); } catch { return 'standard'; }
};

export const saveDepth = (d) => {
    try { localStorage.setItem(STORAGE_KEY, normalizeDepth(d)); } catch {}
};

export const fetchGrammarDepth = (sentenceKey, depth, fetchImpl = fetch) => {
    const key = `${sentenceKey}:${depth}`;
    if (!cache.has(key)) {
        const url = `/api/analysis/grammar-depth?sentence=${encodeURIComponent(sentenceKey)}&depth=${depth}`;
        const p = fetchImpl(url, { credentials: 'include' })
            .then(res => res.json().catch(() => ({})).then(data => {
                if (!res.ok || !data.success || !Array.isArray(data.explanations)) throw new Error(data.error || 'Failed to load');
                return data.explanations;
            }))
            .catch(err => { cache.delete(key); throw err; });
        cache.set(key, p);
    }
    return cache.get(key);
};

export const clearGrammarDepth = () => cache.clear();

// The explanation to show for each point: the rewrite when it is ready and
// lines up with the points, otherwise the analysis as written.
export const explanationsAt = (points, rewrite) => points.map((p, i) =>
    (Array.isArray(rewrite) && rewrite.length === points.length && rewrite[i]) || p.explanation);

// { depth, setDepth, explanations, loading, failed, available }
export const useGrammarDepth = (sentenceKey, points) => {
    const available = !!sentenceKey && points.length > 0;
    const [depth, setDepthState] = useState('standard');
    const [state, setState] = useState({ rewrite: null, loading: false, failed: false });

    useEffect(() => { setDepthState(readDepth()); }, []);

    useEffect(() => {
        setState({ rewrite: null, loading: false, failed: false });
        if (!available || depth === 'standard') return;
        let live = true;
        setState({ rewrite: null, loading: true, failed: false });
        fetchGrammarDepth(sentenceKey, depth)
            .then(rewrite => { if (live) setState({ rewrite, loading: false, failed: false }); })
            .catch(() => { if (live) setState({ rewrite: null, loading: false, failed: true }); });
        return () => { live = false; };
    }, [sentenceKey, depth, available]);

    const setDepth = (d) => { const next = normalizeDepth(d); saveDepth(next); setDepthState(next); };

    return {
        depth: available ? depth : 'standard',
        setDepth,
        available,
        loading: state.loading,
        failed: state.failed,
        explanations: explanationsAt(points, state.rewrite),
    };
};
