// Every published Learn article. Add a module here to publish it: the hub,
// the sitemap and the article route all read this list.
import * as particles from './korean-particles-eun-neun-vs-i-ga';
import * as sentenceStructure from './korean-sentence-structure';
import * as kdramaWords from './korean-words-from-kdramas';
import * as speechLevels from './korean-speech-levels';
import * as presentTense from './korean-present-tense-a-yo-eo-yo';
import * as pastTense from './korean-past-tense';
import * as futureTense from './korean-future-tense-eul-geoyeyo';
import * as wantTo from './korean-go-sipda-want-to';
import * as negation from './korean-negation-an-vs-mot';
import * as eVsEseo from './korean-e-vs-eseo';
import * as because from './korean-aseo-eoseo-because';
import * as but from './korean-jiman-but';
import * as ifWhen from './korean-myeon-if';
import * as numbers from './korean-numbers-native-vs-sino';

// In reading order: the hub lists them this way and each article's "Keep going"
// suggests the ones after it.
export const articles = [
    sentenceStructure, particles, presentTense, pastTense, futureTense,
    negation, wantTo, eVsEseo, because, but, ifWhen,
    speechLevels, numbers, kdramaWords,
];

export const getArticle = (slug) => articles.find((a) => a.meta.slug === slug) || null;

// Grammar points an article teaches live in meta.grammar as { form, label }, e.g.
// { form: '-고 싶다', label: 'want to' }. Forms are compared without hyphens,
// parentheses or spaces, so '고 싶어요' style lookups should pass the dictionary form.
const normalizeForm = (form) => form.replace(/[-()\s]/g, '');

// Learn articles that teach a grammar form, most focused article first.
export const articlesForGrammar = (form) => {
    const key = normalizeForm(form);
    return articles
        .filter((a) => (a.meta.grammar || []).some((g) => normalizeForm(g.form).split('/').includes(key) || normalizeForm(g.form) === key))
        .sort((a, b) => a.meta.grammar.length - b.meta.grammar.length);
};
