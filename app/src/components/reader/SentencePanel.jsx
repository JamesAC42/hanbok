'use client';
import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import getFontClass from '@/lib/fontClass';
import { isContentWord } from './segment';
import styles from '@/styles/components/reader/panel.module.scss';

const PlusIcon = () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg>
);
const CheckIcon = () => (
    <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M20 6 9 17l-5-5" /></svg>
);

// The open sentence: translation, each word with its gloss (and a save
// button), the grammar it uses, and the way into the full breakdown.
const SentencePanel = ({
    sentence, total, language, translationLanguage, selectedWord, onSelectWord, savedWords, onToggleWord,
    onHighlightPattern, highlightPattern, onOpenBreakdown, breakdownState, onPrev, onNext, onClose, sentenceId
}) => {
    const { t } = useLanguage();
    const [tab, setTab] = useState('words');
    const fontClass = getFontClass(language);
    const words = sentence.words || [];
    const grammar = sentence.grammar || [];

    return (
        <div className={styles.sentencePanel}>
            <div className={styles.panelTop}>
                <span className={styles.panelLabel}>{t('reader.sentence_of', { current: sentence.index + 1, total })}</span>
                <button type="button" className={styles.closeButton} onClick={onClose} aria-label={t('extended_text.close')}>
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
                </button>
            </div>

            <p className={`${styles.original} ${fontClass}`} lang={language}>{sentence.text}</p>
            {sentence.translation
                ? <p className={styles.translation} lang={translationLanguage}>{sentence.translation}</p>
                : <p className={styles.muted}>{sentence.failed ? t('reader.sentence_failed') : t('reader.still_reading')}</p>}

            {(words.length > 0 || grammar.length > 0) && (
                <div className={styles.tabs} role="tablist">
                    <button type="button" role="tab" aria-selected={tab === 'words'} className={tab === 'words' ? styles.tabActive : styles.tab} onClick={() => setTab('words')}>
                        {t('reader.word_by_word')}
                    </button>
                    <button type="button" role="tab" aria-selected={tab === 'grammar'} className={tab === 'grammar' ? styles.tabActive : styles.tab} onClick={() => setTab('grammar')}>
                        {t('reader.grammar_tab', { count: grammar.length })}
                    </button>
                </div>
            )}

            {tab === 'words' && words.length > 0 && (
                <div role="tabpanel">
                <p className={styles.hint}>{t('reader.save_words_hint')}</p>
                <div className={styles.wordGrid}>
                    {words.map((word, index) => {
                        const saveable = isContentWord(word) && word.base;
                        const isSaved = savedWords.has(word.base);
                        return (
                            <div
                                key={index}
                                className={`${styles.wordCard} ${selectedWord === index ? styles.wordCardActive : ''}`}
                            >
                                <button type="button" className={styles.wordMain} onClick={() => onSelectWord(index)}>
                                    <span className={`${styles.wordText} ${fontClass}`} lang={language}>{word.text}</span>
                                    {word.reading && word.reading !== word.text && <span className={styles.wordReading}>{word.reading}</span>}
                                    <span className={styles.wordGloss}>
                                        {word.base && word.base !== word.text && <span className={fontClass} lang={language}>{word.base} · </span>}
                                        {word.meaning}
                                    </span>
                                </button>
                                {saveable && (
                                    <button
                                        type="button"
                                        className={isSaved ? styles.savedButton : styles.saveButton}
                                        onClick={() => onToggleWord({ base: word.base, meaning: word.meaning, reading: word.reading, sentenceId })}
                                        aria-label={isSaved ? t('reader.remove_word', { word: word.base }) : t('reader.save_word', { word: word.base })}
                                        aria-pressed={isSaved}
                                    >
                                        {isSaved ? <CheckIcon /> : <PlusIcon />}
                                        <span>{isSaved ? t('reader.saved_short') : t('reader.save_short')}</span>
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
                </div>
            )}

            {tab === 'grammar' && (
                <div className={styles.grammarList} role="tabpanel">
                    {grammar.length === 0 && <p className={styles.muted}>{t('reader.no_grammar')}</p>}
                    {grammar.map((point, index) => (
                        <div key={index} className={styles.grammarCard}>
                            <div className={styles.grammarHead}>
                                <span className={`${styles.grammarPattern} ${fontClass}`} lang={language}>{point.pattern}</span>
                                <span className={styles.grammarMeaning}>{point.meaning}</span>
                            </div>
                            {point.text && <p className={`${styles.grammarText} ${fontClass}`} lang={language}>{point.text}</p>}
                            <button
                                type="button"
                                className={styles.linkButton}
                                onClick={() => onHighlightPattern(highlightPattern === point.pattern ? null : point.pattern)}
                            >
                                {highlightPattern === point.pattern ? t('reader.stop_highlighting') : t('reader.find_in_text')}
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <button
                type="button"
                className={styles.breakdownButton}
                onClick={onOpenBreakdown}
                disabled={breakdownState === 'loading' || (!sentence.translation && !sentence.failed)}
            >
                {breakdownState === 'loading' ? t('reader.breaking_down') : t('reader.full_breakdown')}
            </button>
            {breakdownState === 'error' && <p className={styles.error} role="alert">{t('reader.breakdown_failed')}</p>}

            <div className={styles.navRow}>
                <button type="button" className={styles.prevButton} onClick={onPrev} disabled={sentence.index === 0}>
                    {t('reader.previous')}
                </button>
                <button type="button" className={styles.nextButton} onClick={onNext} disabled={sentence.index >= total - 1}>
                    {t('reader.next_sentence')}
                </button>
            </div>
        </div>
    );
};

export default SentencePanel;
