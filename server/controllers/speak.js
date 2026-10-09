// Speak: live voice role-play with Horang and Sora over WebRTC, on either
// GPT-Live (SPEAK_ENGINE=live, the default) or the Realtime API (=realtime).
// The browser sends its WebRTC offer here; the server adds the instructions,
// the learner's saved words and grammar and the plan's time cap, opens the
// call with OpenAI and hands back the answer. The API key never leaves the
// server, and the server can hang the call up when time runs out.
const crypto = require('crypto');
const { getDb } = require('../database');
const SupportedLanguages = require('../supported_languages');
const { SCENARIOS, LEVELS, findScenario, publicScenario } = require('../speak/scenarios');
const { buildInstructions, toolsFor, characterFor, ASSISTS, defaultAssist, assistSwitchNote, nameOf } = require('../speak/prompt');
const { allowanceFor, planFor, planTable, MAX_SESSION_SECONDS, MIN_START_SECONDS } = require('../speak/limits');
const { coachTurn } = require('../speak/coach');

const OPENAI_URL = 'https://api.openai.com/v1/realtime/calls';
const LIVE_URL = 'https://api.openai.com/v1/live/sessions';
const LIVE_MODEL = process.env.SPEAK_LIVE_MODEL || 'gpt-live-1';
const engineNow = () => (process.env.SPEAK_ENGINE === 'realtime' ? 'realtime' : 'live');
// Voices a tester can try with ?voices=1 on /speak. Realtime only knows the
// older ones; GPT-Live knows all of them.
const REALTIME_VOICES = ['alloy', 'ash', 'ballad', 'cedar', 'coral', 'echo', 'marin', 'sage', 'shimmer', 'verse'];
const LIVE_VOICES = [...REALTIME_VOICES, 'beacon', 'bossa', 'cinder', 'delta', 'gleam', 'meridian', 'quartz', 'ripple', 'stone', 'tempo', 'vesper', 'willow'];
const TRANSLATE_MODEL = process.env.SPEAK_TRANSLATE_MODEL || 'gpt-4.1';
const hangupTimers = new Map();
const NON_LATIN = new Set(['ko', 'ja', 'zh', 'zh-TW', 'ru', 'hi']);

const str = (v, max) => (typeof v === 'string' ? v.trim().slice(0, max) : '');
const langOr = (code, fallback) => (SupportedLanguages[code] ? code : fallback);

const loadUser = (db, req) => db.collection('users').findOne(
    { userId: req.session.user.userId },
    { projection: { userId: 1, tier: 1, name: 1 } },
);

