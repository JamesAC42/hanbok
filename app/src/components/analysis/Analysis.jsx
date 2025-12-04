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
import SettingsButton from '@/components/analysis/SettingsButton';
import LyricalDevices from '@/components/analysis/LyricalDevices';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import { usePopup } from '@/contexts/PopupContext';
import styles from '@/styles/components/sentenceanalyzer/analysis.module.scss';
import getFontClass from '@/lib/fontClass';
import QuotaDisplay from '@/components/QuotaDisplay';
import { FluentCursorHover32Filled } from '@/components/icons/CursorHover';
import RecentlyAnalyzed from '@/components/analysis/RecentlyAnalyzed';

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
    isLyric
}) => {
    const { t, language } = useLanguage();
    const { user } = useAuth();
    const { showPromoPopup } = usePopup();
    const [prevWord, setPrevWord] = useState(null);
    const [wordInfo, setWordInfo] = useState(false);
    const [shouldAnimate, setShouldAnimate] = useState(false);
    const [showPronunciation, setShowPronunciation] = useState(true);
    const [activeSection, setActiveSection] = useState('breakdown');
    const [isScrolled, setIsScrolled] = useState(false);
    const [isClosing, setIsClosing] = useState(false);

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

    // Handle scroll state
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

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
    
    return(
        <div className={`${styles.analysis} ${showTransition ? styles.transition : ''}`}>
            
            {/* Navigation */}
            {!isLyric && (
            <nav className={`${styles.navigation} ${isScrolled ? styles.scrolled : ''}`}>
                <button onClick={() => scrollToSection('breakdown')} className={activeSection === 'breakdown' ? styles.active : ''}>Breakdown</button>
                {analysis.sentence.context && <button onClick={() => scrollToSection('notes')} className={activeSection === 'notes' ? styles.active : ''}>Notes</button>}
                <button onClick={() => scrollToSection('words')} className={activeSection === 'words' ? styles.active : ''}>Words</button>
                <button onClick={() => scrollToSection('grammar')} className={activeSection === 'grammar' ? styles.active : ''}>Grammar</button>
                
                <div className={styles.embeddedControls}>
                    <SaveButton sentenceId={sentenceId} />
                    <SettingsButton 
                        showPronunciation={showPronunciation} 
                        setShowPronunciation={setShowPronunciation} 
                        language={originalLanguage}
                    />
                </div>
            </nav>
            )}

            {!isLyric && <QuotaDisplay />}

            <div className={styles.mainGrid}>
                <div className={styles.contentColumn}>
                    
                    {/* Header Card */}
                    <div ref={sectionRefs.breakdown} className={`${styles.card} ${styles.headerSection}`}>
                        <div className={styles.breadcrumbs}>
                            {capitalize(originalLanguage)} • {capitalize(translationLanguage)} 
                        </div>
                        
                        <div className={`${styles.sentence} ${getFontClass(originalLanguage)}`}>
                            {analysis.sentence.original}
                        </div>

                        <div className={styles.translation}>
                            {analysis.sentence.translation}
                        </div>

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
                            showPronunciation={showPronunciation} />
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
                            showPronunciation={showPronunciation} />
                    </div>

                    {/* Grammar Points */}
                    <div ref={sectionRefs.grammar} className={styles.card}>
                        <GrammarPoints 
                            analysis={analysis} 
                            language={originalLanguage}
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
                        <div className={styles.placeholderState}>
                            <FluentCursorHover32Filled />
                            <p>{t('analysis.hoverExplanation', 'Select a word to see details')}</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}

export default Analysis;
