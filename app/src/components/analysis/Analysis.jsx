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
import { useLanguage } from '@/contexts/LanguageContext';
import styles from '@/styles/components/sentenceanalyzer/analysis.module.scss';

const Analysis = ({
    analysis,
    voice1,
    voice2,
    showTransition,
    sentenceId
}) => {
    const { t } = useLanguage();
    const [prevWord, setPrevWord] = useState(null);
    const [wordInfo, setWordInfo] = useState(false);
    const [shouldAnimate, setShouldAnimate] = useState(false);

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
            <SaveButton sentenceId={sentenceId} />
            
            <div className={styles.sentenceHeader}>{t('analysis.original')}:</div>
            <div className={styles.sentence}>
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
                setWordInfo={setWordInfo}
                resetLockedWord={showTransition}
                shouldAnimate={shouldAnimate} />

            <WordInfo 
                wordInfo={wordInfo}
                shouldAnimate={shouldAnimate} />

            <SentenceNotes analysis={analysis} />

            <CulturalNotes analysis={analysis} />

            <Variants analysis={analysis} />

            <WordsList analysis={analysis} />

            <GrammarPoints analysis={analysis} />
        
        </div>
    )
}

export default Analysis;
