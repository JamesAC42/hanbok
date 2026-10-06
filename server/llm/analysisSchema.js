// Builds a JSON schema for sentence analysis from the JSON template that each
// ANALYSIS_PROMPT already contains ("For valid input: { ... }"), so Gemini is
// forced to return exactly the shape the prompt describes and the UI expects.
//
// Templates use objects with placeholder keys such as
// "[single word for formality level ...]" for maps (variants). A schema can't
// express free-form keys, so those become arrays of { label, ...fields } in the
// schema and are turned back into objects by restoreMaps() after parsing.

const TEMPLATE_MARKER = 'For valid input:';

// Fields that must be present when the template has them. Everything else
// stays optional, matching the prompts' "omit fields that aren't applicable".
const REQUIRED = {
    analysis: ['sentence', 'components', 'grammar_points'],
    sentence: ['translation', 'original'],
    components: ['text', 'dictionary_form', 'reading', 'transliteration', 'type', 'meaning']
};

const COMPONENT_TEXT_RULE = 'Exact text of this word as it appears in the input, INCLUDING any particles or endings attached to it. Concatenating every component\'s text in order (ignoring spaces and punctuation) must reproduce the input exactly.';

const extractTemplate = (promptText) => {
    if (typeof promptText !== 'string') return null;
    const markerIndex = promptText.indexOf(TEMPLATE_MARKER);
    if (markerIndex === -1) return null;
    const start = promptText.indexOf('{', markerIndex);
    if (start === -1) return null;

    let depth = 0;
    let end = -1;
    for (let i = start; i < promptText.length; i++) {
        const ch = promptText[i];
        if (ch === '{') depth++;
        else if (ch === '}') {
            depth--;
            if (depth === 0) {
                end = i;
                break;
            }
        }
    }
    if (end === -1) return null;

    const cleaned = promptText
        .slice(start, end + 1)
        .split('\n')
        .filter((line) => line.trim() !== '...')
        .join('\n')
        // Conditional template fields can leave trailing commas behind.
        .replace(/,(\s*[}\]])/g, '$1');

    try {
        return JSON.parse(cleaned);
    } catch (error) {
        return null;
    }
};

const isMapTemplate = (node) => {
    const keys = Object.keys(node);
    return keys.length > 0 && keys.every((key) => key.trim().startsWith('['));
};

// Length limits are enforced by Gemini while it generates, so a model stuck
// repeating itself stops at the limit instead of writing thousands of
// characters into one field (and billing for them).
const SHORT_STRING_KEYS = new Set([
    'text', 'dictionary_form', 'reading', 'transliteration', 'type', 'type_translated',
    'original', 'translation', 'label', 'particle', 'step', 'pattern', 'formality',
    'tense', 'importance', 'role'
]);
const SHORT_STRING_MAX = 600;
const LONG_STRING_MAX = 2000;
// Only top-level arrays get maxItems: Gemini rejects the schema ("invalid
// argument") when components or nested arrays carry it too. Components follow
// the input's length, and nested arrays are bounded by maxOutputTokens.
const TOP_LEVEL_MAX_ITEMS = { grammar_points: 10, variants: 8, cultural_notes: 6 };
const maxItemsFor = (key, path) => (path.length === 2 ? TOP_LEVEL_MAX_ITEMS[key] : undefined);

const stringSchema = (description, key) => {
    const schema = { type: 'string' };
    if (description) schema.description = description;
    schema.maxLength = SHORT_STRING_KEYS.has(key) ? SHORT_STRING_MAX : LONG_STRING_MAX;
    return schema;
};

