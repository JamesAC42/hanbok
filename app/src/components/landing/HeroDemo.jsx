'use client';
import { useEffect, useRef, useState } from 'react';
import styles from '@/styles/pages/landing.module.scss';

// A real breakdown in miniature: tap a word to see what it means, the way the
// analyzer shows it. It walks through the words by itself until someone
// touches it, then waits for them.
const TYPES = {
    noun: { label: 'Noun', color: 'read' },
    pronoun: { label: 'Pronoun', color: 'read' },
    verb: { label: 'Verb', color: 'flame' },
    adverb: { label: 'Adverb', color: 'purple' },
    particle: { label: 'Particle', color: 'und' },
    auxiliary: { label: 'Helper verb', color: 'pink' },
};

const DEMOS = [
    {
        key: 'ko',
        tab: '한국어',
        lang: 'ko',
        translation: 'I want to study Korean harder.',
        words: [
            { text: '한국어를', reading: 'han-gu-geo-reul', type: 'noun', meaning: 'Korean (the language)', note: '를 marks it as the thing being studied.' },
            { text: '더', reading: 'deo', type: 'adverb', meaning: 'more' },
            { text: '열심히', reading: 'yeol-sim-hi', type: 'adverb', meaning: 'hard, diligently' },
            { text: '공부하고', reading: 'gong-bu-ha-go', type: 'verb', meaning: 'to study', note: 'From 공부하다. -고 links it to 싶다.' },
            { text: '싶어요', reading: 'si-peo-yo', type: 'auxiliary', meaning: 'want to', note: 'From 싶다, in the polite -어요 form.' },
        ],
        grammar: { pattern: '-고 싶다', meaning: 'want to do something', example: '먹고 싶어요 · I want to eat' },
    },
    {
        key: 'ja',
        tab: '日本語',
        lang: 'ja',
        translation: 'I listen to Japanese songs every day.',
        words: [
            { text: '毎日', reading: 'まいにち · mainichi', type: 'noun', meaning: 'every day' },
            { text: '日本語', reading: 'にほんご · nihongo', type: 'noun', meaning: 'Japanese (the language)' },
            { text: 'の', reading: 'no', type: 'particle', meaning: "'s, of", note: 'Links 日本語 to 歌: Japanese songs.' },
            { text: '歌', reading: 'うた · uta', type: 'noun', meaning: 'song' },
            { text: 'を', reading: 'o', type: 'particle', meaning: '(object marker)', note: 'Marks 歌 as what is being listened to.' },
            { text: '聴いています', reading: 'きいています · kiite imasu', type: 'verb', meaning: 'am listening, listen (as a habit)', note: 'From 聴く in the polite -ています form.' },
        ],
        grammar: { pattern: '〜ています', meaning: 'doing now, or doing regularly', example: '毎朝走っています · I run every morning' },
    },
    {
        key: 'zh',
        tab: '中文',
        lang: 'zh',
        translation: 'I want to learn Chinese well.',
        words: [
            { text: '我', reading: 'wǒ', type: 'pronoun', meaning: 'I, me' },
            { text: '想', reading: 'xiǎng', type: 'auxiliary', meaning: 'want to, would like to' },
            { text: '学好', reading: 'xué hǎo', type: 'verb', meaning: 'learn well', note: '学 (learn) + 好 (well, done properly).' },
            { text: '中文', reading: 'Zhōngwén', type: 'noun', meaning: 'Chinese (the language)' },
        ],
        grammar: { pattern: '想 + verb', meaning: 'want to do something', example: '我想去中国 · I want to go to China' },
    },
];

const STEP_MS = 2400;

export default function HeroDemo() {
    const [demoIndex, setDemoIndex] = useState(0);
    const [active, setActive] = useState(0);
    const [saved, setSaved] = useState({});
    const [auto, setAuto] = useState(true);
    const reduceMotion = useRef(false);

    const demo = DEMOS[demoIndex];
    const word = demo.words[active];
    const type = TYPES[word.type];
    const savedKey = `${demo.key}:${active}`;

    useEffect(() => {
        reduceMotion.current = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (reduceMotion.current) setAuto(false);
    }, []);

    // Walk through the words, then on to the next language.
    useEffect(() => {
        if (!auto) return undefined;
        const timer = setTimeout(() => {
            if (active < demo.words.length - 1) {
                setActive(active + 1);
            } else {
                setDemoIndex((demoIndex + 1) % DEMOS.length);
                setActive(0);
            }
        }, active === demo.words.length - 1 ? STEP_MS * 1.6 : STEP_MS);
        return () => clearTimeout(timer);
    }, [auto, active, demoIndex, demo.words.length]);

    const pickDemo = (i) => {
        setAuto(false);
        setDemoIndex(i);
        setActive(0);
    };

    const pickWord = (i) => {
        setAuto(false);
        setActive(i);
    };

    return (
        <div className={styles.demo} aria-label="Example sentence breakdown">
            <div className={styles.demoTop}>
                <div className={styles.demoTabs} role="tablist" aria-label="Language">
                    {DEMOS.map((d, i) => (
                        <button key={d.key} type="button" role="tab" aria-selected={i === demoIndex} lang={d.lang}
                            className={i === demoIndex ? styles.demoTabOn : undefined} onClick={() => pickDemo(i)}>
                            {d.tab}
                        </button>
                    ))}
                </div>
                <span className={styles.demoHint}>{auto ? 'Tap a word' : 'Tap any word'}</span>
            </div>

            <p className={styles.demoSentence} lang={demo.lang}>
                {demo.words.map((w, i) => (
                    <button key={`${demo.key}-${i}`} type="button" aria-pressed={i === active}
                        className={`${styles.chip} ${styles[`chip_${TYPES[w.type].color}`]} ${i === active ? styles.chipOn : ''}`}
                        onClick={() => pickWord(i)}>
                        {w.text}
                    </button>
                ))}
            </p>
            <p className={styles.demoTranslation}>{demo.translation}</p>

            <div key={savedKey} className={`${styles.wordCard} ${styles[`word_${type.color}`]}`} aria-live="polite">
                <div className={styles.wordHead}>
                    <div>
                        <strong lang={demo.lang}>{word.text}</strong>
                        <span>{word.reading}</span>
                    </div>
                    <span className={styles.wordType}>{type.label}</span>
                </div>
                <p className={styles.wordMeaning}>{word.meaning}</p>
                {word.note && <p className={styles.wordNote} lang={demo.lang}>{word.note}</p>}
                <button type="button" className={saved[savedKey] ? styles.savedButton : styles.saveButton}
                    onClick={() => { setAuto(false); setSaved((s) => ({ ...s, [savedKey]: !s[savedKey] })); }}>
                    {saved[savedKey] ? '✓ Saved to flashcards' : '+ Save word'}
                </button>
            </div>

            <div className={styles.grammarStrip}>
                <span className={styles.grammarLabel}>Grammar</span>
                <strong lang={demo.lang}>{demo.grammar.pattern}</strong>
                <span>{demo.grammar.meaning}</span>
                <em lang={demo.lang}>{demo.grammar.example}</em>
            </div>

            <div className={styles.demoProgress} aria-hidden="true">
                {demo.words.map((w, i) => <i key={i} className={i <= active ? styles.dotOn : undefined} />)}
            </div>
        </div>
    );
}
