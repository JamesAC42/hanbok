// Records what people do with the Chrome extension, for the admin dashboard.
//
// The extension's background worker calls the same /api routes as the site.
// Version 1.0.0 sends no marker of its own, so its requests are recognized by
// what Chrome attaches: POSTs carry Origin: chrome-extension://<id>, and GETs
// carry Sec-Fetch-Site: none (the site's own fetches say same-origin). Later
// versions also send X-Hanbok-Client: extension/<version>.
const crypto = require('crypto');
const { getDb } = require('../database');

const ACTIONS = [
    { method: 'POST', path: /^\/api\/submit$/, action: 'analyze' },
    { method: 'POST', path: /^\/api\/words$/, action: 'saveWord' },
    { method: 'POST', path: /^\/api\/sentences\/[^/]+\/save$/, action: 'saveSentence' },
    { method: 'POST', path: /^\/api\/sentences\/[^/]+\/generate-audio$/, action: 'audio' },
    { method: 'GET', path: /^\/api\/word-audio$/, action: 'audio' },
    { method: 'GET', path: /^\/api\/word-relations$/, action: 'wordDetails' },
    { method: 'GET', path: /^\/api\/session$/, action: 'open' },
    // Saved-word sync for page highlights; only the first page counts as one sync.
    { method: 'GET', path: /^\/api\/words$/, action: 'sync', when: (req) => !req.query.page || req.query.page === '1' },
];

const header = (req, name) => {
    const value = req.headers[name];
    return typeof value === 'string' ? value : '';
};

const isExtensionRequest = (req) => {
    if (header(req, 'x-hanbok-client').startsWith('extension')) return true;
    if (header(req, 'origin').startsWith('chrome-extension://')) return true;
    return header(req, 'sec-fetch-site') === 'none' && header(req, 'sec-fetch-mode') === 'cors';
};

const extensionVersion = (req) => {
    const match = /^extension\/([\w.-]{1,20})$/.exec(header(req, 'x-hanbok-client'));
    return match ? match[1] : null;
};

const actionFor = (req) => {
    const path = (req.originalUrl || req.url || '').split('?')[0];
    const match = ACTIONS.find((a) => a.method === req.method && a.path.test(path) && (!a.when || a.when(req)));
    return match ? match.action : null;
};

// Signed-out users are counted by a salted hash of their IP, never the IP itself.
const visitorKey = (req) => {
    const ip = (header(req, 'x-forwarded-for').split(',')[0] || req.socket?.remoteAddress || '').trim();
    return crypto.createHash('sha256').update(`hanbok-extension:${ip}`).digest('hex').slice(0, 16);
};

const record = async (db, { userId, visitor, action, version, at = new Date() }) => {
    await db.collection('extension_events').insertOne({ at, userId, visitor: userId === null ? visitor : null, action, version });
    if (userId !== null) {
        await db.collection('users').updateOne(
            { userId },
            { $min: { extensionFirstSeen: at }, $max: { extensionLastSeen: at }, ...(version ? { $set: { extensionVersion: version } } : {}) }
        );
    }
};

// Express middleware: never delays or fails the request; records once the
// response has gone out, and only for requests that succeeded.
const trackExtensionUsage = (req, res, next) => {
    if (!isExtensionRequest(req)) return next();
    const action = actionFor(req);
    if (!action) return next();
    res.on('finish', () => {
        if (res.statusCode >= 400) return;
        const userId = req.session?.user?.userId ?? null;
        // 1.0.0 is the only version that doesn't send its version
        const version = extensionVersion(req) || (header(req, 'x-hanbok-client') ? null : '1.0.0');
        record(getDb(), { userId, visitor: visitorKey(req), action, version })
            .catch((error) => console.error('Extension usage tracking failed:', error.message));
    });
    next();
};

// The site reports, for a signed-in user, that it can see the extension
// installed (site-marker.js sets data-hanbok-extension on hanbokstudy.com).
const reportInstalled = async (req, res) => {
    const userId = req.session?.user?.userId;
    if (userId === undefined || userId === null) return res.status(401).json({ success: false });
    const raw = typeof req.body?.version === 'string' ? req.body.version : '';
    const version = /^[\w.-]{1,20}$/.test(raw) ? raw : null;
    try {
        await getDb().collection('users').updateOne(
            { userId },
            { $min: { extensionDetectedAt: new Date() }, $max: { extensionDetectedLastAt: new Date() }, ...(version ? { $set: { extensionVersion: version } } : {}) }
        );
        res.json({ success: true });
    } catch (error) {
        console.error('Extension install report failed:', error.message);
        res.status(500).json({ success: false });
    }
};

module.exports = { trackExtensionUsage, reportInstalled, isExtensionRequest, actionFor, extensionVersion, visitorKey, record };
