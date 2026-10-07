// The shared catalog of grammar points, one entry per point per learning
// language. Every save resolves to an entry here, so the same grammar saved
// from ten different sentences is one point on the learner's path.
const llm = require('./llm');
const SupportedLanguages = require('../supported_languages');
const { nextId } = require('../lib/languageDeck');
const { extractForm, aliasKey, formKeys, normalizeForm } = require('./forms');
const seedKorean = require('./seedKorean');

const SEEDS = { ko: seedKorean };
const MAX_PROMPT_ENTRIES = 150;

let seeded = null;

// Adds the built-in points once per process. Safe to run on every start.
const ensureSeed = (db) => {
    if (!seeded) {
        seeded = (async () => {
            const catalog = db.collection('grammar_catalog');
            for (const [language, entries] of Object.entries(SEEDS)) {
                for (const entry of entries) {
                    const exists = await catalog.findOne({ language, key: entry.key }, { projection: { _id: 1 } });
                    if (exists) continue;
                    await catalog.insertOne({
                        grammarId: await nextId(db, 'grammarId'),
                        language,
                        key: entry.key,
                        form: entry.form,
                        name: entry.name,
                        level: entry.level,
                        formKeys: formKeys(entry.form),
                        aliases: [],
                        saves: 0,
                        seeded: true,
                        dateCreated: new Date(),
                    });
                }
            }
        })().catch((error) => {
            seeded = null;
            console.error('[grammar] seeding the catalog failed:', error);
        });
    }
    return seeded;
};

const CANONICAL_SCHEMA = {
    type: 'object',
    properties: {
        match_id: { type: 'integer', description: 'id of the existing entry that is the same grammar point, or 0 for a new one' },
        form: { type: 'string', description: 'The grammar form written in the learning language, the way textbooks write it' },
        name: { type: 'string', description: 'Short English name, at most 6 words' },
        level: { type: 'integer', description: 'Difficulty 1 (beginner) to 5 (advanced)' },
    },
    required: ['match_id', 'form', 'name', 'level'],
};

const canonicalPrompt = ({ languageName, pattern, explanation, example, entries }) => `You keep a catalog of ${languageName} grammar points for language learners.
A sentence analysis described this grammar point:
- Name: ${pattern}
- Explanation: ${explanation || '(none)'}
- Example: ${example || '(none)'}

Existing catalog entries (id | form | name):
${entries.length ? entries.map((e) => `${e.grammarId} | ${e.form} | ${e.name}`).join('\n') : '(empty)'}

If one existing entry is the same grammar point (same function, not just the same spelling), return its id as match_id.
Otherwise return match_id 0 and describe a new entry:
- form: the grammar form in ${languageName} script, the way textbooks write it (for Korean, e.g. "-(으)니까", "은/는", "-고 싶다"). No English in the form.
- name: a short plain English name a beginner understands, at most 6 words.
- level: 1 (beginner) to 5 (advanced).
Return JSON only.`;

const clampLevel = (level) => Math.min(5, Math.max(1, parseInt(level, 10) || 2));

const addAlias = async (db, entry, alias) => {
    if (!alias || entry.aliases?.includes(alias)) return;
    await db.collection('grammar_catalog').updateOne(
        { grammarId: entry.grammarId },
        { $addToSet: { aliases: alias } }
    );
};

const createEntry = async (db, { language, form, name, level, alias }) => {
    const grammarId = await nextId(db, 'grammarId');
    const slug = normalizeForm(form).replace(/\//g, '-').slice(0, 40) || 'point';
    const entry = {
        grammarId,
        language,
        key: `${language}.${slug}.${grammarId}`,
        form,
        name: String(name || form).slice(0, 80),
        level: clampLevel(level),
        formKeys: formKeys(form),
        aliases: alias ? [alias] : [],
        saves: 0,
        dateCreated: new Date(),
    };
    await db.collection('grammar_catalog').insertOne(entry);
    return entry;
};

// Finds the catalog entry for a grammar point named by an analysis, making a
// new one when nothing matches. Exact wording seen before and an unambiguous
// form match need no model call.
const resolvePoint = async (db, { language, pattern, explanation, example, level }) => {
    await ensureSeed(db);
    const catalog = db.collection('grammar_catalog');
    const alias = aliasKey(pattern);

    const known = await catalog.findOne({ language, aliases: alias });
    if (known) return known;

    const form = extractForm(pattern, language);
    const keys = form ? formKeys(form) : [];
    const candidates = keys.length
        ? await catalog.find({ language, formKeys: { $in: keys } }).limit(8).toArray()
        : [];
    if (candidates.length === 1) {
        await addAlias(db, candidates[0], alias);
        return candidates[0];
    }

    const popular = await catalog.find({ language }, { projection: { grammarId: 1, form: 1, name: 1 } })
        .sort({ saves: -1, grammarId: 1 })
        .limit(MAX_PROMPT_ENTRIES)
        .toArray();
    const entries = [...candidates, ...popular.filter((p) => !candidates.some((c) => c.grammarId === p.grammarId))];

    let choice = null;
    try {
        choice = await llm.callJson(canonicalPrompt({
            languageName: SupportedLanguages[language] || language,
            pattern,
            explanation,
            example,
            entries,
        }), CANONICAL_SCHEMA);
    } catch (error) {
        console.error('[grammar] catalog match failed, using the analysis wording:', error.message);
    }

    if (choice && choice.match_id) {
        const match = entries.find((e) => e.grammarId === choice.match_id);
        if (match) {
            const full = match.aliases ? match : await catalog.findOne({ grammarId: match.grammarId });
            await addAlias(db, full, alias);
            return full;
        }
    }

    const chosenForm = (choice && extractForm(choice.form, language)) || choice?.form || form || pattern;
    // The model may name a form that's already in the catalog.
    const sameForm = await catalog.findOne({ language, 'formKeys.0': normalizeForm(chosenForm) });
    if (sameForm && candidates.length === 0) {
        await addAlias(db, sameForm, alias);
        return sameForm;
    }
    return createEntry(db, {
        language,
        form: String(chosenForm).slice(0, 60),
        name: choice?.name || pattern,
        level: choice?.level || level,
        alias,
    });
};

module.exports = { ensureSeed, resolvePoint, createEntry, canonicalPrompt };
