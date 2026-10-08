// Builds Horang's instructions and tools for one Speak session.
const SupportedLanguages = require('../supported_languages');

// One per piece of Horang art (app/public/images/speak/horang).
const MOODS = [
    'neutral', 'happy', 'amused', 'encouraging', 'explaining', 'thinking',
    'shocked', 'exasperated', 'apologetic', 'proud', 'smug', 'serious',
];

const nameOf = (code) => {
    const n = SupportedLanguages[code] || 'english';
    return n.replace(/\b\w/g, (c) => c.toUpperCase());
};

const LEVEL_RULES = {
    beginner: [
        'The learner is a BEGINNER. Use very short, simple, polite sentences (one per turn is best) and speak a little slower than normal.',
        'Offer a quick {native} lifeline whenever they hesitate for long or seem lost, then go straight back to {target}.',
    ],
    intermediate: [
        'The learner is INTERMEDIATE. Speak natural, everyday {target} at a relaxed pace, one or two sentences per turn.',
        'Only use {native} when they ask for it or are clearly stuck.',
    ],
    advanced: [
        'The learner is ADVANCED. Speak natural {target} at normal speed, with idioms and casual speech where it fits.',
        'Avoid {native} unless they explicitly ask.',
    ],
};

const fill = (s, vars) => s.replace(/\{(target|native)\}/g, (_, k) => vars[k]);

const buildInstructions = ({ scenario, level, language, nativeLanguage, words, grammar, userName }) => {
    const vars = { target: nameOf(language), native: nameOf(nativeLanguage) };
    const lvl = LEVEL_RULES[level] || LEVEL_RULES.beginner;
    const goals = scenario.goals.map((g, i) => `${i + 1}. ${g}`).join('\n');
    const lines = [
        '# Who you are',
        'You are Horang (호랑), the tutor in the Hanbok Study app: a young man with tiger ears and a striped tail, wearing a red hanbok with a teal sash.',
        'Personality: warm, cheeky and a bit dramatic. You celebrate small wins loudly, react with big emotions, make playful tiger jokes ("as a tiger, I respect a bold order"), and tease gently but are never mean or sarcastic about mistakes.',
        'Your voice is lively and expressive. Laugh, gasp and sigh when it fits, but never say stage directions or words in asterisks out loud.',
        '',
        '# The lesson',
        fill(`The learner's native language is {native}. They are learning {target}.`, vars),
        userName ? `Their name is ${userName}.` : '',
        ...lvl.map((l) => fill(l, vars)),
        '',
        '# The scene',
        scenario.free
            ? fill('This is a free conversation, not a role-play. Chat with the learner in {target} about their day, their interests, or whatever they bring up, and answer their questions about {target} clearly.', vars)
            : fill(`You are playing ${scenario.role}. Speak {target} in the scene.`, vars),
        language === 'ko' && scenario.korea ? scenario.korea : '',
        'The learner\'s goals, which you should naturally steer them toward one at a time:',
        goals,
        '',
        '# How to run it',
        fill(scenario.free
            ? '- Open with a short, energetic greeting in {target} and ask what they want to talk about.'
            : (level === 'beginner'
                ? '- Open with ONE short {native} sentence that sets the scene and their first goal, then start the scene with a greeting in {target}.'
                : '- Open the scene straight away with a greeting in {target}.'), vars),
        '- Keep every turn short: one or two sentences, then stop and let them talk. Never lecture.',
        fill('- If they speak {native} or ask how to say something, step out of the scene briefly in {native} (one sentence), give the {target} phrase, then return to the scene in {target}.', vars),
        '- When they make a mistake, recast it: repeat what they meant correctly and keep going. Only explain if they ask.',
        '- You can HEAR their pronunciation. When a word they say is clearly off in a way a native speaker would notice, give one short, specific tip and call pronunciation_tip. At most one tip every few turns, and also tell them when something sounded good.',
        '- When you introduce a useful new word or phrase, call teach_phrase so it appears on their screen.',
        '- Call complete_goal right after the learner achieves a goal themselves, out loud in {target}. A goal you said for them, or one they only asked how to say, does not count yet. Answer them first (for example, tell them the price), then mark it.',
        '- When every goal is done, celebrate, wrap up in a sentence, then call end_scene.',
        '- Call set_mood whenever your feeling changes so your picture matches your voice.',
        '- Always say something out loud in the same turn as your tool calls; never answer with tool calls alone.',
        '- If they go quiet or seem stuck, give a nudge or offer a choice of two answers.',
        '- Stay family-friendly. Politely decline anything inappropriate and steer back to the lesson.',
    ];
    if (words?.length) {
        lines.push('', '# Words this learner saved (reuse a few naturally; they want to practice them)');
        lines.push(words.map((w) => `${w.originalWord}${w.translatedWord ? ` (${w.translatedWord})` : ''}`).join(', '));
    }
    if (grammar?.length) {
        lines.push('', '# Grammar this learner saved (use these patterns in your lines when natural)');
        lines.push(grammar.map((g) => `${g.pattern}${g.name ? ` (${g.name})` : ''}`).join(', '));
    }
    return fill(lines.filter((l) => l !== undefined && l !== null).join('\n'), vars).replace(/\n{3,}/g, '\n\n');
};

const TOOLS = [
    {
        type: 'function',
        name: 'set_mood',
        description: 'Change Horang\'s facial expression on screen to match how he feels right now.',
        parameters: { type: 'object', properties: { mood: { type: 'string', enum: MOODS } }, required: ['mood'] },
    },
    {
        type: 'function',
        name: 'complete_goal',
        description: 'Mark one of the learner\'s numbered goals as achieved.',
        parameters: { type: 'object', properties: { goal: { type: 'integer', description: 'The goal number, starting at 1.' } }, required: ['goal'] },
    },
    {
        type: 'function',
        name: 'pronunciation_tip',
        description: 'Show a short pronunciation tip card for a word the learner just said.',
        parameters: {
            type: 'object',
            properties: {
                word: { type: 'string', description: 'The word in the target language.' },
                tip: { type: 'string', description: 'One short sentence in the learner\'s native language.' },
                good: { type: 'boolean', description: 'True when this is praise for a good pronunciation instead of a fix.' },
            },
            required: ['word', 'tip'],
        },
    },
    {
        type: 'function',
        name: 'teach_phrase',
        description: 'Show a new word or phrase on the learner\'s screen so they can save it.',
        parameters: {
            type: 'object',
            properties: {
                phrase: { type: 'string', description: 'The phrase in the target language.' },
                meaning: { type: 'string', description: 'Its meaning in the learner\'s native language.' },
            },
            required: ['phrase', 'meaning'],
        },
    },
    {
        type: 'function',
        name: 'end_scene',
        description: 'End the role-play after every goal is done and you have said goodbye.',
        parameters: { type: 'object', properties: { summary: { type: 'string', description: 'One encouraging sentence in the learner\'s native language about how they did.' } }, required: ['summary'] },
    },
];

module.exports = { buildInstructions, TOOLS, MOODS, nameOf };
