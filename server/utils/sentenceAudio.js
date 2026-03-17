const { getPresignedUrl } = require('../elevenlabs/generateSpeech');

const getAudioFieldNames = (variant = 'normal') => (
  variant === 'slow'
    ? { voice1: 'voice1SlowKey', voice2: 'voice2SlowKey' }
    : { voice1: 'voice1Key', voice2: 'voice2Key' }
);

const hasAudioForVariant = (sentence, variant = 'normal') => {
  if (!sentence) return false;
  const fields = getAudioFieldNames(variant);
  return !!(sentence[fields.voice1] && sentence[fields.voice2]);
};

const getSentenceTextToRead = (sentence) => (
  sentence?.originalLanguage === 'ja'
    ? sentence?.analysis?.sentence?.reading ?? sentence?.text
    : sentence?.text
);

const refreshSentenceAudioUrls = async (db, sentence, variant = 'normal') => {
  const fields = getAudioFieldNames(variant);
  const voice1Ref = sentence?.[fields.voice1];
  const voice2Ref = sentence?.[fields.voice2];

  if (!voice1Ref || !voice2Ref) {
    return null;
  }

  const [voice1, voice2] = await Promise.all([
    getPresignedUrl(voice1Ref),
    getPresignedUrl(voice2Ref)
  ]);

  await db.collection('sentences').updateOne(
    { sentenceId: sentence.sentenceId },
    {
      $set: {
        [fields.voice1]: voice1,
        [fields.voice2]: voice2,
        ...(variant === 'normal' ? { dateAudioGenerated: new Date() } : {})
      }
    }
  );

  return { voice1, voice2 };
};

const clearSentenceAudioVariant = async (db, sentenceId, variant = 'normal') => {
  const fields = getAudioFieldNames(variant);
  await db.collection('sentences').updateOne(
    { sentenceId },
    {
      $set: {
        [fields.voice1]: null,
        [fields.voice2]: null,
        ...(variant === 'normal' ? { dateAudioGenerated: null } : {})
      }
    }
  );
};

const findMatchingSentenceWithAudio = async (db, sentence, variant = 'normal') => {
  const fields = getAudioFieldNames(variant);

  return db.collection('sentences').findOne({
    sentenceId: { $ne: sentence.sentenceId },
    text: sentence.text,
    originalLanguage: sentence.originalLanguage,
    translationLanguage: sentence.translationLanguage,
    [fields.voice1]: { $ne: null },
    [fields.voice2]: { $ne: null }
  });
};

const copySentenceAudioFromSource = async (db, targetSentenceId, sourceSentence, variant = 'normal') => {
  const fields = getAudioFieldNames(variant);
  const update = {
    [fields.voice1]: sourceSentence[fields.voice1],
    [fields.voice2]: sourceSentence[fields.voice2]
  };

  if (variant === 'normal' && sourceSentence.dateAudioGenerated) {
    update.dateAudioGenerated = sourceSentence.dateAudioGenerated;
  }

  await db.collection('sentences').updateOne(
    { sentenceId: targetSentenceId },
    { $set: update }
  );
};

const resolveSentenceAudio = async (db, sentence, variant = 'normal') => {
  if (!sentence) {
    return null;
  }

  if (hasAudioForVariant(sentence, variant)) {
    try {
      const refreshed = await refreshSentenceAudioUrls(db, sentence, variant);
      if (refreshed) {
        return refreshed;
      }
    } catch (error) {
      console.error(`Error refreshing ${variant} audio for sentence ${sentence.sentenceId}:`, error);
      await clearSentenceAudioVariant(db, sentence.sentenceId, variant);
    }
  }

  const matchingSentence = await findMatchingSentenceWithAudio(db, sentence, variant);
  if (!matchingSentence) {
    return null;
  }

  try {
    const refreshedMatch = await refreshSentenceAudioUrls(db, matchingSentence, variant);
    if (!refreshedMatch) {
      return null;
    }

    const fields = getAudioFieldNames(variant);
    const sourceWithFreshUrls = {
      ...matchingSentence,
      [fields.voice1]: refreshedMatch.voice1,
      [fields.voice2]: refreshedMatch.voice2
    };

    await copySentenceAudioFromSource(db, sentence.sentenceId, sourceWithFreshUrls, variant);
    return refreshedMatch;
  } catch (error) {
    console.error(`Error reusing ${variant} audio from sentence ${matchingSentence.sentenceId}:`, error);
    await clearSentenceAudioVariant(db, matchingSentence.sentenceId, variant);
    return null;
  }
};

module.exports = {
  clearSentenceAudioVariant,
  copySentenceAudioFromSource,
  findMatchingSentenceWithAudio,
  getSentenceTextToRead,
  hasAudioForVariant,
  refreshSentenceAudioUrls,
  resolveSentenceAudio
};
