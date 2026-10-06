const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { extractTemplate, getAnalysisSchema, restoreMaps, hasRepetitionLoop } = require('../llm/analysisSchema');

const PROMPTS = [
    ['ko', require('../llm/prompt').ANALYSIS_PROMPT, ['analysis', 'variants']],
    ['ja', require('../llm/prompt_japanese').ANALYSIS_PROMPT, ['analysis', 'politeness_variants']],
    ['zh', require('../llm/prompt_chinese').ANALYSIS_PROMPT, ['analysis', 'register_variants']],
    ['ru', require('../llm/prompt_russian').ANALYSIS_PROMPT, ['analysis', 'register_variants']],
    ['id', require('../llm/prompt_indonesian').ANALYSIS_PROMPT, ['analysis', 'politeness_variants']],
    ['vi', require('../llm/prompt_vietnamese').ANALYSIS_PROMPT, ['analysis', 'politeness_variants']],
    ['hi', require('../llm/prompt_hindi').ANALYSIS_PROMPT, ['analysis', 'politeness_variants']],
];

describe('getAnalysisSchema', () => {
    for (const [lang, promptFactory, mapPath] of PROMPTS) {
        test(`builds a schema from the ${lang} analysis prompt`, () => {
            const result = getAnalysisSchema(promptFactory(lang, 'en') + 'sample text');
            assert.ok(result, 'expected a schema');
            assert.deepEqual(result.mapPaths, [mapPath]);

            const analysis = result.schema.properties.analysis;
            assert.deepEqual(analysis.required, ['sentence', 'components', 'grammar_points']);

            const sentence = analysis.properties.sentence;
            assert.equal(Object.keys(sentence.properties)[0], 'translation');

            const component = analysis.properties.components.items;
            assert.ok(component.required.includes('text'));
            assert.ok(component.required.includes('dictionary_form'));
            assert.match(component.properties.text.description, /INCLUDING any particles/);

            const variants = analysis.properties[mapPath[1]];
            assert.equal(variants.type, 'array');
            assert.ok(variants.items.properties.label);
            assert.ok(variants.items.properties.text);
        });
    }

    test('requires readings for Japanese and Chinese components', () => {
        for (const [lang, factory] of [['ja', PROMPTS[1][1]], ['zh', PROMPTS[2][1]]]) {
            const component = getAnalysisSchema(factory(lang, 'en')).schema.properties.analysis.properties.components.items;
            assert.ok(component.required.includes('reading'), lang);
        }
    });

    test('returns null when the prompt has no template', () => {
        assert.equal(getAnalysisSchema('Translate this: 안녕'), null);
        assert.equal(extractTemplate('For valid input: not json'), null);
    });
});

describe('restoreMaps', () => {
    test('turns labelled arrays back into objects', () => {
        const parsed = {
            isValid: true,
            analysis: {
                variants: [
                    { label: 'casual', text: '밥 먹었어?', when_to_use: 'friends' },
                    { label: 'polite', text: '밥 먹었어요?', when_to_use: 'strangers' }
                ]
            }
        };
        restoreMaps(parsed, [['analysis', 'variants']]);
        assert.deepEqual(parsed.analysis.variants, {
            casual: { text: '밥 먹었어?', when_to_use: 'friends' },
            polite: { text: '밥 먹었어요?', when_to_use: 'strangers' }
        });
    });

    test('leaves invalid responses and objects alone', () => {
        const invalid = { isValid: false, error: { type: 'nonsensical', message: 'x' } };
        assert.deepEqual(restoreMaps(structuredClone(invalid), [['analysis', 'variants']]), invalid);

        const already = { analysis: { variants: { casual: { text: 'a' } } } };
        assert.deepEqual(restoreMaps(structuredClone(already), [['analysis', 'variants']]), already);
    });
});

describe('output limits', () => {
    const { schema } = getAnalysisSchema(require('../llm/prompt').ANALYSIS_PROMPT('ko', 'en') + 'sample');
    const analysis = schema.properties.analysis;

    test('caps every string so a looping model stops', () => {
        const walk = (node, path) => {
            if (node.type === 'string') assert.ok(node.maxLength > 0, `${path} has no maxLength`);
            if (node.items) walk(node.items, `${path}[]`);
            for (const [key, child] of Object.entries(node.properties || {})) walk(child, `${path}.${key}`);
        };
        walk(schema, 'root');
    });

    test('caps only top-level lists, which Gemini accepts', () => {
        assert.equal(analysis.properties.grammar_points.maxItems, 10);
        assert.equal(analysis.properties.variants.maxItems, 8);
        assert.equal(analysis.properties.components.maxItems, undefined);
        assert.equal(analysis.properties.grammar_points.items.properties.examples.maxItems, undefined);
    });

    test('keeps grammar examples short', () => {
        const example = analysis.properties.grammar_points.items.properties.examples.items;
        assert.equal(example.properties.original.maxLength, 600);
    });
});

describe('hasRepetitionLoop', () => {
    test('flags a field that repeats the same sentence', () => {
        const looped = Array(20).fill('저는 학생이에요.').join(' ');
        assert.equal(hasRepetitionLoop({ analysis: { grammar_points: [{ examples: [{ original: looped }] }] } }), true);
    });

    test('accepts normal analysis text', () => {
        const normal = {
            analysis: {
                sentence: { translation: 'I am a student.', original: '저는 학생이에요.' },
                grammar_points: [{
                    explanation: 'The topic particle 는 marks what the sentence is about. It follows a vowel. After a consonant, use 은 instead.',
                    examples: [{ original: '저는 학생이에요.' }, { original: '저는 선생님이에요.' }]
                }]
            }
        };
        assert.equal(hasRepetitionLoop(normal), false);
    });
});
