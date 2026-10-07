// Finds the sentence a saved word came from, so flashcards can show it.
// Words saved since sentenceId was recorded point at it directly; older words
// fall back to the user's most recent sentence containing that word.

const PROJECTION = {
    sentenceId: 1,
    publicId: 1,
    text: 1,
    originalLanguage: 1,
    'analysis.sentence.translation': 1,
    'analysis.components.text': 1,
    'analysis.components.dictionary_form': 1,
};

// The form of the word as it appears in the sentence (e.g. 공부하고 for 공부하다).
const surfaceForm = (sentence, dictionaryForm) => {
    const components = sentence?.analysis?.components || [];
    const match = components.find(c => c.dictionary_form === dictionaryForm);
    return match?.text || null;
};

const toSource = (sentence, word) => sentence ? {
    sentenceId: sentence.sentenceId,
    ...(sentence.publicId ? { publicId: sentence.publicId } : {}),
    text: sentence.text,
    translation: sentence.analysis?.sentence?.translation || null,
    surface: surfaceForm(sentence, word.originalWord),
} : null;

const findSourceSentence = async (db, userId, word) => {
    if (!word?.originalWord) return null;
    const sentences = db.collection('sentences');

    if (word.sentenceId) {
        const linked = await sentences.findOne({ sentenceId: word.sentenceId }, { projection: PROJECTION });
        if (linked) return toSource(linked, word);
    }

    const query = { userId, 'analysis.components.dictionary_form': word.originalWord };
    if (word.originalLanguage) query.originalLanguage = word.originalLanguage;
    const [latest] = await sentences
        .find(query, { projection: PROJECTION })
        .sort({ dateCreated: -1 })
        .limit(1)
        .toArray();
    return toSource(latest, word);
};

module.exports = { findSourceSentence, surfaceForm };
