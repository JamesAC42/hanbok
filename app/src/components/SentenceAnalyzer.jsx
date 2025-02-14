'use client';
import {useState} from 'react';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import Login from '@/components/Login';
import Link from 'next/link';
import styles from '@/styles/sentenceanalyzer.module.scss';
import SentenceForm from '@/components/analysis/SentenceForm';
import Analysis from '@/components/analysis/Analysis';
import { LineMdTwitterX } from '@/components/icons/Twitter';
import { LineMdGithub } from '@/components/icons/Github';
import { LineMdEmail } from '@/components/icons/Email';

const SentenceAnalyzer = () => {    
    
    const [analysis, setAnalysis] = useState(null);
    const [voice1, setVoice1] = useState(null);
    const [voice2, setVoice2] = useState(null);  
    const [showTransition, setShowTransition] = useState(false);

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
                Master Korean, One Sentence at a Time
            </h2>

            <div className={`${styles.links} ${analysis ? styles.linksWithAnalysis : ''}`}>
               
                <div className={styles.linkContainer}>
                    <Link href="https://x.com/fifltriggi">
                        <LineMdTwitterX />
                    </Link>
                    <Link href="https://github.com/JamesAC42/hanbok">
                        <LineMdGithub />
                    </Link>
                    <Link href="mailto:jamescrovo450@gmail.com">
                        <LineMdEmail />
                    </Link>
                </div>
            </div>
    

            <SentenceForm
                analysis={analysis}
                setAnalysis={setAnalysis}
                setVoice1={setVoice1}
                setVoice2={setVoice2}
                setTransition={setShowTransition}
                />
        
            {
            analysis && 
            <Analysis 
                analysis={analysis} 
                voice1={voice1} 
                voice2={voice2}
                showTransition={showTransition} />
            }
        </div>
    )
}

export default SentenceAnalyzer;
