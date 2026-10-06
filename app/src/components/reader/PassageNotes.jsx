'use client';
import { useLanguage } from '@/contexts/LanguageContext';
import getFontClass from '@/lib/fontClass';
import styles from '@/styles/components/reader/panel.module.scss';

// What the side panel shows when no sentence is open: notes on the whole
// passage, its grammar patterns (tap one to light up the sentences that use
// it) and, for longer texts, sections to jump between.
const PassageNotes = ({ overview, language, translationLanguage, highlightPattern, onHighlightPattern, onJump, loading }) => {
    const { t } = useLanguage();
    const fontClass = getFontClass(language);

    if (loading) {
        return (
            <div className={styles.notes}>
                <span className={styles.panelLabel}>{t('reader.about_passage')}</span>
                <p className={styles.muted}>{t('reader.notes_coming')}</p>
                <div className={styles.skeleton} />
                <div className={styles.skeleton} />
            </div>
        );
    }

    const patterns = overview?.keyGrammarPatterns || [];
    const sections = overview?.sections || [];

    return (
        <div className={styles.notes} lang={translationLanguage}>
            <span className={styles.panelLabel}>{t('reader.about_passage')}</span>
            <p className={styles.tip}>{t('reader.tap_tip')}</p>

            {overview?.structure && (
                <div className={styles.noteBlock}>
                    <h3>{t('extended_text.structure')}</h3>
                    <p>{overview.structure}</p>
                </div>
            )}
            {overview?.level?.reason && (
                <div className={styles.noteBlock}>
                    <h3>{t('reader.level_heading')}</h3>
                    <p>{overview.level.reason}</p>
                </div>
            )}
            {overview?.culturalContext && (
                <div className={styles.noteBlock}>
                    <h3>{t('extended_text.cultural_context')}</h3>
                    <p>{overview.culturalContext}</p>
                </div>
            )}

            {patterns.length > 0 && (
                <div className={styles.noteBlock}>
                    <h3>{t('reader.grammar_in_text')}</h3>
                    <div className={styles.patternList}>
                        {patterns.map((point) => {
                            const active = highlightPattern === point.pattern;
                            return (
                                <button
                                    key={point.pattern}
                                    type="button"
                                    className={active ? styles.patternActive : styles.pattern}
                                    onClick={() => onHighlightPattern(active ? null : point.pattern)}
                                    aria-pressed={active}
                                >
                                    <span className={styles.patternTop}>
                                        <span className={`${styles.grammarPattern} ${fontClass}`} lang={language}>{point.pattern}</span>
                                        {point.sentences?.length > 0 && <span className={styles.patternCount}>×{point.sentences.length}</span>}
                                    </span>
                                    <span className={styles.grammarMeaning}>{point.meaning}</span>
                                    {active && point.description && <span className={styles.patternDescription}>{point.description}</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>
            )}

            {sections.length > 1 && (
                <div className={styles.noteBlock}>
                    <h3>{t('reader.sections')}</h3>
                    <div className={styles.sectionList}>
                        {sections.map((section) => (
                            <button key={section.firstSentence} type="button" className={styles.section} onClick={() => onJump(section.firstSentence - 1)}>
                                <strong>{section.title}</strong>
                                {section.summary && <span>{section.summary}</span>}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default PassageNotes;
