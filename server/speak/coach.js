// GPT-Live can only talk, so after each of the character's turns a text model
// reads the recent transcript and drives the screen: goal ticks, the
// character's face, "Try saying" and phrase cards, pronunciation tips,
// the end of the scene, and the caption under the last line.
const { characterFor, nameOf } = require('./prompt');

const COACH_MODEL = process.env.SPEAK_COACH_MODEL || 'gpt-4.1';
const NON_LATIN = new Set(['ko', 'ja', 'zh', 'zh-TW', 'ru', 'hi']);

const nullable = (schema) => ({ anyOf: [schema, { type: 'null' }] });
const pair = (a, b) => ({ type: 'object', additionalProperties: false, properties: { [a]: { type: 'string' }, [b]: { type: 'string' } }, required: [a, b] });

const schemaFor = (moods) => ({
    type: 'object',
    additionalProperties: false,
    properties: {
        translation: { type: 'string' },
        romanization: { type: 'string' },
        goals_done: { type: 'array', items: { type: 'integer' } },
        mood: { type: 'string', enum: moods },
        suggestion: nullable(pair('phrase', 'meaning')),
        new_phrase: nullable(pair('phrase', 'meaning')),
        tip: nullable({ type: 'object', additionalProperties: false, properties: { word: { type: 'string' }, tip: { type: 'string' }, good: { type: 'boolean' } }, required: ['word', 'tip', 'good'] }),
        end: nullable({ type: 'object', additionalProperties: false, properties: { summary: { type: 'string' } }, required: ['summary'] }),
    },
    required: ['translation', 'romanization', 'goals_done', 'mood', 'suggestion', 'new_phrase', 'tip', 'end'],
});

const coachPrompt = ({ scenario, assist, language, nativeLanguage }) => {
    const target = nameOf(language);
    const native = nameOf(nativeLanguage);
    const ch = characterFor(scenario.character);
    const romanize = NON_LATIN.has(language);
    return [
        `You run the screen of a ${target} speaking lesson. ${ch.name} (the character) talks with a learner whose native language is ${native}. Read the transcript and reply with JSON about ${ch.name.toUpperCase()}'S LAST LINE (the final "${ch.name}:" line).`,
        `The learner's goals:\n${scenario.goals.map((g, i) => `${i + 1}. ${g}`).join('\n')}`,
        '',
        `- translation: the last line in natural ${native} (translate the ${target} parts, keep ${native} parts as they are).`,
        romanize
            ? `- romanization: only the ${target} parts of the last line, romanized for a beginner (Revised Romanization for Korean, Hepburn for Japanese, pinyin with tone marks for Chinese), or "" if there are none.`
            : '- romanization: always "".',
        '- goals_done: numbers of goals the LEARNER achieved themselves, out loud in the target language, anywhere in the transcript. A goal the character said for them, or one they only asked how to say, does not count. Include goals already done earlier.',
        `- mood: the face that matches how ${ch.name} sounds in the last line.`,
        assist === 'immersion'
            ? '- suggestion: null, unless the last line tells the learner exactly what to say; then that phrase and its meaning.'
            : `- suggestion: the exact ${target} phrase the learner could say next and its ${native} meaning. Use the phrase ${ch.name} just told them to say if there is one${assist === 'guided' ? '; otherwise suggest a short, natural reply that moves toward the next unfinished goal' : '; otherwise null'}. Use null when the scene is ending.`,
        `- new_phrase: a useful ${target} word or phrase the last line taught or explained, with its ${native} meaning, or null.`,
        `- tip: if the last line gives pronunciation feedback, the ${target} word and a one-sentence tip in ${native} (good: true when it is praise), else null.`,
        `- end: when every goal is done and ${ch.name} has said goodbye, {"summary": one encouraging sentence in ${native} about how the learner did}; else null.`,
    ].join('\n');
};

// transcript: [{ who: 'horang' | 'you', text }], oldest first.
const coachTurn = async ({ scenario, assist, language, nativeLanguage, transcript }) => {
    const ch = characterFor(scenario.character);
    const lines = transcript.slice(-16).map((m) => `${m.who === 'you' ? 'Learner' : ch.name}: ${m.text}`).join('\n');
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: COACH_MODEL,
            temperature: 0,
            max_tokens: 600,
            response_format: { type: 'json_schema', json_schema: { name: 'screen', strict: true, schema: schemaFor(ch.moods) } },
            messages: [
                { role: 'system', content: coachPrompt({ scenario, assist, language, nativeLanguage }) },
                { role: 'user', content: lines || '(nothing yet)' },
            ],
        }),
    });
    const out = await r.json();
    if (!r.ok) throw new Error(out?.error?.message || `HTTP ${r.status}`);
    const parsed = JSON.parse(out.choices?.[0]?.message?.content || '{}');
    parsed.goals_done = (parsed.goals_done || []).filter((g) => Number.isInteger(g) && g >= 1 && g <= scenario.goals.length);
    return parsed;
};

