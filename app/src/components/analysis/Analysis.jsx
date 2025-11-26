'use client';
import { useState, useEffect } from 'react';
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
                // Add a small delay to ensure the analysis is fully rendered
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
    
    return(
        <div className={`${styles.analysis} ${showTransition ? styles.transition : ''}`}>
            
            <div className={styles.analysisControls}>
                <SaveButton sentenceId={sentenceId} />
                <SettingsButton 
                    showPronunciation={showPronunciation} 
                    setShowPronunciation={setShowPronunciation} 
                    language={originalLanguage}
                />
            </div>

            <div className={styles.breadcrumbs}>
                Sentence Breakdown {'>'} {capitalize(originalLanguage)} {'>'} {capitalize(translationLanguage)} 
            </div>
            
            <div className={styles.sentenceHeader}>{t('analysis.original')}:</div>
            <div className={`${styles.sentence} ${getFontClass(originalLanguage)}`}>
                {analysis.sentence.original}
            </div>

            <div className={styles.translationHeader}>{t('analysis.translation')}:</div>
            <div className={styles.translation}>
                {analysis.sentence.translation}
            </div>

            <AudioPlayer
                sentenceId={sentenceId}
                isLyric={isLyric}
                voice1={voice1}
                voice2={voice2}
                voice1Slow={voice1Slow}
                voice2Slow={voice2Slow} />

            <Breakdown 
                analysis={analysis} 
                language={originalLanguage}
                setWordInfo={setWordInfo}
                resetLockedWord={showTransition}
                shouldAnimate={shouldAnimate}
                showPronunciation={showPronunciation} />

            <WordInfo 
                wordInfo={wordInfo}
                language={originalLanguage}
                shouldAnimate={shouldAnimate}
                showPronunciation={showPronunciation} />

            <SentenceNotes analysis={analysis} />

            {true && (
                <LyricalDevices 
                    analysis={analysis}/>
            )}

            <CulturalNotes analysis={analysis} />

            <Variants 
                analysis={analysis} 
                language={originalLanguage}
                showPronunciation={showPronunciation} />

            <WordsList 
                analysis={analysis} 
                originalLanguage={originalLanguage} 
                translationLanguage={translationLanguage}
                showPronunciation={showPronunciation} />

            <GrammarPoints 
                analysis={analysis} 
                language={originalLanguage}
                showPronunciation={showPronunciation} />
        
        </div>
    )
}

export default Analysis;