const toSchema = (node, key, path, mapPaths) => {
    if (Array.isArray(node)) {
        const schema = {
            type: 'array',
            items: node.length > 0 ? toSchema(node[0], key, path, mapPaths) : stringSchema(undefined, key)
        };
        const maxItems = maxItemsFor(key, path);
        if (maxItems) schema.maxItems = maxItems;
        return schema;
    }

    if (node && typeof node === 'object') {
        if (isMapTemplate(node)) {
            const [labelDescription] = Object.keys(node);
            mapPaths.push(path);
            const valueSchema = toSchema(node[labelDescription], key, path, mapPaths);
            const mapSchema = {
                type: 'array',
                items: {
                    type: 'object',
                    properties: {
                        label: stringSchema(labelDescription.replace(/^\s*\[|\]\s*$/g, ''), 'label'),
                        ...valueSchema.properties
                    },
                    required: ['label', ...Object.keys(valueSchema.properties || {})]
                }
            };
            const maxItems = maxItemsFor(key, path);
            if (maxItems) mapSchema.maxItems = maxItems;
            return mapSchema;
        }

        const properties = {};
        const entries = Object.entries(node);
        // Put the translation first so it is generated (and can be shown) first.
        entries.sort(([a], [b]) => (b === 'translation') - (a === 'translation'));
        for (const [childKey, childValue] of entries) {
            properties[childKey] = toSchema(childValue, childKey, [...path, childKey], mapPaths);
        }
        if (key === 'components' && properties.text && path.length === 2) {
            properties.text = stringSchema(COMPONENT_TEXT_RULE, 'text');
        }

        const schema = { type: 'object', properties };
        const required = (REQUIRED[key] || []).filter((name) => properties[name]);
        if (required.length > 0) schema.required = required;
        return schema;
    }

    return stringSchema(typeof node === 'string' ? node : undefined, key);
};

// Returns { schema, mapPaths } for a full analysis prompt, or null when the
// prompt has no parsable template (callers then fall back to plain JSON mode).
const getAnalysisSchema = (promptText) => {
    const template = extractTemplate(promptText);
    let result = null;
    if (template && template.analysis && typeof template.analysis === 'object') {
        const mapPaths = [];
        const analysis = toSchema(template.analysis, 'analysis', ['analysis'], mapPaths);
        result = {
            schema: {
                type: 'object',
                properties: {
                    isValid: { type: 'boolean' },
                    error: {
                        type: 'object',
                        properties: {
                            type: stringSchema('not_<language> | nonsensical | other', 'type'),
                            message: stringSchema('Explanation of what is wrong with the input', 'message')
                        },
                        required: ['type', 'message']
                    },
                    analysis
                },
                required: ['isValid']
            },
            mapPaths
        };
    }

    return result;
};

// Turns the { label, ...fields } arrays used for map placeholders back into
// the { [label]: fields } objects the UI reads.
const restoreMaps = (parsed, mapPaths) => {
    if (!parsed || typeof parsed !== 'object' || !Array.isArray(mapPaths)) return parsed;
    for (const path of mapPaths) {
        let parent = parsed;
        for (let i = 0; i < path.length - 1 && parent; i++) {
            parent = parent[path[i]];
        }
        const last = path[path.length - 1];
        if (!parent || !Array.isArray(parent[last])) continue;

        const restored = {};
        for (const item of parent[last]) {
            if (!item || typeof item !== 'object') continue;
            const { label, ...rest } = item;
            if (typeof label === 'string' && label.trim()) {
                restored[label.trim()] = rest;
            }
        }
        parent[last] = restored;
    }
    return parsed;
};

// True when some string in the analysis repeats the same sentence three or
// more times, the signature of a generation loop. Such output is retried
// rather than saved and shown.
const MIN_REPEATED_SEGMENT = 8;
const hasRepetitionLoop = (value) => {
    if (typeof value === 'string') {
        if (value.length < 100) return false;
        const counts = new Map();
        for (const segment of value.split(/(?<=[.!?。！？])\s*|\n+/)) {
            const trimmed = segment.trim();
            if (trimmed.length < MIN_REPEATED_SEGMENT) continue;
            const count = (counts.get(trimmed) || 0) + 1;
            if (count >= 3) return true;
            counts.set(trimmed, count);
        }
        return false;
    }
    if (Array.isArray(value)) return value.some(hasRepetitionLoop);
    if (value && typeof value === 'object') return Object.values(value).some(hasRepetitionLoop);
    return false;
};

module.exports = {
    hasRepetitionLoop,
    extractTemplate,
    getAnalysisSchema,
    restoreMaps
};
