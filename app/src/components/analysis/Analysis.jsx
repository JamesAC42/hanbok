'use client';
import { useState, useEffect, useRef } from 'react';
import Breakdown from '@/components/analysis/Breakdown';
import AudioPlayer from '@/components/analysis/AudioPlayer';
import WordsList from '@/components/analysis/WordsList';
import GrammarPoints from '@/components/analysis/GrammarPoints';
import WordInfo from '@/components/analysis/WordInfo';
import SentenceNotes from '@/components/analysis/SentenceNotes';
import Variants from '@/components/analysis/Variants';
import CulturalNotes from '@/components/analysis/CulturalNotes';
import SaveButton from '@/components/analysis/SaveButton';
import ShareButton from '@/components/analysis/ShareButton';
import SettingsButton from '@/components/analysis/SettingsButton';
import LyricalDevices from '@/components/analysis/LyricalDevices';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { usePopup } from '@/contexts/PopupContext';
import styles from '@/styles/components/sentenceanalyzer/analysis.module.scss';
import getFontClass from '@/lib/fontClass';
import QuotaDisplay from '@/components/QuotaDisplay';
import RecentlyAnalyzed from '@/components/analysis/RecentlyAnalyzed';
import NextSteps from '@/components/analysis/NextSteps';
import useSavedWords from '@/hooks/useSavedWords';
import { markStage } from '@/lib/todayLoop';