const hangup = async (callId, engine) => {
    if (!callId) return;
    try {
        await fetch(`${engine === 'live' ? LIVE_URL : OPENAI_URL}/${encodeURIComponent(callId)}/hangup`, {
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
    if (res) await hangup(session.callId, session.engine);
    return res;
};

// GET /api/speak: scenes, plus the learner's minutes when signed in.
const overview = async (req, res) => {
    const language = langOr(req.query.language, 'ko');
    const scenarios = SCENARIOS.map((s) => publicScenario(s, language));
    const plans = planTable();
    if (!req.session?.user) return res.json({ success: true, scenarios, levels: LEVELS, plans, allowance: null });
    try {
        const db = getDb();
        const user = await loadUser(db, req);
        const allowance = user ? await allowanceFor(db, user) : null;
        if (allowance) delete allowance.model;
        res.json({ success: true, scenarios, levels: LEVELS, plans, allowance });
    } catch (e) {
        console.error('speak overview', e);
        res.status(500).json({ success: false, error: 'Could not load Speak' });
    }
};

// Realtime API: one speech-to-speech model that also calls the screen tools.
const openRealtime = async ({ sdp, character, instructions, model, language, nativeLanguage }) => {
    const session = {
        type: 'realtime',
        model,
        instructions,
        tools: toolsFor(character.id, nativeLanguage),
        tool_choice: 'auto',
        audio: {
            input: {
                noise_reduction: { type: 'near_field' },
                // Captions only (the model hears the audio itself). The prompt
                // keeps mixed learner speech from being read as another language.
                transcription: {
                    model: process.env.SPEAK_TRANSCRIBE_MODEL || 'gpt-4o-transcribe',
                    prompt: `A ${nameOf(nativeLanguage)} speaker practicing ${nameOf(language)}. They speak ${nameOf(language)} or ${nameOf(nativeLanguage)}, sometimes mixed in one sentence, with a learner's accent. Write ${nameOf(language)} words in ${nameOf(language)} script.`,
                },
                turn_detection: { type: 'semantic_vad', eagerness: 'low' },
            },
            output: { voice: character.voice },
        },
    };
    const form = new FormData();
    form.set('sdp', sdp);
    form.set('session', JSON.stringify(session));
    const r = await fetch(OPENAI_URL, { method: 'POST', headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}` }, body: form });
    const answer = await r.text();
    if (!r.ok) { console.error('speak: realtime call failed', r.status, answer.slice(0, 500)); return null; }
    return { answer, model, callId: (r.headers.get('location') || '').split('/').pop() || null };
};

// GPT-Live: full-duplex voice billed per minute. It can't call tools, so the
// browser asks /api/speak/coach to drive the screen after each turn.
const LIVE_CLIENT_EVENTS = ['session.instructions.append', 'session.commentary.append', 'session.thinking.append', 'session.input_audio.mute', 'session.input_audio.unmute'];
// opener: a first user turn, so the character speaks as soon as the call connects.
const openLive = async ({ sdp, character, instructions, opener, trusted = false, store = false }) => {
    const r = await fetch(LIVE_URL, {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            session: {
                model: LIVE_MODEL,
                instructions,
                audio: { output: { voice: character.voice } },
                // The browser is untrusted: it may only nudge and mute.
                ...(trusted ? {} : { client: { data_channel: { allowed_client_events: LIVE_CLIENT_EVENTS, allowed_server_events: 'all' } } }),
                ...(store ? { store: true } : {}),
                ...(opener ? { input: [{ type: 'message', role: 'user', content: [{ type: 'input_text', text: opener }] }] } : {}),
            },
            transport: { type: 'webrtc', sdp },
        }),
    });
    const out = await r.json().catch(() => ({}));
    if (!r.ok || !out.transport?.sdp) { console.error('speak: live call failed', r.status, JSON.stringify(out).slice(0, 500)); return null; }
    return { answer: out.transport.sdp, model: LIVE_MODEL, callId: out.session?.id || null };
};

// POST /api/speak/session { scenarioId, level, language, nativeLanguage, sdp }
const startSession = async (req, res) => {
    const scenario = findScenario(req.body?.scenarioId);
    const level = LEVELS.includes(req.body?.level) ? req.body.level : 'beginner';
    const language = langOr(req.body?.language, 'ko');
    const nativeLanguage = langOr(req.body?.nativeLanguage, 'en');
    const assist = ASSISTS.includes(req.body?.assist) ? req.body.assist : defaultAssist(level);
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

        const promptArgs = {
            scenario, level, assist, language, nativeLanguage, words, grammar,
            userName: str(user.name, 40).split(' ')[0],
        };
        let engine = engineNow();
        const base = characterFor(scenario.character);
        const asked = str(req.body?.voice, 20);
        const voiceFor = (eng) => ((eng === 'live' ? LIVE_VOICES : REALTIME_VOICES).includes(asked) ? asked : base.voice);
        const character = { ...base, voice: voiceFor(engine) };
        const realtime = () => openRealtime({ sdp, character: { ...base, voice: voiceFor('realtime') }, instructions: buildInstructions(promptArgs), model: planFor(user.tier || 0).model, language, nativeLanguage });
        let opened = engine === 'live'
            ? await openLive({ sdp, character, instructions: buildInstructions({ ...promptArgs, engine }), opener: '(The call just connected. Start the scene now with your opening line.)' })
            : await realtime();
        // If GPT-Live won't open the call, fall back to the Realtime API.
        if (!opened && engine === 'live') { engine = 'realtime'; opened = await realtime(); }
        if (!opened) return res.status(502).json({ success: false, error: `${character.name} could not pick up. Please try again.` });
        const { answer, callId, model } = opened;

        const sessionId = crypto.randomBytes(12).toString('hex');
        await db.collection('speak_sessions').insertOne({
            sessionId, userId: user.userId, engine, callId, scenarioId: scenario.id, character: character.id, level, assist, language, nativeLanguage,
            model, tier: user.tier || 0, maxSeconds, startedAt: new Date(),
            savedWordsUsed: words.length, savedGrammarUsed: grammar.length,
        });
        // Hard stop when the time runs out, even if the tab is gone.
        hangupTimers.set(sessionId, setTimeout(async () => {
            hangupTimers.delete(sessionId);
            const s = await db.collection('speak_sessions').findOne({ sessionId });
            if (s && !s.endedAt) await closeSession(db, s, 'time');
        }, (maxSeconds + 5) * 1000));

        const assistNotes = Object.fromEntries(ASSISTS.map((a) => [a, assistSwitchNote(a, language, nativeLanguage, engine)]));
        res.json({ success: true, sessionId, engine, answer, maxSeconds, leftSeconds: allowance.leftSeconds, tier: user.tier || 0, assist, assistNotes });
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
                    liveSeconds: Number(req.body.usage.seconds) || 0,
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
        const target = nameOf(s.language);
        const native = nameOf(s.nativeLanguage);
        const romanize = NON_LATIN.has(s.language);
        const r = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
            body: JSON.stringify({
                model: TRANSLATE_MODEL,
                temperature: 0,
                max_tokens: 500,
                response_format: { type: 'json_object' },
                messages: [
                    {
                        role: 'system',
                        content: `You caption a ${target} lesson. Reply with JSON: {"translation": the whole line in natural ${native} (translate the ${target} parts, keep ${native} parts as they are)${romanize ? `, "romanization": the ${target} parts only, romanized for a beginner (e.g. Revised Romanization for Korean, Hepburn for Japanese, pinyin with tone marks for Chinese), joined in order, or "" if there are none` : ''}}.`,
                    },
                    { role: 'user', content: text },
                ],
            }),
        });
        const out = await r.json();
        if (!r.ok) throw new Error(out?.error?.message || `HTTP ${r.status}`);
        let parsed = {};
        try { parsed = JSON.parse(out.choices?.[0]?.message?.content || '{}'); } catch { /* empty captions */ }
        res.json({ success: true, translation: str(parsed.translation, 800), romanization: str(parsed.romanization, 800) });
    } catch (e) {
        console.error('speak translate', e.message);
        res.status(500).json({ success: false, error: 'Translation failed' });
    }
};

// POST /api/speak/voice-sample { voice, character, sdp } (admins): a short
// GPT-Live call where the character reads an audition line in that voice, so
// voices can be compared by ear on /speak/voices.
const SAMPLE_LINES = {
    horang: 'Hey hey, welcome to Kkachi Café! 어서 오세요! 뭐 드릴까요? ...An iced americano in winter? Bold. As a tiger, I respect that.',
    sora: 'Hi! I\'m Sora, I just moved to Seoul from the mountains. 서울은 진짜 신기해요! Yesterday I bowed to a vending machine. ...It did not bow back.',
};
const voiceSample = async (req, res) => {
    const voice = str(req.body?.voice, 20);
    const sdp = typeof req.body?.sdp === 'string' ? req.body.sdp : '';
    const base = characterFor(req.body?.character === 'sora' ? 'sora' : 'horang');
    if (!LIVE_VOICES.includes(voice)) return res.status(400).json({ success: false, error: 'Unknown voice' });
    if (!sdp.startsWith('v=0') || sdp.length > 20000) return res.status(400).json({ success: false, error: 'Bad connection offer' });
    const instructions = [
        ...base.who,
        base.sound,
        '',
        'This is a voice audition. As soon as the call connects, perform these lines in character, with energy and natural pacing, then stop and stay silent:',
        SAMPLE_LINES[base.id],
    ].join('\n');
    // Stored so a failed sample's recording can be pulled up by its id.
    const opened = await openLive({ sdp, character: { ...base, voice }, instructions, opener: '(Connected. Perform your audition lines now.)', trusted: true, store: true });
    if (!opened) return res.status(502).json({ success: false, error: 'Could not open the sample' });
    setTimeout(() => hangup(opened.callId, 'live'), 30 * 1000);
    res.json({ success: true, answer: opened.answer, callId: opened.callId, line: SAMPLE_LINES[base.id] });
};

// POST /api/speak/coach { sessionId, transcript }: screen updates for GPT-Live calls.
const coach = async (req, res) => {
    const transcript = cleanTranscript(req.body?.transcript);
    if (!transcript.length) return res.json({ success: true });
    try {
        const db = getDb();
        const s = await db.collection('speak_sessions').findOne(
            { sessionId: String(req.body?.sessionId || ''), userId: req.session.user.userId },
            { projection: { startedAt: 1, scenarioId: 1, assist: 1, nativeLanguage: 1, language: 1 } },
        );
        if (!s || Date.now() - new Date(s.startedAt).getTime() > 2 * 60 * 60 * 1000) {
            return res.status(403).json({ success: false, error: 'No active call' });
        }
        const scenario = findScenario(s.scenarioId);
        const assist = ASSISTS.includes(req.body?.assist) ? req.body.assist : s.assist;
        const out = await coachTurn({ scenario, assist, language: s.language, nativeLanguage: s.nativeLanguage, transcript });
        res.json({ success: true, ...out });
    } catch (e) {
        console.error('speak coach', e.message);
        res.status(500).json({ success: false, error: 'Coach failed' });
    }
};

module.exports = { overview, startSession, endSession, translate, coach, voiceSample, LIVE_VOICES, REALTIME_VOICES };
