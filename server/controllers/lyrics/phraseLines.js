const { getDb } = require('../../database');

// Song lines that use a Korean word or phrase, for the public phrase pages
// ("what does 대박 mean"). Every published Korean song's analyzed lines are
// gathered once and kept in memory for an hour; a search is then a filter.

const INDEX_TTL_MS = 60 * 60 * 1000;
let index = null;
let builtAt = 0;
let building = null;

async function buildIndex() {
    const db = getDb();
    const lyrics = await db.collection('lyrics')
        .find({ published: true, language: 'ko' }, { projection: { _id: 1, lyricId: 1, title: 1, artist: 1 } })
        .toArray();
    const songs = new Map(lyrics.map((l) => [l._id.toString(), l]));

    const analyses = await db.collection('lyrics_analysis')
        .find({ lyricId: { $in: [...songs.keys()] }, language: 'en' }, { projection: { lyricId: 1, analysisData: 1 } })
        .toArray();

    const items = [];
    for (const analysis of analyses) {
        const song = songs.get(analysis.lyricId);
        let data = [];
        try { data = JSON.parse(analysis.analysisData || '[]'); } catch { continue; }
        for (const item of data) {
            if (item?.text && item.sentenceId != null) items.push({ song, text: item.text.trim(), sentenceId: item.sentenceId });
        }
    }

    const sentences = await db.collection('sentences')
        .find({ sentenceId: { $in: items.map((i) => i.sentenceId) } }, { projection: { sentenceId: 1, 'analysis.sentence.translation': 1 } })
        .toArray();
    const translations = new Map(sentences.map((s) => [s.sentenceId, s.analysis?.sentence?.translation || '']));

    return items.map(({ song, text, sentenceId }) => ({
        lyricId: song.lyricId,
        title: song.title,
        artist: song.artist || '',
        text,
        translation: translations.get(sentenceId) || '',
    }));
}

async function getIndex() {
    if (index && Date.now() - builtAt < INDEX_TTL_MS) return index;
    if (!building) {
        building = buildIndex()
            .then((built) => { index = built; builtAt = Date.now(); return built; })
            .finally(() => { building = null; });
    }
    return building;
}

const escape = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// The phrase has to start a word, so 형 finds "형 나 왔어" but not 모형.
function findLines(lines, phrase, limit) {
    const re = new RegExp(`(^|[\\s"'“‘(\\[.,!?~…])${escape(phrase)}`);
    const seen = new Set();
    const matches = lines.filter((l) => {
        if (!l.translation || !re.test(l.text)) return false;
        const key = `${l.lyricId}|${l.text}`;
        if (seen.has(key)) return false;
        seen.add(key);
        return true;
    });
    // One line per song first, so a chorus repeated six times doesn't fill the list.
    const firstPerSong = [];
    const rest = [];
    const songsSeen = new Set();
    for (const m of matches) {
        if (songsSeen.has(m.lyricId)) rest.push(m);
        else { songsSeen.add(m.lyricId); firstPerSong.push(m); }
    }
    return [...firstPerSong, ...rest].slice(0, limit);
}

async function getPhraseLines(req, res) {
    const phrase = String(req.query.q || '').trim();
    const limit = Math.min(Math.max(parseInt(req.query.limit, 10) || 4, 1), 10);
    if (!phrase || phrase.length > 20 || !/[가-힣]/.test(phrase)) {
        return res.status(400).json({ success: false, message: 'q must be a short Korean phrase' });
    }
    try {
        const lines = findLines(await getIndex(), phrase, limit);
        return res.json({ success: true, lines });
    } catch (error) {
        console.error('Error finding phrase lines:', error);
        return res.status(500).json({ success: false, message: 'Failed to find lines' });
    }
}

const resetIndex = () => { index = null; builtAt = 0; };

module.exports = { getPhraseLines, findLines, resetIndex };
