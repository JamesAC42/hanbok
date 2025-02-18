'use client';
import {useState, useEffect} from 'react';
import {useSearchParams} from 'next/navigation';
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

const SentenceAnalyzer = ({ sentenceId: propSentenceId }) => {    
    const searchParams = useSearchParams();
    const { loadSentence, isAuthenticated } = useAuth();
    
    const [analysis, setAnalysis] = useState(null);
    const [voice1, setVoice1] = useState(null);
    const [voice2, setVoice2] = useState(null);  
    const [showTransition, setShowTransition] = useState(false);
    const [error, setError] = useState(null);
    const [siteStats, setSiteStats] = useState(null);

    const exampleSentences = [
        "그는 음악을 듣다가 잠들었어요.",
        "어제 도서관에서 열심히 공부했어요.",
        "버스 타임을 확인해 주세요.",
        "맛있는 음식을 먹고 기분이 좋아졌어요."
    ];

    const handleExampleClick = (sentence) => {
        if (window.setInputText) {
            window.setInputText(sentence);
        }
    };

    useEffect(() => {
        // First check for prop sentenceId (from /sentence/[id] route)
        // Then fall back to query param (from /?id= route)
        const idToLoad = propSentenceId || searchParams.get('id');
        if (idToLoad && isAuthenticated) {
            loadSavedSentence(idToLoad);
        }
        fetchSiteStats();
    }, [searchParams, isAuthenticated, propSentenceId]);

    const loadSavedSentence = async (id) => {
        const result = await loadSentence(id);
        if (result.success) {
            setAnalysis(result.sentence.analysis);
            setVoice1(result.sentence.voice1Key);
            setVoice2(result.sentence.voice2Key);
            setShowTransition(false); // Reset transition when loading saved sentence
        } else {
            setError(result.error);
        }
    };

    const fetchSiteStats = async () => {
        try {
            const response = await fetch('/api/stats');
            const data = await response.json();
            if (data.success) {
                setSiteStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching site stats:', error);
        }
    };

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
    

            {siteStats && (
                <div className={`${styles.statsContainer} ${analysis ? styles.statsContainerWithAnalysis : ''}`}>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber}>{siteStats.totalSentences.toLocaleString()}</span>
                        <span className={styles.statLabel}>Sentences Analyzed</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber}>{siteStats.totalWords.toLocaleString()}</span>
                        <span className={styles.statLabel}>Words Being Learned</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber}>{siteStats.totalUsers.toLocaleString()}</span>
                        <span className={styles.statLabel}>Users Learning Now</span>
                    </div>
                </div>
            )}

            <SentenceForm
                analysis={analysis}
                setAnalysis={setAnalysis}
                setVoice1={setVoice1}
                setVoice2={setVoice2}
                setTransition={setShowTransition}
                />

            {
                !analysis && <div className={styles.testSentences}>
                    <h3>Or try an example sentence:</h3>
                    {exampleSentences.map((sentence, index) => (
                        <div 
                            key={index} 
                            className={styles.exampleSentence}
                            onClick={() => handleExampleClick(sentence)}
                            role="button"
                            tabIndex={0}
                        >
                            {sentence}
                        </div>
                    ))}
                </div>
            }
        
            {
            analysis && 
            <Analysis 
                analysis={analysis} 
                voice1={voice1} 
                voice2={voice2}
                showTransition={showTransition}
                sentenceId={propSentenceId || searchParams.get('id')} />
            }

            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}
        </div>
    )
}

export default SentenceAnalyzer;
