'use client';
import {useState} from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import Login from '@/components/Login';

import styles from '@/styles/sentenceanalyzer.module.scss';
import SentenceForm from '@/components/analysis/SentenceForm';
import Analysis from '@/components/analysis/Analysis';

const SentenceAnalyzer = () => {
    const { user, loading } = useAuth();
    const [analysis, setAnalysis] = useState(null);
    const [voice1, setVoice1] = useState(null);
    const [voice2, setVoice2] = useState(null);  

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!user) {
        return <Login />;
    }

    return (
        <div className={`${styles.container} ${analysis ? styles.containerWithAnalysis : ''}`}>

            <div className={styles.girlContainer}>
            <Image src="/images/girl1.png" alt="girl" width={1920} height={1080} />
            </div>
    
            <h1 className={`${styles.title} ${analysis ? styles.titleWithAnalysis : ''}`}>
            {'hanbok'.split('').map((letter, index) => (
                <span key={index} className={styles.titleLetter}>
                {letter}
                </span>
            ))}
            </h1>
    
            <h2 className={`${styles.subtitle} ${analysis ? styles.subtitleWithAnalysis : ''}`}>
                Korean Sentence Analysis Tool
            </h2>
    
            <SentenceForm
                analysis={analysis}
                setAnalysis={setAnalysis}
                setVoice1={setVoice1}
                setVoice2={setVoice2}
                />
        
            {
            analysis && 
            <Analysis 
                analysis={analysis} 
                voice1={voice1} 
                voice2={voice2} />
            }
        </div>
    )
}

export default SentenceAnalyzer;
