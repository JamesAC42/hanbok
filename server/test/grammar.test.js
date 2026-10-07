const test = require('node:test');
const assert = require('node:assert');

const { normalizeForm, extractForm, formKeys } = require('../grammar/forms');
const { validateItems, usesWord } = require('../grammar/quiz');
const { validateLesson } = require('../grammar/lesson');
const { stageFor, limitsFor } = require('../grammar/limits');

const word = (wordId, originalWord) => ({ wordId, originalWord, originalLanguage: 'ko' });
const WORDS = [word(1, '우산'), word(2, '늦다'), word(3, '오다'), word(4, '배고프다')];

test('forms normalize the way the analysis writes them', () => {
    assert.strictEqual(normalizeForm('-(으)니까'), '으니까');
    assert.strictEqual(normalizeForm('~고 싶다'), '고싶다');
    assert.strictEqual(extractForm('Location marker 에', 'ko'), '에');
    assert.strictEqual(extractForm('-고 싶다 (want to)', 'ko'), '-고 싶다');
    assert.deepStrictEqual(formKeys('-으니까/니까').sort(), ['니까', '으니까', '으니까/니까'].sort());
});

test('a saved word counts when it appears or is conjugated', () => {
    assert.ok(usesWord('우산을 가져가세요.', WORDS[0]));
    assert.ok(usesWord('배고프니까 밥을 먹어요.', WORDS[3]));
    assert.ok(usesWord('늦어서 택시를 탔어요.', WORDS[1]));
    // 오다 contracts to 와요: the same opening consonant is enough.
    assert.ok(usesWord('친구가 와요.', WORDS[2]));
    assert.ok(!usesWord('사다가 시미가 사가사 시퍼여여', WORDS[1]));
});

test('quiz questions that fail a check are dropped', () => {
    const items = validateItems([
        { type: 'fill_gap', sentence: '비가 오니까 우산을 가져가세요.', blank: '니까', translation: 'It is raining, so take an umbrella.', options: ['니까', '지만', '는데', '고'], explanation: 'Reason.', word_ids: [1] },
        // Blank missing from the sentence.
        { type: 'fill_gap', sentence: '우산이 없어요.', blank: '니까', translation: 'x', options: ['니까', '지만', '는데', '고'], explanation: '', word_ids: [1] },
        // Two right answers.
        { type: 'meaning', sentence: '우산을 사요.', translation: 'I buy an umbrella.', options: ['I buy an umbrella.', 'I buy an umbrella.', 'a', 'b'], explanation: '', word_ids: [1] },
        // Garbled Hangul with loose jamo.
        { type: 'build', sentence: '사다가 시미가 ᄉ가사 시퍼여여', translation: 'I want to sleep early.', options: [], explanation: '', word_ids: [2] },
        // Uses none of the saved words.
        { type: 'build', sentence: '저는 학교에 가요.', translation: 'I go to school.', options: [], explanation: '', word_ids: [1] },
        { type: 'build', sentence: '늦으니까 택시를 타세요.', translation: 'You are late, so take a taxi.', options: [], explanation: '', word_ids: [2] },
        // Duplicate sentence.
        { type: 'pick_correct', sentence: '늦으니까 택시를 타세요.', translation: 'x', options: ['늦으니까 택시를 타세요.', '늦니까 택시를 타세요.', '늦으니가 택시를 타세요.'], explanation: '', word_ids: [2] },
    ], WORDS);

    assert.deepStrictEqual(items.map((i) => i.type), ['fill_gap', 'build']);
    assert.strictEqual(items[0].before, '비가 오');
    assert.strictEqual(items[0].after, ' 우산을 가져가세요.');
    assert.strictEqual(items[0].answer, '니까');
    assert.deepStrictEqual(items[0].words, ['우산']);
    assert.deepStrictEqual(items[1].tiles, ['늦으니까', '택시를', '타세요.']);
});

test('lessons keep "+" joiners even when the model spells them out', () => {
    const lesson = validateLesson({
        intro: 'Use it to give a reason.',
        formula: [{ text: 'Verb stem' }, { text: 'Plus' }, { text: '(으)니까', grammar: true }],
        formula_note: '',
        examples: [{ sentence: '비가 오니까 우산을 가져가세요.', translation: 'It is raining, so take an umbrella.' }],
    });
    assert.deepStrictEqual(lesson.formula.map((p) => p.text), ['Verb stem', '+', '(으)니까']);
    assert.strictEqual(validateLesson({ intro: '', formula: [], examples: [] }), null);
});

test('stages follow lessons, right answers and the review interval', () => {
    assert.strictEqual(stageFor({}, null), 0);
    assert.strictEqual(stageFor({ lessonDone: true }, { intervalDays: 1 }), 1);
    assert.strictEqual(stageFor({ correct: 3 }, { intervalDays: 2 }), 2);
    assert.strictEqual(stageFor({ correct: 3 }, { intervalDays: 8 }), 3);
    assert.strictEqual(stageFor({}, { intervalDays: 30 }), 4);
});

test('free accounts get the small allowance, paid ones none', () => {
    assert.strictEqual(limitsFor(0).quizQuestionsPerDay, 5);
    assert.strictEqual(limitsFor(0).saves, 20);
    assert.strictEqual(limitsFor(1).quizQuestionsPerDay, Infinity);
});
