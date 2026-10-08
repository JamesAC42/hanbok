// Speak: live voice role-play with Horang (OpenAI Realtime over WebRTC).
// The browser sends its WebRTC offer here; the server adds the instructions,
// the learner's saved words and grammar and the plan's time cap, opens the
// call with OpenAI and hands back the answer. The API key never leaves the
// server, and the server can hang the call up when time runs out.
const crypto = require('crypto');
const { getDb } = require('../database');
const SupportedLanguages = require('../supported_languages');
const { SCENARIOS, LEVELS, findScenario, publicScenario } = require('../speak/scenarios');
const { buildInstructions, TOOLS, nameOf } = require('../speak/prompt');
const { allowanceFor, planFor, MAX_SESSION_SECONDS, MIN_START_SECONDS } = require('../speak/limits');

const OPENAI_URL = 'https://api.openai.com/v1/realtime/calls';
const VOICE = process.env.SPEAK_VOICE || 'cedar';
const TRANSLATE_MODEL = process.env.SPEAK_TRANSLATE_MODEL || 'gpt-4.1';
const hangupTimers = new Map();

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const langOr = (code, fallback) => (SupportedLanguages[code] ? code : fallback);

const loadUser = (db, req) => db.collection('users').findOne(
    { userId: req.session.user.userId },
    { projection: { userId: 1, tier: 1, name: 1 } },
);

const hangup = async (callId) => {
    if (!callId) return;
    try {
        await fetch(`${OPENAI_URL}/${encodeURIComponent(callId)}/hangup`, {
            method: 'POST',
            headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
        });
    } catch (e) {
        console.error('speak: hangup failed', callId, e.message);
    }
};

const closeSession = async (db, session, reason) => {
    const timer = hangupTimers.get(session.sessionId);
    if (timer) { clearTimeout(timer); hangupTimers.delete(session.sessionId); }
    const elapsed = (Date.now() - new Date(session.startedAt).getTime()) / 1000;
    const billedSeconds = Math.round(Math.min(Math.max(elapsed, 0), session.maxSeconds));
    const res = await db.collection('speak_sessions').findOneAndUpdate(
        { sessionId: session.sessionId, endedAt: { $exists: false } },
        { $set: { endedAt: new Date(), billedSeconds, endReason: reason } },
        { returnDocument: 'after' },
    );
    if (res) await hangup(session.callId);
    return res;
};

// GET /api/speak: scenes, plus the learner's minutes when signed in.
const overview = async (req, res) => {
    const language = langOr(req.query.language, 'ko');
    const scenarios = SCENARIOS.map((s) => publicScenario(s, language));
    if (!req.session?.user) return res.json({ success: true, scenarios, levels: LEVELS, allowance: null });
    try {
        const db = getDb();
        const user = await loadUser(db, req);
        const allowance = user ? await allowanceFor(db, user) : null;
        if (allowance) delete allowance.model;
        res.json({ success: true, scenarios, levels: LEVELS, allowance });
    } catch (e) {
        console.error('speak overview', e);
        res.status(500).json({ success: false, error: 'Could not load Speak' });
    }
};

