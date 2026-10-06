// Every user has one flashcard deck per learning language. Saved words and
// saved grammar points both land in it, so one Review session covers both.

const LANGUAGE_NAMES = {
    'ko': 'Korean',
    'en': 'English',
    'zh': 'Chinese (Simplified)',
    'zh-TW': 'Chinese (Traditional)',
    'ja': 'Japanese',
    'es': 'Spanish',
    'it': 'Italian',
    'fr': 'French',
    'de': 'German',
    'nl': 'Dutch',
    'ru': 'Russian',
    'tr': 'Turkish',
    'id': 'Indonesian',
    'vi': 'Vietnamese',
    'hi': 'Hindi'
};

const nextId = async (db, name) => {
    const counter = await db.collection('counters').findOneAndUpdate(
        { _id: name },
        { $inc: { seq: 1 } },
        { upsert: true, returnDocument: 'after' }
    );
    return counter.seq;
};

const findOrCreateLanguageDeck = async (db, userId, language) => {
    const existing = await db.collection('flashcard_decks').findOne({ userId, language });
    if (existing) return existing;

    const languageName = LANGUAGE_NAMES[language]
        || language.charAt(0).toUpperCase() + language.slice(1);
    const deck = {
        deckId: await nextId(db, 'deckId'),
        userId,
        name: `${languageName} Words`,
        language,
        description: `Flashcards for ${languageName} words`,
        dateCreated: new Date(),
        lastReviewed: null,
        settings: {
            newCardsPerDay: 20,
            reviewsPerDay: 100,
            learningSteps: [1, 10, 60, 1440] // 1min, 10min, 1hr, 1day
        }
    };
    await db.collection('flashcard_decks').insertOne(deck);
    return deck;
};

module.exports = { findOrCreateLanguageDeck, nextId, LANGUAGE_NAMES };