// After the call: the grammar worth saving, a fix or two for the learner's own
// lines, and their best line, for the results screen.
const recapSchema = {
    type: 'object',
    additionalProperties: false,
    properties: {
        grammar: {
            type: 'array',
            items: {
                type: 'object',
                additionalProperties: false,
                properties: {
                    pattern: { type: 'string' },
                    name: { type: 'string' },
                    explanation: { type: 'string' },
                    level: { type: 'integer' },
                    example: pair('original', 'translation'),
                },
                required: ['pattern', 'name', 'explanation', 'level', 'example'],
            },
        },
        fixes: {
            type: 'array',
            items: { type: 'object', additionalProperties: false, properties: { said: { type: 'string' }, better: { type: 'string' }, why: { type: 'string' } }, required: ['said', 'better', 'why'] },
        },
        best: nullable(pair('text', 'translation')),
        well: { type: 'array', items: { type: 'string' } },
        improve: { type: 'array', items: { type: 'string' } },
        pronunciation: { type: 'array', items: pair('word', 'tip') },
    },
    required: ['well', 'improve', 'pronunciation', 'grammar', 'fixes', 'best'],
};

const recapPrompt = ({ scenario, language, nativeLanguage, level, goals, tips }) => {
    const target = nameOf(language);
    const native = nameOf(nativeLanguage);
    return [
        `A ${level || 'beginner'} ${target} learner (native language ${native}) just finished a spoken role-play: "${scenario.title}". Read the transcript and reply with JSON for their results screen. Write every explanation in ${native}.`,
        goals?.length ? `Scene goals: ${goals.map((g) => `${g.text} (${g.done ? 'done' : 'not done'})`).join('; ')}.` : '',
        tips?.length ? `Pronunciation feedback given during the call: ${tips.map((t) => `${t.word}: ${t.text}`).join('; ')}.` : '',
        `- well: 2 or 3 short, specific notes (one sentence each) on what the learner did well, citing what they actually said. Warm but honest.`,
        `- improve: 1 to 3 short, specific, doable notes on what to work on next (a goal they skipped, leaning on ${native}, very short answers, a recurring mistake). Never about spelling or spacing.`,
        `- pronunciation: up to 3 {word, tip}: first the feedback given during the call (rewrite it as a clear ${native} tip), then only words where the transcript plainly shows the learner was misheard (a near-miss of the word they clearly meant; say what it came through as). [] if there is nothing real.`,
        `- grammar: 2 or 3 ${target} grammar patterns that actually appear in the transcript and are worth studying at this level (endings, particles, connectors, set constructions; not single vocabulary words). pattern is the pattern as a textbook writes it (for Korean e.g. "-(으)세요", "-고 싶다", "이/가"). name is a short ${native} name for it. explanation is one or two plain sentences on what it does. level is 1 (first weeks) to 5 (advanced). example.original is a line from the transcript in which that exact pattern appears (check the ending is really there; if no line has it, pick a different pattern; prefer the character's lines and fix spacing), and example.translation is its ${native} meaning.`,
        'The learner\'s lines are speech-to-text, so their spacing, punctuation and spelling mean nothing: never comment on them, and fix spacing when you quote a line.',
        `- fixes: up to 2 of the LEARNER's own lines with a real spoken mistake (wrong ending, particle, word or word order) or that a native speaker would say differently. said is what they said, better is a natural ${target} way to say it, why is one short ${native} sentence. Use [] if their lines were fine; never invent a mistake.`,
        `- best: the learner's best ${target} line (copied exactly) and its ${native} meaning, or null if they never spoke ${target}.`,
    ].join('\n');
};

const bare = (t) => String(t || '').replace(/[\s.,!?~'"…·]/g, '');

const recapCall = async ({ scenario, language, nativeLanguage, level, transcript, goals, tips }) => {
    const ch = characterFor(scenario.character);
    const lines = transcript.slice(-60).map((m) => `${m.who === 'you' ? 'Learner' : ch.name}: ${m.text}`).join('\n');
    const r = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${process.env.OPENAI_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
            model: COACH_MODEL,
            temperature: 0.2,
            max_tokens: 1200,
            response_format: { type: 'json_schema', json_schema: { name: 'recap', strict: true, schema: recapSchema } },
            messages: [
                { role: 'system', content: recapPrompt({ scenario, language, nativeLanguage, level, goals, tips }).replace(/\n\n+/g, '\n') },
                { role: 'user', content: lines },
            ],
        }),
    });
    const out = await r.json();
    if (!r.ok) throw new Error(out?.error?.message || `HTTP ${r.status}`);
    const parsed = JSON.parse(out.choices?.[0]?.message?.content || '{}');
    return {
        grammar: (parsed.grammar || []).slice(0, 3).map((g) => ({ ...g, level: Math.min(5, Math.max(1, g.level || 2)) })),
        // A "fix" that only moves spaces or punctuation is a transcription artifact.
        fixes: (parsed.fixes || []).filter((f) => bare(f.said) !== bare(f.better)).slice(0, 2),
        best: parsed.best || null,
        well: (parsed.well || []).slice(0, 3),
        improve: (parsed.improve || []).slice(0, 3),
        pronunciation: (parsed.pronunciation || []).slice(0, 3),
    };
};

module.exports = { coachTurn, coachPrompt, recapCall, COACH_MODEL };
