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

// Particles whose kana spelling differs from their pronunciation.
// TTS reads the kana literally (は -> "ha", へ -> "he"), so swap in the
// spoken form when the analysis marks the component as a particle.
const toSpokenJapaneseParticle = (text) => {
  if (text === 'へ') return 'え';
  if (typeof text === 'string' && text.endsWith('は')) {
    // は, では, には, とは, からは, ... -> わ
    return `${text.slice(0, -1)}わ`;
  }
  return text;
};

const isParticleComponent = (component) => (
  /particle/i.test(component?.type || '') || component?.isParticle === true
);

/**
 * Build the text sent to TTS for a Japanese sentence from its component
 * readings, keeping punctuation/spacing from the original text and speaking
 * particles like は/へ as わ/え. Returns null when the components can't be
 * aligned with the original text, so callers can fall back.
 */
const buildJapaneseTtsText = (analysis, originalText) => {
  const components = analysis?.components;
  if (!Array.isArray(components) || components.length === 0 || typeof originalText !== 'string') {
    return null;
  }

  let cursor = 0;
  let output = '';
  let changed = false;

  for (const component of components) {
    const text = component?.text;
    if (typeof text !== 'string' || text.length === 0) {
      return null;
    }
    const index = originalText.indexOf(text, cursor);
    if (index === -1) {
      return null;
    }
    // Keep whatever sits between components (punctuation, spaces).
    output += originalText.slice(cursor, index);

    let spoken = component.reading || text;
    if (isParticleComponent(component)) {
      const particleSpoken = toSpokenJapaneseParticle(spoken);
      if (particleSpoken !== spoken) {
        changed = true;
        spoken = particleSpoken;
      }
    }
    output += spoken;
    cursor = index + text.length;
  }

  // Only override the existing reading when we actually fixed a particle;
  // otherwise keep the previous behaviour exactly.
  if (!changed) {
    return null;
  }

  return output + originalText.slice(cursor);
};

const getJapaneseTextToRead = (analysis, originalText) => (
  buildJapaneseTtsText(analysis, originalText)
    ?? analysis?.sentence?.reading
    ?? originalText
);

const getSentenceTextToRead = (sentence) => (
  sentence?.originalLanguage === 'ja'
    ? getJapaneseTextToRead(sentence?.analysis, sentence?.text)
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
  getJapaneseTextToRead,
  getSentenceTextToRead,
  toSpokenJapaneseParticle,
  hasAudioForVariant,
  refreshSentenceAudioUrls,
  resolveSentenceAudio
};
