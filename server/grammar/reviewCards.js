// Content for grammar cards in a Review session. Each due grammar point
// comes up as one quiz question from the learner's bank while their plan
// allows it, otherwise as a flip card ("What does -(으)니까 mean?").
const { ensureBank, toClientItem, shuffle } = require('./quiz');
const { allowanceFor } = require('./limits');

const attachGrammarContent = async (db, userId, cards) => {
    const grammarCards = cards.filter((c) => c.contentType === 'grammar');
    if (!grammarCards.length) return cards;

    const ids = grammarCards.map((c) => c.contentId);
    const [saved, entries, user] = await Promise.all([
        db.collection('saved_grammar').find({ userId, grammarId: { $in: ids } }).toArray(),
        db.collection('grammar_catalog').find({ grammarId: { $in: ids } }, { projection: { aliases: 0, formKeys: 0 } }).toArray(),
        db.collection('users').findOne({ userId }, { projection: { userId: 1, tier: 1 } }),
    ]);
    const allowance = await allowanceFor(db, user || { userId, tier: 0 });
    let quizLeft = allowance.quizLeftToday === null ? Infinity : allowance.quizLeftToday;

    for (const card of grammarCards) {
        const s = saved.find((x) => x.grammarId === card.contentId);
        const entry = entries.find((x) => x.grammarId === card.contentId);
        if (!s || !entry) continue;

        const source = (s.sources || []).find((src) => src.text) || null;
        const example = source
            ? { text: source.text, translation: source.translation }
            : s.examples?.[0] ? { text: s.examples[0].original, translation: s.examples[0].translation } : null;
        const content = {
            grammarId: entry.grammarId,
            originalLanguage: s.language,
            form: entry.form,
            name: entry.name,
            explanation: s.explanation,
            example,
            mode: 'flip',
        };

        if (quizLeft > 0) {
            const unused = await db.collection('grammar_quiz_items')
                .find({ userId, grammarId: entry.grammarId, usedAt: null })
                .limit(30)
                .toArray();
            const item = shuffle(unused)[0];
            if (item) {
                content.mode = 'quiz';
                content.item = toClientItem(item);
                quizLeft -= 1;
            }
        }
        if (content.mode === 'flip' && allowance.quizLeftToday !== 0) {
            ensureBank(db, s, entry, { wait: false }).catch(() => {});
        }
        content.quizLimited = content.mode === 'flip' && allowance.quizLeftToday === 0;
        card.content = content;
    }
    return cards;
};

module.exports = { attachGrammarContent };
