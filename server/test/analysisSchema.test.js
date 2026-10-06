const { test, describe } = require('node:test');
const assert = require('node:assert/strict');

const { extractTemplate, getAnalysisSchema, restoreMaps } = require('../llm/analysisSchema');

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
