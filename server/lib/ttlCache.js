// Small in-memory cache for expensive admin queries. Fresh values are reused
// for ttlMs. Older values (up to staleMs) are still returned at once while a
// refresh runs in the background, so a repeat visit never waits on the
// database. Concurrent callers share one in-flight computation, and failures
// are never cached.
const createTtlCache = (ttlMs, { staleMs = ttlMs * 12, maxEntries = 50 } = {}) => {
    const entries = new Map();

    const refresh = (key, compute) => {
        const current = entries.get(key);
        if (current?.pending) return current.pending;
        const pending = Promise.resolve().then(compute).then((value) => {
            entries.set(key, { value, at: Date.now(), pending: null });
            if (entries.size > maxEntries) entries.delete(entries.keys().next().value);
            return { value, cachedAt: Date.now() };
        }).catch((error) => {
            const entry = entries.get(key);
            if (entry) entry.pending = null;
            if (entry && !('value' in entry)) entries.delete(key);
            throw error;
        });
        entries.set(key, { ...(current || {}), pending });
        return pending;
    };

    const get = async (key, compute, { fresh = false } = {}) => {
        const hit = entries.get(key);
        const age = hit && 'value' in hit ? Date.now() - hit.at : Infinity;

        if (fresh || age >= staleMs) return refresh(key, compute);
        if (age >= ttlMs) refresh(key, compute).catch(() => {});
        return { value: hit.value, cachedAt: hit.at };
    };

    return { get, clear: () => entries.clear() };
};

module.exports = { createTtlCache };
