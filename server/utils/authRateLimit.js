const net = require('node:net');

// Requests reach Express through nginx and then the Next.js /api rewrite, so
// req.ip (trust proxy 1) can be a local hop. Walk X-Forwarded-For from the
// right and take the first public address: that is the one our own proxy
// appended, and anything to its left could have been sent by the client.
// Returns null when no public address is visible (local dev, or a proxy that
// doesn't forward one), so callers never lump every visitor into one bucket.
const isPrivate = (ip) => {
    if (ip.startsWith('::ffff:')) ip = ip.slice(7);
    if (net.isIPv4(ip)) {
        const [a, b] = ip.split('.').map(Number);
        return a === 10 || a === 127 || a === 0 ||
            (a === 172 && b >= 16 && b <= 31) ||
            (a === 192 && b === 168) ||
            (a === 169 && b === 254) ||
            (a === 100 && b >= 64 && b <= 127);
    }
    const lower = ip.toLowerCase();
    return lower === '::1' || lower === '::' ||
        lower.startsWith('fc') || lower.startsWith('fd') || lower.startsWith('fe80');
};

const clientIp = (req) => {
    const header = req.headers['x-forwarded-for'];
    const hops = (Array.isArray(header) ? header.join(',') : header || '')
        .split(',')
        .map(s => s.trim())
        .filter(s => net.isIP(s.replace(/^::ffff:/, '')));
    for (let i = hops.length - 1; i >= 0; i--) {
        if (!isPrivate(hops[i])) return hops[i];
    }
    const remote = req.socket?.remoteAddress;
    return remote && !isPrivate(remote) ? remote : null;
};

let warnedNoIp = false;

const normalizeEmail = (req) => {
    const email = req.body?.email;
    return typeof email === 'string' && email.trim() ? email.trim().toLowerCase() : null;
};

const tooMany = (res, seconds) => {
    if (seconds > 0) res.set('Retry-After', String(seconds));
    return res.status(429).json({
        success: false,
        message: 'Too many attempts. Please wait a few minutes and try again.'
    });
};

// Counts a hit in a fixed window and reports whether it is over the limit.
const hit = async (redisClient, key, windowSeconds, max) => {
    const count = await redisClient.incr(key);
    if (count === 1) await redisClient.expire(key, windowSeconds);
    if (count <= max) return { over: false };
    const ttl = await redisClient.ttl(key);
    return { over: true, retryAfter: ttl > 0 ? ttl : windowSeconds };
};

/**
 * Builds rate limit middleware for an auth route.
 *
 * options.name        key namespace, e.g. 'login-email'
 * options.ip          { max, windowSeconds } limit per client IP
 * options.email       { max, windowSeconds } limit per email in the body
 * options.failures    { max, windowSeconds } failed attempts (401) per email
 *                     before the account is locked out for the window; a
 *                     successful response clears the count
 *
 * Redis errors fail open so an outage never blocks sign in.
 */
const createAuthRateLimit = (getRedisClient, options) => {
    const prefix = `${process.env.REDIS_SESSION_PREFIX || 'hanbok:'}ratelimit:${options.name}`;

    return async (req, res, next) => {
        const redisClient = getRedisClient();
        try {
            const ip = options.ip ? clientIp(req) : null;
            if (ip) {
                const { over, retryAfter } = await hit(redisClient,
                    `${prefix}:ip:${ip}`, options.ip.windowSeconds, options.ip.max);
                if (over) return tooMany(res, retryAfter);
            } else if (options.ip && !warnedNoIp && process.env.LOCAL !== 'true') {
                warnedNoIp = true;
                console.warn('Auth rate limit: no public client IP in X-Forwarded-For, per-IP limits skipped');
            }

            const email = normalizeEmail(req);
            if (email && options.email) {
                const { over, retryAfter } = await hit(redisClient,
                    `${prefix}:email:${email}`, options.email.windowSeconds, options.email.max);
                if (over) return tooMany(res, retryAfter);
            }

            if (email && options.failures) {
                const failKey = `${prefix}:fail:${email}`;
                const failures = Number(await redisClient.get(failKey)) || 0;
                if (failures >= options.failures.max) {
                    const ttl = await redisClient.ttl(failKey);
                    return tooMany(res, ttl > 0 ? ttl : options.failures.windowSeconds);
                }
                res.on('finish', () => {
                    const track = res.statusCode === 401
                        ? hit(redisClient, failKey, options.failures.windowSeconds, Infinity)
                        : res.statusCode < 300 ? redisClient.del(failKey) : null;
                    if (track) track.catch(err => console.error('Auth rate limit error:', err));
                });
            }
        } catch (err) {
            console.error('Auth rate limit error:', err);
        }
        next();
    };
};

module.exports = { createAuthRateLimit, clientIp };
