// Every published Learn article. Add a module here to publish it: the hub,
// the sitemap and the article route all read this list.
import * as sentenceStructure from './korean-sentence-structure';
import * as particles from './korean-particles-eun-neun-vs-i-ga';
import * as presentTense from './korean-present-tense-a-yo-eo-yo';
import * as thisThat from './korean-this-that-i-geu-jeo';
import * as questionWords from './korean-question-words';
import * as andWith from './korean-hago-wa-gwa-and';
import * as eVsEseo from './korean-e-vs-eseo';
import * as pastTense from './korean-past-tense';
import * as futureTense from './korean-future-tense-eul-geoyeyo';
import * as goItda from './korean-go-itda-ing';
import * as negation from './korean-negation-an-vs-mot';
import * as wantTo from './korean-go-sipda-want-to';
import * as canDo from './korean-eul-su-itda-can';
import * as haveTo from './korean-aya-hada-have-to';
import * as andThen from './korean-go-and-then';
import * as because from './korean-aseo-eoseo-because';
import * as but from './korean-jiman-but';
import * as ifWhen from './korean-myeon-if';
import * as speechLevels from './korean-speech-levels';
import * as numbers from './korean-numbers-native-vs-sino';
import * as kdramaWords from './korean-words-from-kdramas';
import * as neunde from './korean-neunde';
import * as eunikka from './korean-eunikka-because';
import * as modifiers from './korean-noun-modifiers';
import * as honorific from './korean-honorific-eusi';
import * as tryBoda from './korean-a-eo-boda-try';
import * as inOrderTo from './korean-euryeogo-in-order-to';
import * as neyoJiyo from './korean-neyo-vs-jiyo';

// In reading order: the hub's "next for you" picks and each article's
// "Keep going" follow this list, so keep Beginner before Intermediate.
export const articles = [
    sentenceStructure, particles, presentTense, thisThat, questionWords, andWith, eVsEseo,
    pastTense, futureTense, goItda, negation, wantTo, canDo, haveTo,
    andThen, because, but, ifWhen, speechLevels, numbers, kdramaWords,
    neunde, eunikka, modifiers, honorific, tryBoda, inOrderTo, neyoJiyo,
];

// meta.level is one of these, meta.topic one of the TOPICS keys.
export const LEVELS = ['Beginner', 'Intermediate'];

export const TOPICS = [
    { key: 'basics', title: 'Sentence basics', blurb: 'Word order, particles and the little words every sentence needs.' },
    { key: 'verbs', title: 'Verb forms and tenses', blurb: 'Talk about now, the past, the future, and what you are doing right now.' },
    { key: 'expressing', title: 'Want, can, must', blurb: 'Say what you want, can, can\'t, have to and plan to do.' },
    { key: 'linking', title: 'Linking sentences', blurb: 'And, but, because, if: join ideas the way Koreans do.' },
    { key: 'politeness', title: 'Talking to people', blurb: 'Speech levels, honorifics and the endings that set the mood.' },
    { key: 'vocab', title: 'Words and numbers', blurb: 'Counting, and the words you hear in every K-drama.' },
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
