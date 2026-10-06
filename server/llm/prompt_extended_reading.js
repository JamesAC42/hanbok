const SupportedLanguages = require('../supported_languages');
const { chineseScriptRule, isChinese } = require('./chineseScript');

// The reading pass for extended text: one call per chunk of consecutive
// sentences. It returns just what the reader needs on screen (translation,
// word glosses, grammar tags). The full sentence breakdown is the regular
// sentence analysis, run later or when the learner opens a sentence.
const READING_PROMPT = (originalLanguage = 'ko', translationLanguage = 'en') => {
    const source = SupportedLanguages[originalLanguage];
    const target = SupportedLanguages[translationLanguage];
    const segmentRule = originalLanguage === 'ja'
        ? '  Split Japanese into words a learner would look up: keep a verb or adjective together with its whole conjugated ending and auxiliaries (撮りながら, 来てよかった, 混んでいました are one word each); particles such as は, を, が, に, と are separate words.\n'
        : isChinese(originalLanguage)
            ? '  Split Chinese into dictionary words (often two characters), not single characters, unless the character is a word on its own.\n'
            : originalLanguage === 'ko'
                ? '  For Korean, a word is usually one space-separated unit with its particles and endings attached (고향에, 걸리지만).\n'
                : '';
    const readingRule = originalLanguage === 'ja'
        ? '  - "reading": hiragana reading of the word as pronounced here.\n'
        : isChinese(originalLanguage)
            ? '  - "reading": pinyin with tone marks.\n'
            : '';
    return `${chineseScriptRule(originalLanguage, translationLanguage)}You help a learner read a ${source} text. Below are numbered sentences from it. For EVERY numbered sentence, in order, return:
- "n": the sentence number.
- "translation": a natural ${target} translation that fits the surrounding text.
- "words": every word of the sentence in order, skipping punctuation. Each word's "text" is copied exactly from the sentence, INCLUDING attached particles and endings, so joining the texts in order (ignoring spaces and punctuation) reproduces the sentence.
${segmentRule}  Each word has:
  - "text"
  - "base": dictionary form in ${source}.
${readingRule}  - "meaning": a short ${target} gloss of the word as used here (1-4 words).
  - "pos": one of noun, verb, adjective, adverb, pronoun, particle, determiner, numeral, conjunction, interjection, expression.
- "grammar": the grammar patterns a learner should notice in this sentence (0-3). Each has:
  - "pattern": the standard textbook name of the pattern written in ${source} with a leading dash for endings (for example ${originalLanguage === 'ko' ? '"-아서/어서", "-(으)면서", "-기 시작하다"' : originalLanguage === 'ja' ? '"〜ながら", "〜てしまう"' : '"the usual textbook name"'}). Use the same name every time the same pattern appears.
  - "text": the exact part of the sentence where it appears.
  - "meaning": what it means, in ${target}, in a few words.
  - "level": difficulty 1 (beginner) to 5 (advanced).

Keep glosses short. Do not explain beyond the fields above.

Sentences:
`;
};

module.exports = { READING_PROMPT };
