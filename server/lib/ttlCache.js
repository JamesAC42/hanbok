// Small in-memory cache for expensive admin queries. Concurrent callers for the
// same key share one in-flight promise, and failures are never cached.
const createTtlCache = (ttlMs, maxEntries = 50) => {
    const entries = new Map();

    const get = async (key, compute, { fresh = false } = {}) => {
        const hit = entries.get(key);
        const now = Date.now();
        if (!fresh && hit && (hit.pending || now - hit.at < ttlMs)) {
            const value = await hit.promise;
            return { value, cachedAt: hit.at };
        }

        const promise = Promise.resolve().then(compute);
        const entry = { promise, at: now, pending: true };
        entries.set(key, entry);
        if (entries.size > maxEntries) {
            entries.delete(entries.keys().next().value);
        }

        try {
            const value = await promise;
            entry.pending = false;
            entry.at = Date.now();
            return { value, cachedAt: entry.at };
        } catch (error) {
            if (entries.get(key) === entry) entries.delete(key);
            throw error;
        }
    };

    return { get, clear: () => entries.clear() };
};

module.exports = { createTtlCache };
