const test = require('node:test');
const assert = require('node:assert');
const { grammarKeys, wordsOf, fitVerdict, computeEncounters } = require('../lib/encounters');

const s = (sentenceId, text, words, patterns) => ({
    sentenceId, publicId: `p${sentenceId}`, text,
    analysis: {
        components: words.map(w => ({ dictionary_form: w, type: 'noun' })),
        grammar_points: patterns.map(pattern => ({ pattern })),
    },
});

test('grammar names match on their Korean form, not the English wording', () => {
    const a = grammarKeys('-고 싶다 (want to)', 'ko');
    const b = grammarKeys('Wanting: -고 싶어하다', 'ko');
    const c = grammarKeys('-고 싶다', 'ko');
    assert.ok(a.some(k => c.includes(k)));
    assert.ok(!a.some(k => b.includes(k)));
    assert.deepStrictEqual(grammarKeys('Subjunctive mood', 'es'), ['subjunctive mood']);
});

test('words skip punctuation and duplicates', () => {
    const analysis = { components: [
        { dictionary_form: '학교', type: 'noun' }, { dictionary_form: '학교', type: 'noun' },
        { dictionary_form: '.', type: 'punctuation' }, { dictionary_form: '가다', type: 'action_verb' },
    ] };
    assert.deepStrictEqual(wordsOf(analysis), ['학교', '가다']);
});

test('fit verdicts', () => {
    assert.strictEqual(fitVerdict(0, 0, 6), 'review');
    assert.strictEqual(fitVerdict(2, 1, 6), 'just_right');
    assert.strictEqual(fitVerdict(5, 1, 6), 'stretch');
    assert.strictEqual(fitVerdict(3, 1, 4), 'stretch');
    assert.strictEqual(fitVerdict(0, 0, 0), null);
});

test('counts encounters in other sentences and finds the latest one', () => {
    const current = s(10, '학교에 가고 싶어요.', ['학교', '가다', '공항'], ['-고 싶다 (want to)', '-에 (to a place)']);
    const history = [
        current, // the sentence itself never counts
        s(9, '집에 가고 싶어.', ['집', '가다'], ['-고 싶다']),
        s(8, '학교에 갔어요.', ['학교', '가다'], ['-았/었어요 (past)']),
        s(7, '영화 보고 싶었어.', ['영화', '보다'], ['-고 싶다 (want)']),
        s(6, 'a', ['물'], []), s(5, 'b', ['물'], []), s(4, 'c', ['물'], []),
    ];
    const r = computeEncounters(current, history, 'ko');
    assert.deepStrictEqual(r.words, [{ form: '학교', count: 1 }, { form: '가다', count: 2 }, { form: '공항', count: 0 }]);
    assert.strictEqual(r.grammar[0].count, 2);
    assert.deepStrictEqual(r.grammar[0].last, { sentenceId: 9, publicId: 'p9', text: '집에 가고 싶어.' });
    assert.strictEqual(r.grammar[1].count, 0);
    assert.strictEqual(r.grammar[1].last, null);
    assert.deepStrictEqual(r.fit, { newWords: ['공항'], newGrammar: 1, totalWords: 3, verdict: 'just_right' });
    assert.strictEqual(r.historySize, 6);
});

test('no fit verdict until there is some history', () => {
    const current = s(2, 'x', ['학교'], []);
    const r = computeEncounters(current, [s(1, 'y', ['학교'], [])], 'ko');
    assert.strictEqual(r.fit, null);
    assert.strictEqual(r.words[0].count, 1);
});
