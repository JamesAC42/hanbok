// Every published Learn article. Add a module here to publish it: the hub,
// the sitemap and the article route all read this list.
import * as particles from './korean-particles-eun-neun-vs-i-ga';
import * as sentenceStructure from './korean-sentence-structure';
import * as kdramaWords from './korean-words-from-kdramas';

export const articles = [particles, sentenceStructure, kdramaWords];

export const getArticle = (slug) => articles.find((a) => a.meta.slug === slug) || null;