const Analysis = ({
    analysis,
    originalLanguage,
    translationLanguage,
    voice1,
    voice2,
    voice1Slow,
    voice2Slow,
    showTransition,
    sentenceId,
    doNotCache,
    onCacheStatusChange,
    isLyric,
    inParagraph = false
}) => {
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const { isAdmin } = useAdmin();
    const { showPromoPopup } = usePopup();
    const [prevWord, setPrevWord] = useState(null);
    const [wordInfo, setWordInfo] = useState(false);
    const [shouldAnimate, setShouldAnimate] = useState(false);
    const [showPronunciation, setShowPronunciation] = useState(true);
    const [activeSection, setActiveSection] = useState('breakdown');
    const [isClosing, setIsClosing] = useState(false);
    const [cacheUpdating, setCacheUpdating] = useState(false);
    const [cacheMessage, setCacheMessage] = useState('');
    const [cacheError, setCacheError] = useState('');

    const savedWordsState = useSavedWords({
        analysis,
        originalLanguage,
        translationLanguage,
        sentenceId,
    });

    const nextStepsProps = {
        sentenceId: isLyric ? null : sentenceId,
        words: savedWordsState.words,
        unsavedWords: savedWordsState.unsavedWords,
        savedLoading: savedWordsState.loading,
        addingAll: savedWordsState.addingAll,
        saveAll: savedWordsState.saveAll,
        showParagraphLink: !inParagraph,
    };

    const sectionRefs = {
        breakdown: useRef(null),
        notes: useRef(null),
        words: useRef(null),
        grammar: useRef(null),
        lyrical: useRef(null),
    };

    const scrollToSection = (section) => {
        if (sectionRefs[section]?.current) {
            sectionRefs[section].current.scrollIntoView({ 
                behavior: 'smooth', 
                block: 'start'
            });
        }
    };

    const capitalize = (word) => {
        return word.charAt(0).toUpperCase() + word.slice(1);
    }

    useEffect(() => {
        if (!isLyric) markStage('understand');
    }, [isLyric]);

    // Initialize showPronunciation from localStorage
    useEffect(() => {
        const savedPref = localStorage.getItem('showPronunciation');
        if (savedPref !== null) {
            setShowPronunciation(JSON.parse(savedPref));
        }
    }, []);

    // Check if we should show the promo popup
    useEffect(() => {
        const shouldShowPromo = () => {
            const attemptCount = localStorage.getItem('promoAttemptCount');
            if (attemptCount !== null) {
                const countInt = parseInt(attemptCount);
                localStorage.setItem('promoAttemptCount', countInt + 1);
                if (countInt < 4) {
                    return;
                }
            } else {
                localStorage.setItem('promoAttemptCount', 1);
                return;
            }

            // Only show for non-logged-in users or free tier users
            if (!user || user.tier === 0) {
                setTimeout(() => {
                    showPromoPopup();
                }, 1500);
            }
        };

        shouldShowPromo();
    }, [user, showPromoPopup]);

    useEffect(() => {
        if (!wordInfo) {
            setPrevWord(null);
            return;
        }
        
        if (wordInfo.dictionary_form !== prevWord) {
            setShouldAnimate(true);
            setTimeout(() => {
                setShouldAnimate(false);
            }, 200);
        }
        setPrevWord(wordInfo.dictionary_form);
    }, [wordInfo]);

    useEffect(() => {
        if (showTransition) {
          setWordInfo(null);
        }
    }, [showTransition]);

    // Intersection Observer for active section tracking
    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '-20% 0px -60% 0px',
            threshold: 0
        };

        const observerCallback = (entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    const sectionId = Object.keys(sectionRefs).find(key => sectionRefs[key].current === entry.target);
                    if (sectionId) {
                        setActiveSection(sectionId);
                    }
                }
            });
        };

        const observer = new IntersectionObserver(observerCallback, observerOptions);
        Object.values(sectionRefs).forEach(ref => {
            if (ref.current) observer.observe(ref.current);
        });

        return () => observer.disconnect();
    }, [analysis]);
    
    const handleCloseWordInfo = () => {
        setIsClosing(true);
        setTimeout(() => {
            setWordInfo(null);
            setIsClosing(false);
        }, 200);
    }

    const handleMarkDoNotCache = async () => {
        if (!sentenceId || cacheUpdating || doNotCache) {
            return;
        }

        setCacheUpdating(true);
        setCacheMessage('');
        setCacheError('');

        try {
            const response = await fetch(`/api/admin/sentences/${sentenceId}/do-not-cache`, {
                method: 'PATCH'
            });
            const data = await response.json();

            if (!response.ok || !data.success) {
                throw new Error(data.error || 'Failed to update sentence cache status');
            }

            onCacheStatusChange?.(true);
            setCacheMessage('This sentence will be regenerated on future submissions.');
        } catch (error) {
            setCacheError(error.message);
        } finally {
            setCacheUpdating(false);
        }
    };
    
    return(
        <div className={`${styles.analysis} ${showTransition ? styles.transition : ''}`}>
            
            {/* Navigation */}
            {!isLyric && (
            <nav className={styles.navigation} aria-label="Sections">
                <div className={styles.tabs}>
                    <button onClick={() => scrollToSection('breakdown')} className={activeSection === 'breakdown' ? styles.active : ''}>Sentence</button>
                    {analysis.sentence.context && <button onClick={() => scrollToSection('notes')} className={activeSection === 'notes' ? styles.active : ''}>Notes</button>}
                    <button onClick={() => scrollToSection('words')} className={activeSection === 'words' ? styles.active : ''}>Words</button>
                    <button onClick={() => scrollToSection('grammar')} className={activeSection === 'grammar' ? styles.active : ''}>Grammar</button>
                </div>
                <div className={styles.embeddedControls}>
                    <ShareButton sentenceId={sentenceId} sentence={analysis.sentence.original} />
                    <SaveButton sentenceId={sentenceId} />
                    <SettingsButton 
                        showPronunciation={showPronunciation} 
                        setShowPronunciation={setShowPronunciation} 
                        language={originalLanguage}
                    />
                </div>
            </nav>
            )}

            {!isLyric && <QuotaDisplay smallScreensOnly />}

            <div className={styles.mainGrid}>
                <div className={styles.contentColumn}>
                    
                    {/* Header Card */}
                    <div ref={sectionRefs.breakdown} className={`${styles.card} ${styles.headerSection}`}>
                        <div className={styles.heroTop}>
                            <span className={styles.stageTag}>Understand</span>
                            <span className={styles.breadcrumbs}>
                                {originalLanguage.toUpperCase()} → {translationLanguage.toUpperCase()}
                            </span>
                        </div>
                        
                        <div className={`${styles.sentence} ${getFontClass(originalLanguage)}`}>
                            {analysis.sentence.original}
                        </div>

                        <div className={styles.translation}>
                            {analysis.sentence.translation}
                        </div>

                        {isAdmin?.(user?.email) && sentenceId && !isLyric && (
                            <div className={styles.adminCacheControls}>
                                <button
                                    type="button"
                                    onClick={handleMarkDoNotCache}
                                    disabled={cacheUpdating || doNotCache}
                                >
                                    {doNotCache ? 'Marked do not cache' : cacheUpdating ? 'Marking...' : 'Do not cache'}
                                </button>
                                <span>
                                    {doNotCache
                                        ? 'Future matching submissions will regenerate this analysis.'
                                        : 'Exclude this analysis from duplicate reuse.'}
                                </span>
                                {cacheMessage && <p className={styles.cacheMessage}>{cacheMessage}</p>}
                                {cacheError && <p className={styles.cacheError}>{cacheError}</p>}
                            </div>
                        )}

                        <div className={styles.controls}>
                            <AudioPlayer
                                sentenceId={sentenceId}
                                isLyric={isLyric}
                                voice1={voice1}
                                voice2={voice2}
                                voice1Slow={voice1Slow}
                                voice2Slow={voice2Slow} />
                        </div>
                        <Breakdown 
                            analysis={analysis} 
                            language={originalLanguage}
                            setWordInfo={setWordInfo}
                            resetLockedWord={showTransition}
                            shouldAnimate={shouldAnimate}
                            showPronunciation={showPronunciation}
                            savedWords={user && !savedWordsState.loading ? savedWordsState.savedWords : null} />
                        <div className={styles.legend}>
                            {user && !savedWordsState.loading && (
                                <>
                                    <span><i className={styles.legendNew} /> New to you</span>
                                    <span><i className={styles.legendKept} /> In your flashcards</span>
                                </>
                            )}
                            <span className={styles.legendHint}>Tap a word for details</span>
                        </div>
                    </div>
                    
                    {/* Next steps (shown here when the side column is a bottom sheet) */}
                    <div className={styles.inlineNextSteps}>
                        <NextSteps {...nextStepsProps} compact />
                    </div>

                    {/* Recently Analyzed Section */}
                    {/*<RecentlyAnalyzed />*/}

                    {/* Sentence Notes */}
                    {analysis.sentence.context || analysis.sentence.formality ? (
                        <div ref={sectionRefs.notes} className={styles.card}>
                            <SentenceNotes
                                analysis={analysis}
                                originalLanguage={originalLanguage}
                                showPronunciation={showPronunciation} />
                        </div>
                    ) : null}

                    {/* Word List */}
                    <div ref={sectionRefs.words} className={styles.card}>
                         <WordsList 
                            analysis={analysis} 
                            originalLanguage={originalLanguage} 
                            translationLanguage={translationLanguage}
                            showPronunciation={showPronunciation}
                            words={savedWordsState.words}
                            savedWords={savedWordsState.savedWords}
                            setSavedWords={savedWordsState.setSavedWords}
                            unsavedWords={savedWordsState.unsavedWords}
                            isSavedWordsLoading={savedWordsState.loading}
                            toggleWordInLibrary={savedWordsState.toggleWord}
                            saveAll={savedWordsState.saveAll}
                            addingAll={savedWordsState.addingAll} />
                    </div>

                    {/* Grammar Points */}
                    <div ref={sectionRefs.grammar} className={styles.card}>
                        <GrammarPoints 
                            analysis={analysis} 
                            language={originalLanguage}
                            translationLanguage={translationLanguage}
                            sentenceId={sentenceId}
                            showPronunciation={showPronunciation} />
                    </div>
                </div>

                {/* Sidebar / Bottom Sheet for Word Info */}
                <div className={`${styles.sidebarColumn} ${wordInfo ? styles.active : ''} ${isClosing ? styles.closing : ''}`}>
                    {wordInfo ? (
                         <WordInfo 
                            wordInfo={wordInfo}
                            language={originalLanguage}
                            shouldAnimate={shouldAnimate}
                            showPronunciation={showPronunciation}
                            onClose={handleCloseWordInfo} />
                    ) : (
                        <div className={styles.sidebarIdle}>
                            <NextSteps {...nextStepsProps} />
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Analysis;
