'use client';
import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'next/navigation';
import Image from 'next/image';
import Dashboard from '@/components/Dashboard';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Analysis from '@/components/analysis/Analysis';
import ExtendedTextSaveButton from '@/components/ExtendedTextSaveButton';
import styles from '@/styles/pages/extendedtextanalysis.module.scss';

// Icons
import { MynauiSparklesSolid as Sparkles } from '@/components/icons/Sparkles';
import { Fa6SolidParagraph as Paragraph } from '@/components/icons/Paragraph';
import { RiBrain2Fill as Brain } from '@/components/icons/Brain';
import { MaterialSymbolsLibraryBooksSharp as Book } from '@/components/icons/LibraryBooks';
import { MajesticonsLightbulbShine as Lightbulb } from '@/components/icons/Lightbulb';
import { IcSharpQueueMusic as MusicLyrics } from '@/components/icons/MusicLyrics';
import { MakiInformation11 as Info } from '@/components/icons/Info';
import { MingcuteDownFill as DownArrow } from '@/components/icons/DownCarat';

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
    const currentSentenceId = currentSentence?.sentenceId || currentSentence?.analysis?.sentenceId;

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
                    <div className={styles.loadingSpinner} />
                    <p>{t('extended_text.loading')}</p>
                </div>
            </Dashboard>
        );
    }

    if (error) {
        return (
            <Dashboard>
                <div className={styles.error}>
                    <p>{error}</p>
                </div>
            </Dashboard>
        );
    }

    if (!extendedText || !analysis) {
        return (
            <Dashboard>
                <div className={styles.error}>
                    <p>{t('extended_text.not_found')}</p>
                </div>
            </Dashboard>
        );
    }

    return (
        <Dashboard>
            <div className={styles.page}>
                <header className={styles.hero}>
                    <div className={styles.heroContent}>
                        <div className={styles.heroTop}>
                            <div className={styles.heroChips}>
                                <span className={styles.badge}>
                                    <Sparkles />
                                    {t('extended_text.overall_analysis')}
                                </span>
                                <span className={styles.date}>{formattedDate}</span>
                            </div>
                            <ExtendedTextSaveButton textId={extendedText?.textId} />
                        </div>
                        
                        <h1 className={styles.title}>{headingTitle}</h1>
                        <p className={styles.description}>{t('extended_text.description')}</p>
                        
                        <div className={styles.metaTags}>
                            <div className={styles.metaTag}>
                                <Paragraph />
                                <span>{t('extended_text.sentences_count', { count: extendedText.sentenceCount || sentenceCount })}</span>
                            </div>
                            {analysisLanguageName && (
                                <div className={styles.metaTag}>
                                    <span>{analysisLanguageName}</span>
                                    {translationLanguageName && (
                                        <>
                                            <span className={styles.arrow}>→</span>
                                            <span>{translationLanguageName}</span>
                                        </>
                                    )}
                                </div>
                            )}
                            {overall.tone && (
                                <div className={styles.metaTag}>
                                    <MusicLyrics />
                                    <span>{overall.tone}</span>
                                </div>
                            )}
                        </div>
                    </div>
                    <div className={styles.heroIllustration}>
                         <Image
                            src="/images/extended-text-overview.svg"
                            alt=""
                            width={300}
                            height={220}
                            priority
                        />
                    </div>
                </header>

                <div className={styles.mainLayout}>
                    <div className={styles.topGrid}>
                         {combinedTranslation && (
                            <div className={`${styles.widget} ${styles.translationWidget}`}>
                                <div className={styles.widgetHeader}>
                                    <div className={styles.widgetIcon}>
                                        <span className={styles.langIcon}>{extendedText.translationLanguage?.toUpperCase().slice(0,2) || 'TR'}</span>
                                    </div>
                                    <h3>{t('extended_text.full_translation')}</h3>
                                </div>
                                <p className={styles.fullTranslation}>{combinedTranslation}</p>
                            </div>
                        )}

                        <div className={styles.textSection}>
                            <div className={styles.sectionHeader}>
                                <Paragraph className={styles.sectionIcon} />
                                <h2>{t('extended_text.full_text')}</h2>
                            </div>
                            <div className={styles.sentencesList}>
                                {sentences.map((sentence, index) => {
                                    const translation = sentence?.analysis?.sentence?.translation;
                                    const isSelected = selectedSentenceIndex === index;

                                    return (
                                        <button
                                            type="button"
                                            key={index}
                                            className={`${styles.sentenceBlock} ${isSelected ? styles.active : ''}`}
                                            onClick={() => handleSentenceClick(index)}
                                            aria-pressed={isSelected}
                                        >
                                            <div className={styles.sentenceIndex}>{index + 1}</div>
                                            <div className={styles.sentenceBody}>
                                                <p className={styles.originalText}>{sentence.text}</p>
                                                {translation && (
                                                    <p className={styles.translationText}>{translation}</p>
                                                )}
                                            </div>
                                            <div className={styles.tapHint}>
                                                <Lightbulb />
                                                <span>{t('extended_text.analyze')}</span>
                                            </div>
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className={styles.bottomGrid}>
                        <div className={`${styles.widget} ${styles.analysisWidget}`}>
                            <div className={styles.widgetHeader}>
                                <Brain className={styles.widgetIcon} />
                                <h3>{t('extended_text.overall_analysis')}</h3>
                            </div>
                            
                            <div className={styles.analysisGrid}>
                                {overall.summary && (
                                    <div className={styles.analysisItem}>
                                        <h4>{t('extended_text.summary')}</h4>
                                        <p>{overall.summary}</p>
                                    </div>
                                )}
                                {overall.culturalContext && (
                                    <div className={styles.analysisItem}>
                                        <h4>
                                            <Info />
                                            {t('extended_text.cultural_context')}
                                        </h4>
                                        <p>{overall.culturalContext}</p>
                                    </div>
                                )}
                                {overall.structure && (
                                    <div className={styles.analysisItem}>
                                        <h4>{t('extended_text.structure')}</h4>
                                        <p>{overall.structure}</p>
                                    </div>
                                )}
                            </div>

                            {overall.themes && overall.themes.length > 0 && (
                                <div className={styles.tagsSection}>
                                    <h4>{t('extended_text.themes')}</h4>
                                    <div className={styles.tags}>
                                        {overall.themes.map((theme, i) => (
                                            <span key={i} className={styles.themeTag}>{theme}</span>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>

                        {overall.keyGrammarPatterns && overall.keyGrammarPatterns.length > 0 && (
                            <div className={`${styles.widget} ${styles.grammarWidget}`}>
                                <div className={styles.widgetHeader}>
                                    <Book className={styles.widgetIcon} />
                                    <h3>{t('extended_text.key_grammar_patterns')}</h3>
                                </div>
                                <div className={styles.grammarList}>
                                    {overall.keyGrammarPatterns.map((pattern, index) => (
                                        <div key={index} className={styles.grammarItem}>
                                            <div className={styles.grammarHeader}>
                                                <span className={styles.grammarBullet} />
                                                <span className={styles.grammarPattern}>{pattern.pattern}</span>
                                            </div>
                                            {pattern.description && (
                                                <p className={styles.grammarDesc}>{pattern.description}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
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
                    <div className={styles.flyoutMobileDragBar} onClick={closeFlyout}>
                        <div className={styles.dragHandle} />
                    </div>
                    <div className={styles.flyoutHeader}>
                        <div className={styles.flyoutHeaderContent}>
                            <h2>
                                {selectedSentenceNumber
                                    ? `${t('extended_text.sentence_analysis')} ${selectedSentenceNumber}`
                                    : t('extended_text.sentence_analysis')}
                            </h2>
                             <button
                                type="button"
                                className={styles.closeButton}
                                onClick={closeFlyout}
                                aria-label={t('extended_text.close')}
                            >
                                <DownArrow />
                            </button>
                        </div>
                    </div>
                    <div className={styles.flyoutBody}>
                        {currentSentence ? (
                            <Analysis
                                analysis={currentSentence.analysis}
                                originalLanguage={extendedText.originalLanguage}
                                translationLanguage={extendedText.translationLanguage}
                                sentenceId={currentSentenceId}
                            />
                        ) : null}
                    </div>
                </aside>
            </div>
        </Dashboard>
    );
}
