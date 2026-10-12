// One place for Redis connection settings. REDIS_URL (redis:// or rediss://
// for a managed, TLS-only Redis/Valkey) wins; otherwise localhost:6379 with
// REDIS_PW, as before.

const reconnectStrategy = (retries) => {
    if (retries > 10) {
        console.error('Redis connection failed after multiple retries');
        return false;
    }
    return Math.min(retries * 100, 3000);
};

// Options for node-redis createClient().
const redisClientOptions = (env = process.env) => ({
    ...(env.REDIS_URL ? { url: env.REDIS_URL } : {}),
    ...(env.REDIS_PW ? { password: env.REDIS_PW } : {}),
    socket: { reconnectStrategy },
});

// Options for Bull (ioredis). Bull's own URL parsing drops TLS, so a
// rediss:// URL is turned into options here.
const bullRedis = (env = process.env) => {
    if (!env.REDIS_URL) return { password: env.REDIS_PW || undefined };
    const u = new URL(env.REDIS_URL);
    return {
        host: u.hostname,
        port: Number(u.port || 6379),
        ...(u.username ? { username: decodeURIComponent(u.username) } : {}),
        password: env.REDIS_PW || (u.password ? decodeURIComponent(u.password) : undefined),
        ...(u.pathname.length > 1 ? { db: Number(u.pathname.slice(1)) } : {}),
        ...(u.protocol === 'rediss:' ? { tls: {} } : {}),
    };
};

module.exports = { redisClientOptions, bullRedis };
