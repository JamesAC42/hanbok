'use client';
import { useCallback, useEffect, useRef, useState } from 'react';

// Fetches one admin endpoint. Keeps the last result on screen while a new one
// loads, so switching ranges never blanks the page.
export default function useAdminData(url, { enabled = true, onForbidden } = {}) {
    const [state, setState] = useState({ data: null, loading: enabled, error: null });
    const requestId = useRef(0);
    const forbidden = useRef(onForbidden);
    forbidden.current = onForbidden;

    const load = useCallback(async (fresh = false) => {
        if (!url) return;
        const id = ++requestId.current;
        setState((prev) => ({ ...prev, loading: true, error: null }));
        try {
            const response = await fetch(fresh ? `${url}${url.includes('?') ? '&' : '?'}fresh=1` : url);
            if (response.status === 401 || response.status === 403) {
                forbidden.current?.();
                return;
            }
            const data = await response.json();
            if (!response.ok || !data.success) throw new Error(data.error || 'Could not load this section');
            if (id === requestId.current) setState({ data, loading: false, error: null });
        } catch (error) {
            if (id === requestId.current) setState((prev) => ({ ...prev, loading: false, error: error.message }));
        }
    }, [url]);

    useEffect(() => {
        if (enabled) load();
    }, [enabled, load]);

    return { ...state, reload: load };
}
