const crypto = require('crypto');

// Sentence links use a random publicId (e.g. /sentence/k3Xq9vB2nLwa) so nobody can
// browse other people's sentences by counting up. Sentences created before publicIds
// existed have none and stay reachable by their numeric sentenceId.
// Internally everything still keys on the numeric sentenceId.

const PUBLIC_ID = /^[A-Za-z0-9_-]{12}$/;
const NUMERIC_ID = /^\d+$/;

const newPublicId = () => {
    for (;;) {
        const id = crypto.randomBytes(9).toString('base64url'); // 12 chars
        if (!NUMERIC_ID.test(id)) return id;
    }
};

const sameId = (a, b) => a !== null && a !== undefined && b !== null && b !== undefined && Number(a) === Number(b);

// Finds the sentence a link points at, or null if this requester may not see it.
// A numeric id only opens sentences that have no publicId, unless the requester owns
// the sentence or is an admin. A sentence its owner removed from history is only
// visible to that owner (and admins).
const findSentenceByKey = async (db, key, { userId = null, isAdmin = false } = {}) => {
    const raw = String(key || '');
    let sentence = null;

    if (NUMERIC_ID.test(raw)) {
        sentence = await db.collection('sentences').findOne({ sentenceId: parseInt(raw, 10) });
        if (sentence?.publicId && !sameId(sentence.userId, userId) && !isAdmin) return null;
    } else if (PUBLIC_ID.test(raw)) {
        sentence = await db.collection('sentences').findOne({ publicId: raw });
    }

    if (!sentence) return null;
    if (sentence.hiddenAt && !sameId(sentence.userId, userId) && !isAdmin) return null;
    return sentence;
};

// Adds publicId to each item that references a sentence, so the client can link to
// /sentence/<publicId> instead of the guessable number.
const attachPublicIds = async (db, items, field = 'sentenceId') => {
    const ids = [...new Set(items.map((item) => item?.[field]).filter((id) => Number.isInteger(id)))];
    if (ids.length === 0) return items;

    const rows = await db.collection('sentences')
        .find({ sentenceId: { $in: ids }, publicId: { $exists: true } }, { projection: { sentenceId: 1, publicId: 1 } })
        .toArray();
    const byId = new Map(rows.map((row) => [row.sentenceId, row.publicId]));

    for (const item of items) {
        const publicId = item && byId.get(item[field]);
        if (publicId) item.publicId = publicId;
    }
    return items;
};

// The numeric sentenceId for a link key, for routes that only touch the requester's
// own records (unsave, saved check). Returns null when the key matches nothing.
const resolveSentenceId = async (db, key) => {
    const raw = String(key || '');
    if (NUMERIC_ID.test(raw)) return parseInt(raw, 10);
    if (!PUBLIC_ID.test(raw)) return null;
    const row = await db.collection('sentences').findOne({ publicId: raw }, { projection: { sentenceId: 1 } });
    return row ? row.sentenceId : null;
};

module.exports = { newPublicId, findSentenceByKey, attachPublicIds, resolveSentenceId, PUBLIC_ID, NUMERIC_ID };
