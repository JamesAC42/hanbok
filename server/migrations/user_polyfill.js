
const polyfillData = async (user, db) => {
    if (user.maxSavedSentences === undefined) {
        await db.collection('users').updateOne(
            { userId: user.userId },
            { $set: { maxSavedSentences: 30 } }
        );
        user.maxSavedSentences = 30;
    }

    if (user.maxSavedWords === undefined) {
        await db.collection('users').updateOne(
            { userId: user.userId },
            { $set: { maxSavedWords: 60 } }
        );
        user.maxSavedWords = 60;
    }

    if (user.remainingImageExtracts === undefined) {
        await db.collection('users').updateOne(
            { userId: user.userId },
            { $set: { remainingImageExtracts: 20 } }
        );
        user.remainingImageExtracts = 20;
    }

    if (user.remainingSentenceAnalyses === undefined) {
        await db.collection('users').updateOne(
            { userId: user.userId },
            { $set: { remainingSentenceAnalyses: 0 } }
        );
        user.remainingSentenceAnalyses = 0;
    }

    return user;
}

module.exports = polyfillData;