const test = require('node:test');
const assert = require('node:assert');
const { queryRegex, sentenceMatch, describeMatch, ankiRow, ankiFile } = require('../lib/librarySearch');

const doc = {
    text: '한국어를 더 열심히 공부하고 싶어요.',
    originalLanguage: 'ko',
    analysis: {
        sentence: { translation: 'I want to study Korean harder.' },
        components: [
            { text: '한국어를', dictionary_form: '한국어', type: 'noun', meaning: { description: 'Korean (language)' } },
            { text: '공부하고', dictionary_form: '공부하다', type: 'verb', meaning: { description: 'to study' } },
            { text: '.', dictionary_form: '.', type: 'punctuation' },
        ],
        grammar_points: [{ pattern: '-고 싶다', explanation: 'want to <do>' }],
    },
};

test('query ignores leading dashes and spacing, escapes regex characters', () => {
    const re = queryRegex('-고싶다');
    assert.ok(re.test('-고 싶다') === false, 'no space in query means no space allowed between words');
    assert.ok(queryRegex('고 싶다').test('-고 싶다'));
    assert.ok(queryRegex('고 싶다').test('-고싶다'));
    assert.ok(queryRegex('(으)ㄹ').test('-(으)ㄹ 수 있다'));
    assert.strictEqual(queryRegex('   '), null);
});

test('search is scoped to the user and skips hidden items', () => {
    const m = sentenceMatch(7, '공부', 'ko');
    assert.strictEqual(m.userId, 7);
    assert.strictEqual(m.hiddenAt, null);
    assert.strictEqual(m.originalLanguage, 'ko');
    assert.ok(m.$or.some(c => c['analysis.grammar_points.pattern']));
    assert.strictEqual(sentenceMatch(7, '', 'ko'), null);
});

test('describes why a sentence matched', () => {
    assert.deepStrictEqual(describeMatch(doc, '고 싶다'), { kind: 'grammar', label: '-고 싶다' });
    assert.deepStrictEqual(describeMatch(doc, '공부'), { kind: 'word', label: '공부하다', meaning: 'to study' });
    assert.strictEqual(describeMatch(doc, 'study').kind, 'word');
    assert.strictEqual(describeMatch(doc, 'harder').kind, 'translation');
});

test('Anki notes: sentence front, translation + words + grammar back, escaped', () => {
    const [front, back, tags] = ankiRow(doc).split('\t');
    assert.strictEqual(front, '한국어를 더 열심히 공부하고 싶어요.');
    assert.match(back, /^I want to study Korean harder\.<br><br><b>한국어<\/b> Korean \(language\)<br><b>공부하다<\/b> to study<br><br><b>-고 싶다<\/b> want to &lt;do&gt;$/);
    assert.ok(!back.includes('<b>.</b>'), 'punctuation is skipped');
    assert.strictEqual(tags, 'hanbok ko');
    const file = ankiFile([doc, { text: '' }]);
    assert.ok(file.startsWith('#separator:tab\n#html:true\n#notetype:Basic\n#tags column:3\n'));
    assert.strictEqual(file.trim().split('\n').length, 5);
});