// POST /api/speak/session { scenarioId, level, language, nativeLanguage, sdp }
const startSession = async (req, res) => {
    const scenario = findScenario(req.body?.scenarioId);
    const level = LEVELS.includes(req.body?.level) ? req.body.level : 'beginner';
    const language = langOr(req.body?.language, 'ko');
    const nativeLanguage = langOr(req.body?.nativeLanguage, 'en');
    const sdp = typeof req.body?.sdp === 'string' ? req.body.sdp : '';
    if (!scenario) return res.status(400).json({ success: false, error: 'Unknown scene' });
    if (!sdp.startsWith('v=0') || sdp.length > 20000) return res.status(400).json({ success: false, error: 'Bad connection offer' });
    if (!process.env.OPENAI_API_KEY && !process.env.SPEAK_ALLOW_NO_KEY) return res.status(503).json({ success: false, error: 'Speak is not set up on this server yet' });

    try {
        const db = getDb();
        const user = await loadUser(db, req);
        if (!user) return res.status(401).json({ success: false, error: 'Please sign in' });

        // One call at a time: a new start closes any call still open.
        const open = await db.collection('speak_sessions')
            .find({ userId: user.userId, endedAt: { $exists: false } }).toArray();
        await Promise.all(open.map((s) => closeSession(db, s, 'replaced')));

        const allowance = await allowanceFor(db, user);
        if (allowance.leftSeconds < MIN_START_SECONDS) {
            return res.status(403).json({ success: false, reachedLimit: true, allowance: { ...allowance, model: undefined }, error: 'You have used your speaking minutes for now' });
        }
        const maxSeconds = Math.floor(Math.min(allowance.leftSeconds, MAX_SESSION_SECONDS));

        const [words, grammar] = await Promise.all([
            db.collection('words').find({ userId: user.userId, originalLanguage: language }, { projection: { originalWord: 1, translatedWord: 1 } })
                .sort({ dateSaved: -1 }).limit(40).toArray(),
            db.collection('saved_grammar').find({ userId: user.userId, language }, { projection: { pattern: 1 } })
                .sort({ dateSaved: -1 }).limit(12).toArray(),
        ]);

        const instructions = buildInstructions({
            scenario, level, language, nativeLanguage, words, grammar,
            userName: str(user.name, 40).split(' ')[0],
        });
        const model = planFor(user.tier || 0).model;
        const session = {
            type: 'realtime',
            model,
            instructions,
            tools: TOOLS,
            tool_choice: 'auto',
            audio: {
                input: {
                    noise_reduction: { type: 'near_field' },
                    transcription: { model: 'gpt-4o-mini-transcribe' },
                    turn_detection: { type: 'semantic_vad', eagerness: 'low' },
                },
                output: { voice: VOICE },
            },
        };

        const form = new FormData();
        form.set('sdp', sdp);
        form.set('session', JSON.stringify(session));
        const r = await fetch(OPENAI_URL, {
            method: 'POST',
            headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` },
            body: form,
        });
        const answer = await r.text();
        if (!r.ok) {
            console.error('speak: OpenAI call failed', r.status, answer.slice(0, 500));
            return res.status(502).json({ success: false, error: 'Horang could not pick up. Please try again.' });
        }
        const callId = (r.headers.get('location') || '').split('/').pop() || null;

        const sessionId = crypto.randomBytes(12).toString('hex');
        await db.collection('speak_sessions').insertOne({
            sessionId, userId: user.userId, callId, scenarioId: scenario.id, level, language, nativeLanguage,
            model, tier: user.tier || 0, maxSeconds, startedAt: new Date(),
            savedWordsUsed: words.length, savedGrammarUsed: grammar.length,
        });
        // Hard stop when the time runs out, even if the tab is gone.
        hangupTimers.set(sessionId, setTimeout(async () => {
            hangupTimers.delete(sessionId);
            const s = await db.collection('speak_sessions').findOne({ sessionId });
            if (s && !s.endedAt) await closeSession(db, s, 'time');
        }, (maxSeconds + 5) * 1000));

        res.json({ success: true, sessionId, answer, maxSeconds, leftSeconds: allowance.leftSeconds });
    } catch (e) {
        console.error('speak start', e);
        res.status(500).json({ success: false, error: 'Could not start the call' });
    }
};

const cleanTranscript = (t) => (Array.isArray(t) ? t : []).slice(-80)
    .filter((m) => m && (m.who === 'horang' || m.who === 'you'))
    .map((m) => ({ who: m.who, text: str(m.text, 600) }))
    .filter((m) => m.text);

// POST /api/speak/session/:id/end { goalsDone, transcript, usage }
const endSession = async (req, res) => {
    try {
        const db = getDb();
        const s = await db.collection('speak_sessions').findOne({ sessionId: String(req.params.id), userId: req.session.user.userId });
        if (!s) return res.status(404).json({ success: false, error: 'Not found' });
        const extra = {
            goalsDone: Math.max(0, Math.min(10, parseInt(req.body?.goalsDone, 10) || 0)),
            transcript: cleanTranscript(req.body?.transcript),
            ...(req.body?.usage && typeof req.body.usage === 'object' ? {
                usage: {
                    inputAudio: Number(req.body.usage.inputAudio) || 0,
                    inputCachedAudio: Number(req.body.usage.inputCachedAudio) || 0,
                    inputText: Number(req.body.usage.inputText) || 0,
                    outputAudio: Number(req.body.usage.outputAudio) || 0,
                    outputText: Number(req.body.usage.outputText) || 0,
                },
            } : {}),
        };
        if (!s.endedAt) await closeSession(db, s, str(req.body?.reason, 20) || 'user');
        await db.collection('speak_sessions').updateOne({ sessionId: s.sessionId }, { $set: extra });
        const user = await loadUser(db, req);
        const allowance = await allowanceFor(db, user);
        delete allowance.model;
        res.json({ success: true, allowance });
    } catch (e) {
        console.error('speak end', e);
        res.status(500).json({ success: false, error: 'Could not end the call' });
    }
};

// POST /api/speak/translate { sessionId, text }: English (native) line under Horang's words.
const translate = async (req, res) => {
    const text = str(req.body?.text, 500);
    if (!text) return res.json({ success: true, translation: '' });
    try {
        const db = getDb();
        const s = await db.collection('speak_sessions').findOne(
            { sessionId: String(req.body?.sessionId || ''), userId: req.session.user.userId },
            { projection: { startedAt: 1, nativeLanguage: 1, language: 1 } },
        );
        if (!s || Date.now() - new Date(s.startedAt).getTime() > 2 * 60 * 60 * 1000) {
            return res.status(403).json({ success: false, error: 'No active call' });
        }
        const r = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: TRANSLATE_MODEL,
                temperature: 0,
                max_tokens: 300,
                messages: [
                    { role: 'system', content: `Translate the ${nameOf(s.language)} parts of the line into natural ${nameOf(s.nativeLanguage)}. Keep any ${nameOf(s.nativeLanguage)} parts as they are. Reply with the translation only.` },
                    { role: 'user', content: text },
                ],
            }),
        });
        const out = await r.json();
        if (!r.ok) throw new Error(out?.error?.message || `HTTP ${r.status}`);
        res.json({ success: true, translation: str(out.choices?.[0]?.message?.content, 800) });
    } catch (e) {
        console.error('speak translate', e.message);
        res.status(500).json({ success: false, error: 'Translation failed' });
    }
};

module.exports = { overview, startSession, endSession, translate };
