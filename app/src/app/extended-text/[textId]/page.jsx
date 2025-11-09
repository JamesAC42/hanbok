'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Dashboard from '@/components/Dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Analysis from '@/components/analysis/Analysis';
import styles from '@/styles/pages/extendedtextanalysis.module.scss';

export default function ExtendedTextAnalysisPage() {
    const params = useParams();
    const textId = params.textId;
    const { user, isAuthenticated, loading: authLoading } = useAuth();
    const { t, supportedLanguages, supportedAnalysisLanguages } = useLanguage();

    const [extendedText, setExtendedText] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const [selectedSentenceIndex, setSelectedSentenceIndex] = useState(null);

    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (!isAuthenticated) {
            setError(t('extended_text.login_required'));
            setIsLoading(false);
            return;
        }

        fetchExtendedText();
    }, [authLoading, isAuthenticated, textId, t]);

    const fetchExtendedText = async () => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await fetch(`/api/extended-text/${textId}`, {
                credentials: 'include',
            });

            const data = await response.json();

            if (!data.success) {
                setError(data.error || t('extended_text.fetch_error'));
                setIsLoading(false);
                return;
            }

            setExtendedText(data.extendedText);
            setIsLoading(false);
        } catch (err) {
            console.error('Error fetching extended text:', err);
            setError(t('extended_text.fetch_error'));
            setIsLoading(false);
        }
    };

    const handleSentenceClick = (index) => {
        setSelectedSentenceIndex(index === selectedSentenceIndex ? null : index);
    };

    const analysis = extendedText?.analysis;

    const combinedTranslation = useMemo(() => {
        if (!analysis?.sentences || analysis.sentences.length === 0) {
            return '';
        }

        return analysis.sentences
            .map((sentence) => sentence?.analysis?.sentence?.translation?.trim())
            .filter(Boolean)
            .join(' ')
            .trim();
    }, [analysis]);

    const currentSentence =
        selectedSentenceIndex !== null && analysis?.sentences
            ? analysis.sentences[selectedSentenceIndex]
            : null;

    const sentences = analysis?.sentences || [];
    const sentenceCount = sentences.length;
    const formattedDate = extendedText?.dateCreated
        ? new Date(extendedText.dateCreated).toLocaleDateString(undefined, {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
          })
        : '';
    const overall = analysis?.overallAnalysis || {};
    const resolveLanguageName = (code) => {
        if (!code) return '';
        const key = supportedAnalysisLanguages[code] || supportedLanguages[code];
        return key ? t(`languages.${key}`) : code.toUpperCase();
    };

    const analysisLanguageName = resolveLanguageName(extendedText?.originalLanguage);
    const translationLanguageName = resolveLanguageName(extendedText?.translationLanguage);
    const headingTitle = extendedText?.title || t('extended_text.title');
    const selectedSentenceNumber =
        selectedSentenceIndex !== null ? selectedSentenceIndex + 1 : null;
    const isFlyoutOpen = Boolean(currentSentence);
    const closeFlyout = () => setSelectedSentenceIndex(null);

    useEffect(() => {
        if (extendedText) {
            const pageTitle = extendedText.title
                ? `${extendedText.title} | ${t('extended_text.title')}`
                : t('extended_text.title');
            document.title = pageTitle;
        }
    }, [extendedText, t]);

    useEffect(() => {
        if (!isFlyoutOpen) {
            return undefined;
        }
        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                setSelectedSentenceIndex(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isFlyoutOpen]);

    if (isLoading) {
        return (
            <Dashboard>
                <div className={styles.loading}>
                    {t('extended_text.loading')}
                </div>
            </Dashboard>
        );
    }

    if (error) {
        return (
            <Dashboard>
                <div className={styles.error}>
                    {error}
                </div>
            </Dashboard>
        );
    }

    if (!extendedText || !analysis) {
        return (
            <Dashboard>
                <div className={styles.error}>
                    {t('extended_text.not_found')}
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard>
            <div className={styles.page}>
                <section className={styles.hero}>
                    <div className={styles.heroCopy}>
                        <span className={styles.badge}>{t('extended_text.overall_analysis')}</span>
                        <h1>{headingTitle}</h1>
                        <p className={styles.heroDescription}>{t('extended_text.description')}</p>
                        <div className={styles.meta}>
                            <span>{t('extended_text.sentences_count', { count: extendedText.sentenceCount || sentenceCount })}</span>
                            {formattedDate && <span>{formattedDate}</span>}
                            {analysisLanguageName && (
                                <span>{t('extended_text.language_meta', { language: analysisLanguageName })}</span>
                            )}
                            {translationLanguageName && (
                                <span>{t('extended_text.translation_meta', { language: translationLanguageName })}</span>
                            )}
                            {overall.tone && <span>{overall.tone}</span>}
                            {user && (
                                <span>
                                    {user.tier === 0 && user.weekExtendedTextTotal !== null
                                        ? t('extended_text.weekly_usage_meta', {
                                              remaining: Math.max(user.weekExtendedTextRemaining ?? 0, 0),
                                              total: user.weekExtendedTextTotal ?? 0
                                          })
                                        : t('extended_text.weekly_usage_unlimited')}
                                </span>
                            )}
                        </div>
                    </div>
                    <figure className={styles.heroArt}>
                        <Image
                            src="/images/extended-text-overview.svg"
                            alt="Stylized dashboard showing extended text analytics"
                            width={420}
                            height={320}
                            priority
                        />
                    </figure>
                </section>

                <div className={styles.layout}>
                    <div className={styles.leftColumn}>
                        <section className={`${styles.card} ${styles.sentencesCard}`}>
                            <header className={styles.cardHeader}>
                                <div>
                                    <h2>{t('extended_text.full_text')}</h2>
                                    <p>{t('extended_text.select_sentence_prompt')}</p>
                                </div>
                            </header>
                            <div className={styles.sentencesList}>
                                {sentences.map((sentence, index) => {
                                    const translation = sentence?.analysis?.sentence?.translation;
                                    const isSelected = selectedSentenceIndex === index;

                                    return (
                                        <button
                                            type="button"
                                            key={index}
                                            className={`${styles.sentenceButton} ${isSelected ? styles.sentenceButtonActive : ''}`}
                                            onClick={() => handleSentenceClick(index)}
                                            aria-pressed={isSelected}
                                        >
                                            <span className={styles.sentenceBadge}>{index + 1}</span>
                                            <div className={styles.sentenceContent}>
                                                <p className={styles.sentenceText}>{sentence.text}</p>
                                                {translation && (
                                                    <span className={styles.sentenceSubtext}>{translation}</span>
                                                )}
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </section>

                        {combinedTranslation && (
                            <section className={`${styles.card} ${styles.translationCard}`}>
                                <header className={styles.cardHeader}>
                                    <h2>{t('extended_text.full_translation')}</h2>
                                </header>
                                <p className={styles.translationText}>{combinedTranslation}</p>
                            </section>
                        )}

                        <section className={`${styles.card} ${styles.overallCard}`}>
                            <header className={styles.cardHeader}>
                                <h2>{t('extended_text.overall_analysis')}</h2>
                            </header>
                            <div className={styles.overallGrid}>
                                {overall.summary && (
                                    <div className={styles.overallBlock}>
                                        <span className={styles.overallLabel}>{t('extended_text.summary')}</span>
                                        <p className={styles.overallBody}>{overall.summary}</p>
                                    </div>
                                )}
                                {overall.structure && (
                                    <div className={styles.overallBlock}>
                                        <span className={styles.overallLabel}>{t('extended_text.structure')}</span>
                                        <p className={styles.overallBody}>{overall.structure}</p>
                                    </div>
                                )}
                                {overall.culturalContext && (
                                    <div className={styles.overallBlock}>
                                        <span className={styles.overallLabel}>{t('extended_text.cultural_context')}</span>
                                        <p className={styles.overallBody}>{overall.culturalContext}</p>
                                    </div>
                                )}
                                {overall.tone && (
                                    <div className={styles.overallBlock}>
                                        <span className={styles.overallLabel}>{t('extended_text.tone')}</span>
                                        <p className={styles.overallBody}>{overall.tone}</p>
                                    </div>
                                )}
                            </div>

                            {overall.themes && overall.themes.length > 0 && (
                                <div className={styles.themesSection}>
                                    <h3>{t('extended_text.themes')}</h3>
                                    <ul className={styles.themesList}>
                                        {overall.themes.map((theme, index) => (
                                            <li key={index}>{theme}</li>
                                        ))}
                                    </ul>
                                </div>
                            )}

                            {overall.keyGrammarPatterns && overall.keyGrammarPatterns.length > 0 && (
                                <div className={styles.grammarSection}>
                                    <h3>{t('extended_text.key_grammar_patterns')}</h3>
                                    <div className={styles.grammarList}>
                                        {overall.keyGrammarPatterns.map((pattern, index) => (
                                            <div key={index} className={styles.grammarItem}>
                                                <div className={styles.grammarHeading}>{pattern.pattern}</div>
                                                {pattern.description && (
                                                    <p>{pattern.description}</p>
                                                )}
                                                {pattern.examples && pattern.examples.length > 0 && (
                                                    <ul>
                                                        {pattern.examples.map((example, exIndex) => (
                                                            <li key={exIndex}>{example}</li>
                                                        ))}
                                                    </ul>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </section>
                    </div>
                </div>

                <div
                    className={`${styles.analysisBackdrop} ${isFlyoutOpen ? styles.open : ''}`}
                    onClick={closeFlyout}
                    aria-hidden="true"
                />
                <aside
                    className={`${styles.analysisFlyout} ${isFlyoutOpen ? styles.open : ''}`}
                    role="dialog"
                    aria-modal={isFlyoutOpen}
                    aria-hidden={!isFlyoutOpen}
                >
                    <div className={`${styles.card} ${styles.analysisCard}`}>
                        <div className={styles.analysisHeader}>
                            <h2>
                                {selectedSentenceNumber
                                    ? `${t('extended_text.sentence_analysis')} ${selectedSentenceNumber}`
                                    : t('extended_text.sentence_analysis')}
                            </h2>
                            <button
                                type="button"
                                onClick={closeFlyout}
                                aria-label={t('extended_text.close')}
                            >
                                ✕
                            </button>
                        </div>
                        <div className={styles.analysisBody}>
                            {currentSentence ? (
                                <Analysis
                                    analysis={currentSentence.analysis}
                                    originalLanguage={extendedText.originalLanguage}
                                    translationLanguage={extendedText.translationLanguage}
                                />
                            ) : (
                                <div className={styles.placeholder}>
                                    <p>{t('extended_text.select_sentence_prompt')}</p>
                                </div>
                            )}
                        </div>
                    </div>
                </aside>
            </div>
        </Dashboard>
    );
}
