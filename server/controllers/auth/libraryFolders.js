const { getDb } = require('../../database');
const { resolveSentenceId } = require('../../lib/sentenceKeys');

// Folders organize the Library's saved sentences and paragraphs. A saved item
// lives in at most one folder (folderId on its savedSentences / savedExtendedTexts
// row); null means it isn't filed. Deleting a folder only unfiles its items.

const MAX_FOLDERS = 100;
const MAX_NAME = 60;

const cleanName = (raw) => String(raw || '').replace(/\s+/g, ' ').trim().slice(0, MAX_NAME);

const sameNameQuery = (userId, name, exceptId = null) => ({
    userId,
    name: { $regex: `^${name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' },
    ...(exceptId ? { folderId: { $ne: exceptId } } : {}),
});

const countByFolder = async (db, collection, userId) => {
    const rows = await db.collection(collection)
        .aggregate([{ $match: { userId } }, { $group: { _id: { $ifNull: ['$folderId', null] }, count: { $sum: 1 } } }])
        .toArray();
    return new Map(rows.map((row) => [row._id, row.count]));
};

// GET /api/folders -> folders with item counts, plus the unfiled and total counts.
const listFolders = async (req, res) => {
    const userId = req.session.user.userId;
    try {
        const db = getDb();
        const [folders, sentenceCounts, textCounts] = await Promise.all([
            db.collection('library_folders').find({ userId }).sort({ name: 1 }).toArray(),
            countByFolder(db, 'savedSentences', userId),
            countByFolder(db, 'savedExtendedTexts', userId),
        ]);
        const countFor = (id) => (sentenceCounts.get(id) || 0) + (textCounts.get(id) || 0);
        const folderIds = new Set(folders.map((f) => f.folderId));

        let total = 0;
        let unfiled = 0;
        for (const counts of [sentenceCounts, textCounts]) {
            for (const [id, count] of counts) {
                total += count;
                // Items pointing at a folder that no longer exists count as unfiled.
                if (id === null || !folderIds.has(id)) unfiled += count;
            }
        }

        res.json({
            success: true,
            folders: folders.map((f) => ({ folderId: f.folderId, name: f.name, count: countFor(f.folderId) })),
            unfiledCount: unfiled,
            totalCount: total,
        });
    } catch (error) {
        console.error('Error listing folders:', error);
        res.status(500).json({ success: false, error: 'Failed to load folders' });
    }
};

// POST /api/folders { name }
const createFolder = async (req, res) => {
    const userId = req.session.user.userId;
    const name = cleanName(req.body?.name);
    if (!name) return res.status(400).json({ success: false, error: 'Give the folder a name' });

    try {
        const db = getDb();
        const folders = db.collection('library_folders');
        if (await folders.countDocuments({ userId }) >= MAX_FOLDERS) {
            return res.status(400).json({ success: false, error: `You can have up to ${MAX_FOLDERS} folders` });
        }
        const existing = await folders.findOne(sameNameQuery(userId, name));
        if (existing) {
            return res.json({ success: true, folder: { folderId: existing.folderId, name: existing.name, count: 0 }, existed: true });
        }

        const counter = await db.collection('counters').findOneAndUpdate(
            { _id: 'libraryFolderId' },
            { $inc: { seq: 1 } },
            { upsert: true, returnDocument: 'after' }
        );
        const folder = { folderId: counter.seq, userId, name, dateCreated: new Date() };
        await folders.insertOne(folder);
        res.json({ success: true, folder: { folderId: folder.folderId, name, count: 0 } });
    } catch (error) {
        console.error('Error creating folder:', error);
        res.status(500).json({ success: false, error: 'Failed to create folder' });
    }
};

// PATCH /api/folders/:folderId { name }
const renameFolder = async (req, res) => {
    const userId = req.session.user.userId;
    const folderId = parseInt(req.params.folderId, 10);
    const name = cleanName(req.body?.name);
    if (!Number.isInteger(folderId)) return res.status(400).json({ success: false, error: 'Invalid folder' });
    if (!name) return res.status(400).json({ success: false, error: 'Give the folder a name' });

    try {
        const folders = getDb().collection('library_folders');
        if (await folders.findOne(sameNameQuery(userId, name, folderId))) {
            return res.status(400).json({ success: false, error: 'You already have a folder with that name' });
        }
        const result = await folders.updateOne({ folderId, userId }, { $set: { name } });
        if (result.matchedCount === 0) return res.status(404).json({ success: false, error: 'Folder not found' });
        res.json({ success: true, folder: { folderId, name } });
    } catch (error) {
        console.error('Error renaming folder:', error);
        res.status(500).json({ success: false, error: 'Failed to rename folder' });
    }
};

// DELETE /api/folders/:folderId -> removes the folder; its items stay saved, unfiled.
const deleteFolder = async (req, res) => {
    const userId = req.session.user.userId;
    const folderId = parseInt(req.params.folderId, 10);
    if (!Number.isInteger(folderId)) return res.status(400).json({ success: false, error: 'Invalid folder' });

    try {
        const db = getDb();
        const result = await db.collection('library_folders').deleteOne({ folderId, userId });
        if (result.deletedCount === 0) return res.status(404).json({ success: false, error: 'Folder not found' });
        await Promise.all([
            db.collection('savedSentences').updateMany({ userId, folderId }, { $set: { folderId: null } }),
            db.collection('savedExtendedTexts').updateMany({ userId, folderId }, { $set: { folderId: null } }),
        ]);
        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting folder:', error);
        res.status(500).json({ success: false, error: 'Failed to delete folder' });
    }
};

// PUT /api/saved-items/folder { type: 'sentence' | 'extended_text', id, folderId | null }
// id is a sentence link key (publicId or number) or a textId.
const moveSavedItem = async (req, res) => {
    const userId = req.session.user.userId;
    const { type, id } = req.body || {};
    const rawFolder = req.body?.folderId;
    const folderId = rawFolder === null || rawFolder === undefined || rawFolder === '' ? null : parseInt(rawFolder, 10);
    if (folderId !== null && !Number.isInteger(folderId)) {
        return res.status(400).json({ success: false, error: 'Invalid folder' });
    }

    try {
        const db = getDb();
        if (folderId !== null && !(await db.collection('library_folders').findOne({ folderId, userId }))) {
            return res.status(404).json({ success: false, error: 'Folder not found' });
        }

        let result;
        if (type === 'sentence') {
            const sentenceId = await resolveSentenceId(db, id);
            result = await db.collection('savedSentences').updateOne({ userId, sentenceId }, { $set: { folderId } });
        } else if (type === 'extended_text') {
            const textId = parseInt(id, 10);
            result = await db.collection('savedExtendedTexts').updateOne({ userId, textId }, { $set: { folderId } });
        } else {
            return res.status(400).json({ success: false, error: 'Invalid item type' });
        }

        if (result.matchedCount === 0) return res.status(404).json({ success: false, error: 'Save it first' });
        res.json({ success: true, folderId });
    } catch (error) {
        console.error('Error moving saved item:', error);
        res.status(500).json({ success: false, error: 'Failed to move item' });
    }
};

module.exports = { listFolders, createFolder, renameFolder, deleteFolder, moveSavedItem };
