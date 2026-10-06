const SupportedLanguages = require('../supported_languages');
const { chineseScriptRule } = require('./chineseScript');

// Name of the usual proficiency scale, written the way learners know it.
const LEVEL_SCALES = {
    ko: 'TOPIK level, written like "TOPIK 3" (1-6)',
    ja: 'JLPT level, written like "JLPT N3" (N5-N1)',
    zh: 'HSK level, written like "HSK 4" (1-6)',
    'zh-TW': 'HSK level, written like "HSK 4" (1-6)'
};

// Overview of a whole passage: what it says, how hard it is, which grammar
// patterns run through it (with the sentence numbers where they appear), key
// words, sections for navigating long texts, and a short comprehension quiz.
// The passage is sent as numbered sentences grouped into paragraphs, so the
// sentence numbers line up with the reader.
const EXTENDED_TEXT_ANALYSIS_PROMPT = (originalLanguage = 'ko', translationLanguage = 'en') => {
    const source = SupportedLanguages[originalLanguage];
    const target = SupportedLanguages[translationLanguage];
    const scale = LEVEL_SCALES[originalLanguage] || 'CEFR level, written like "CEFR B1" (A1-C2)';
    return `${chineseScriptRule(originalLanguage, translationLanguage)}You are a ${source} teacher writing study notes, in ${target}, for a learner about to read the ${source} passage below. The passage is given as numbered sentences; a blank line separates paragraphs.

Return JSON with:
- "summary": 2-3 sentences in ${target} saying what the passage is about.
- "level": how hard the passage is for a learner: "label" (beginner, intermediate or advanced, in ${target}), "scale" (the closest ${scale}), and "reason" (one short ${target} sentence).
- "tone": the tone in a few ${target} words (for example "casual diary", "formal news").
- "structure": the kind of text and how it is organized, one ${target} sentence.
- "themes": 2-4 short ${target} phrases.
- "sections": split the passage into 1-8 consecutive sections a reader could jump between. Each has "firstSentence" (number), "title" (2-5 ${target} words) and "summary" (one ${target} sentence). Short passages get one section.
- "keyGrammarPatterns": the 2-6 grammar patterns most worth learning from this passage. Each has "pattern" (the standard textbook name written in ${source}, with a leading dash for endings), "meaning" (a few ${target} words), "description" (1-2 ${target} sentences on how it works here), and "sentences" (the numbers of every sentence that uses it).
- "keyVocabulary": 5-12 words worth learning, in order of usefulness. Each has "word" (dictionary form in ${source}), "meaning" (short ${target} gloss) and "sentence" (number of a sentence that uses it).
- "culturalContext": background a learner needs to understand the passage, 1-3 ${target} sentences, or an empty string if none is needed.
- "quiz": 3-5 multiple choice questions in ${target} that check the learner understood the passage (not grammar trivia). Each has "question", "options" (exactly 4 short ${target} answers), "answer" (the 0-based index of the correct option), "explanation" (one ${target} sentence) and "sentence" (number of the sentence that holds the answer).

Passage:
`;
};

module.exports = {
    EXTENDED_TEXT_ANALYSIS_PROMPT
};
