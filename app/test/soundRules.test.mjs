import { test } from 'node:test';
import assert from 'node:assert/strict';
import { pronounce } from '../src/lib/korean/soundRules.js';

const say = (text, components) => pronounce(text, components).spoken;

test('linking, nasal sounds and tensing from spelling alone', () => {
    const cases = {
        '한국어': '한구거',
        '감사합니다': '감사함니다',
        '있습니다': '읻씀니다',
        '학교': '학꾜',
        '먹다': '먹따',
        '국물': '궁물',
        '읽어요': '일거요',
        '읽고': '일꼬',
        '없어요': '업써요',
        '앉아요': '안자요',
        '좋아요': '조아요',
        '좋다': '조타',
        '많이': '마니',
        '싫어': '시러',
        '놓는': '논는',
        '축하해요': '추카해요',
        '입학': '이팍',
        '같이': '가치',
        '굳이': '구지',
        '신라': '실라',
        '설날': '설랄',
        '심리': '심니',
        '종로': '종노',
        '국립': '궁닙',
        '꽃': '꼳',
        '밖': '박',
        '닫히다': '다치다',
        '안녕하세요': '안녕하세요',
    };
    for (const [written, spoken] of Object.entries(cases)) {
        assert.equal(say(written), spoken, written);
    }
});

test('the example sentence, with grammar from the analysis', () => {
    const components = [
        { text: '한국에', dictionary_form: '한국', type: 'noun' },
        { text: '가기', dictionary_form: '가다', type: 'verb' },
        { text: '전에', dictionary_form: '전', type: 'noun' },
        { text: '한국어를', dictionary_form: '한국어', type: 'noun' },
        { text: '더', dictionary_form: '더', type: 'adverb' },
        { text: '열심히', dictionary_form: '열심히', type: 'adverb' },
        { text: '공부하고', dictionary_form: '공부하다', type: 'verb' },
        { text: '싶어요', dictionary_form: '싶다', type: 'auxiliary_verb' },
    ];
    const result = pronounce('한국에 가기 전에 한국어를 더 열심히 공부하고 싶어요.', components);
    assert.equal(result.spoken, '한구게 가기 저네 한구거를 더 열씸히 공부하고 시퍼요.');
    assert.deepEqual(result.changes.map(c => c.rule), ['linking', 'linking', 'linking', 'tenseSino', 'linking']);
    assert.equal(result.changes[3].written, '열심히');
    assert.equal(result.changes[3].spoken, '열씸히');
});

test('grammar-based tensing: stems in ㄴ/ㅁ and the -(으)ㄹ ending', () => {
    assert.equal(say('신고', [{ text: '신고', dictionary_form: '신다', type: 'verb' }]), '신꼬');
    assert.equal(say('신고'), '신고'); // without grammar we can't tell, so we leave it
    assert.equal(say('갈게요', [{ text: '갈게요', dictionary_form: '가다', type: 'verb' }]), '갈께요');
    assert.equal(
        say('할 수 있어요', [
            { text: '할', dictionary_form: '하다', type: 'verb' },
            { text: '수', dictionary_form: '수', type: 'noun' },
            { text: '있어요', dictionary_form: '있다', type: 'verb' },
        ]),
        '할 쑤 이써요'
    );
    // 알 is part of the stem 알다, so no tensing
    assert.equal(say('알게 됐어요', [{ text: '알게', dictionary_form: '알다', type: 'verb' }, { text: '됐어요', dictionary_form: '되다', type: 'verb' }]), '알게 돼써요');
});

test('leaves non-Korean text alone and reports nothing', () => {
    const r = pronounce('Hello 123!');
    assert.equal(r.spoken, 'Hello 123!');
    assert.equal(r.changes.length, 0);
});
