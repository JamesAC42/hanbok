import test from 'node:test';
import assert from 'node:assert';
import { libraryEndpoint, ankiHref, matchLabel } from '../src/lib/librarySearch.js';

test('builds the search URL without empty params', () => {
    assert.strictEqual(libraryEndpoint({ q: ' 고 싶다 ', page: 2, limit: 10, language: '' }),
        '/api/library/search?q=%EA%B3%A0+%EC%8B%B6%EB%8B%A4&page=2&limit=10');
});

test('Anki link carries the search and language', () => {
    assert.strictEqual(ankiHref(), '/api/library/anki');
    assert.strictEqual(ankiHref({ q: '공부', language: 'ko' }), '/api/library/anki?q=%EA%B3%B5%EB%B6%80&language=ko');
});

test('labels word and grammar matches only', () => {
    assert.strictEqual(matchLabel({ kind: 'grammar', label: '-고 싶다' }), 'Grammar: -고 싶다');
    assert.strictEqual(matchLabel({ kind: 'word', label: '공부하다', meaning: 'to study' }), 'Word: 공부하다 · to study');
    assert.strictEqual(matchLabel({ kind: 'text', label: 'x' }), '');
    assert.strictEqual(matchLabel(null), '');
});
