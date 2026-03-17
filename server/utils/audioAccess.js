const FREE_AUDIO_MAX_CHARACTERS = 50;
const AUDIO_PREMIUM_LENGTH_CODE = 'AUDIO_PREMIUM_LENGTH_REQUIRED';

const isAnonymousOrFreeUser = (user) => !user || user.tier === 0;

const isLongSentenceAudioRestricted = (text = '', user = null) => (
  isAnonymousOrFreeUser(user) && text.length > FREE_AUDIO_MAX_CHARACTERS
);

const buildAudioLengthError = () => ({
  success: false,
  error: `Audio for sentences over ${FREE_AUDIO_MAX_CHARACTERS} characters is a paid feature`,
  code: AUDIO_PREMIUM_LENGTH_CODE,
  maxCharacters: FREE_AUDIO_MAX_CHARACTERS
});

module.exports = {
  AUDIO_PREMIUM_LENGTH_CODE,
  FREE_AUDIO_MAX_CHARACTERS,
  buildAudioLengthError,
  isAnonymousOrFreeUser,
  isLongSentenceAudioRestricted
};
