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
import { useLanguage } from '@/contexts/LanguageContext';
import styles from '@/styles/components/sentenceanalyzer/analysis.module.scss';
import getFontClass from '@/lib/fontClass';

const Analysis = ({
    analysis,
    originalLanguage,
    translationLanguage,
    voice1,
    voice2,
    showTransition,
    sentenceId
}) => {
    const { t, language } = useLanguage();
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

    useEffect(() => {
        // Set the document title based on the analysis
        // TODO: change this to follow the actual analysis object structure.
        if(analysis.sentence.length > 10) {
            document.title = `${t('analysis.pageTitle')} - ${analysis.sentence.substr(0, 10) + '...'}`;
        } else {
            document.title = `${t('analysis.pageTitle')} - ${analysis.sentence}`;
        }
    }
    , [analysis, t]);
    
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
                voice1={voice1}
                voice2={voice2} />

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
