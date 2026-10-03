const CHINESE_SCRIPTS = {
    'zh': 'Simplified Chinese characters (简体字)',
    'zh-TW': 'Traditional Chinese characters (繁體字)',
};

const isChinese = (code) => Object.prototype.hasOwnProperty.call(CHINESE_SCRIPTS, code);

/**
 * Builds a prompt preamble pinning Chinese output to one script, so the model
 * doesn't mix simplified and traditional characters.
 * @param {string} originalLanguage - Language code of the text being analyzed
 * @param {string} translationLanguage - Language code explanations are written in
 * @returns {string} Rules to prepend to the prompt, or '' when neither language is Chinese
 */
const chineseScriptRule = (originalLanguage, translationLanguage) => {
    const rules = [];

    if (isChinese(originalLanguage)) {
        rules.push(`The language being studied is Chinese written in ${CHINESE_SCRIPTS[originalLanguage]}. The input may still arrive in the other script: accept it, and keep any field that must match the input (such as component text) exactly as written. Every other piece of Chinese you produce (dictionary forms, example sentences, synonyms, corrected or suggested text) must use ${CHINESE_SCRIPTS[originalLanguage]} only.`);
    }

    if (isChinese(translationLanguage)) {
        rules.push(`All explanations and translations must be written in ${CHINESE_SCRIPTS[translationLanguage]} only. Never mix simplified and traditional characters.`);
    }

    if (rules.length === 0) return '';

    return `Chinese script requirements (follow these strictly):\n${rules.map((rule, i) => `${i + 1}. ${rule}`).join('\n')}\n\n`;
};

module.exports = {
    isChinese,
    chineseScriptRule
};
