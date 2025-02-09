'use client';
import { useState, useEffect } from 'react';
import Breakdown from '@/components/analysis/Breakdown';
import AudioPlayer from '@/components/analysis/AudioPlayer';
import WordsList from '@/components/analysis/WordsList';
import GrammarPoints from '@/components/analysis/GrammarPoints';
import WordInfo from '@/components/analysis/WordInfo';
import SentenceNotes from '@/components/analysis/SentenceNotes';


import styles from '@/styles/components/sentenceanalyzer/analysis.module.scss';

const Analysis = ({
    analysis,
    voice1,
    voice2
}) => {

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

    return(

        <div className={styles.analysis}>
          
          <div className={styles.translationHeader}>Translation:</div>
          <div className={styles.translation}>
            {analysis.sentence.english}
          </div>

          <AudioPlayer
            voice1={voice1}
            voice2={voice2} />

          <Breakdown 
            analysis={analysis} 
            wordInfo={wordInfo}
            setWordInfo={setWordInfo}
            shouldAnimate={shouldAnimate} />

          <WordInfo 
            wordInfo={wordInfo}
            shouldAnimate={shouldAnimate} />

          <SentenceNotes analysis={analysis} />

          <WordsList analysis={analysis} />

          <GrammarPoints analysis={analysis} />
        
        </div>
    )

}

export default Analysis;
