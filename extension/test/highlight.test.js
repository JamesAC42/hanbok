// Run with: node --test extension/test/highlight.test.js
const test = require('node:test');
const assert = require('node:assert');
const { buildVocabularyPattern, looksLikeLanguage } = require('../highlight.js');

function matches(words, language, text) {
  const pattern = buildVocabularyPattern(words, language);
  return [...text.matchAll(pattern)].map((m) => m[0]);
}

test('returns null with no words', () => {
  assert.strictEqual(buildVocabularyPattern([], 'ko'), null);
  assert.strictEqual(buildVocabularyPattern(['  '], 'es'), null);
});

test('Korean matches stems with attached particles and endings', () => {
  assert.deepStrictEqual(
    matches(['공부하다', '기다리다', '사람'], 'ko', '저는 공부해요. 사람들은 기다리고 있어요.'),
    ['공부해요', '사람들은', '기다리고']
  );
});

test('Korean one-syllable words only match alone or with a particle', () => {
  assert.deepStrictEqual(matches(['책', '가다'], 'ko', '책을 가방에 넣어요. 책상 가다'), ['책을', '가다']);
});

test('Korean does not match inside another word', () => {
  assert.deepStrictEqual(matches(['사람'], 'ko', '한국사람'), []);
});

test('Japanese and Chinese match anywhere, longest first', () => {
  assert.deepStrictEqual(matches(['日本', '日本語', '猫'], 'ja', '日本語を話す猫'), ['日本語', '猫']);
  assert.deepStrictEqual(matches(['学习'], 'zh', '我喜欢学习中文'), ['学习']);
});

test('spaced languages use Unicode word boundaries', () => {
  assert.deepStrictEqual(matches(['привет', 'мир'], 'ru', 'Привет, мир! мирный'), ['Привет', 'мир']);
  assert.deepStrictEqual(matches(['casa'], 'es', 'La casa, casamiento, CASA.'), ['casa', 'CASA']);
  assert.deepStrictEqual(matches(['नमस्ते'], 'hi', 'नमस्ते दोस्त'), ['नमस्ते']);
});

test('regex special characters in words are escaped', () => {
  assert.deepStrictEqual(matches(['c++', 'a.b'], 'en', 'I like c++ and a.b, not axb'), ['c++', 'a.b']);
});

test('looksLikeLanguage checks the script for non-Latin languages', () => {
  assert.strictEqual(looksLikeLanguage('hello', 'ko'), false);
  assert.strictEqual(looksLikeLanguage('안녕하세요', 'ko'), true);
  assert.strictEqual(looksLikeLanguage('ひらがな', 'ja'), true);
  assert.strictEqual(looksLikeLanguage('hola', 'es'), true);
  assert.strictEqual(looksLikeLanguage('123', 'es'), false);
});

test('findVocabularyWord maps highlighted text back to the saved word', () => {
  const { findVocabularyWord } = require('../highlight.js');
  assert.strictEqual(findVocabularyWord('사람들은', ['사람', '공부하다'], 'ko'), '사람');
  assert.strictEqual(findVocabularyWord('공부해요', ['사람', '공부하다'], 'ko'), '공부하다');
  assert.strictEqual(findVocabularyWord('日本語', ['日本', '日本語'], 'ja'), '日本語');
  assert.strictEqual(findVocabularyWord('Casa', ['casa'], 'es'), 'casa');
  assert.strictEqual(findVocabularyWord('책상', ['책'], 'ko'), null);
});
