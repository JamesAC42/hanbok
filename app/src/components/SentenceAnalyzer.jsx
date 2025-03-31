'use client';
import {useState, useEffect} from 'react';
import {useSearchParams} from 'next/navigation';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import styles from '@/styles/sentenceanalyzer.module.scss';
import SentenceForm from '@/components/analysis/SentenceForm';
import Analysis from '@/components/analysis/Analysis';
import ChangeLanguageButton from '@/components/ChangeLanguageButton';
import { useLanguage } from '@/contexts/LanguageContext';
import getFontClass from '@/lib/fontClass';
import { resources } from '@/translations';
import TranslationSwitcher from '@/components/TranslationSwitcher';

import {FluentHatGraduation32Filled} from '@/components/icons/GradCap';
import {IcSharpQueueMusic} from '@/components/icons/MusicLyrics';
import {IcBaselineLiveHelp} from '@/components/icons/QuestionBubble';


const SentenceAnalyzer = ({ sentenceId: propSentenceId }) => {    
    const searchParams = useSearchParams();
    const { loadSentence, isAuthenticated } = useAuth();
    const { t, language, nativeLanguage, supportedLanguages } = useLanguage();
    
    const [analysis, setAnalysis] = useState(null);
    const [originalLanguage, setOriginalLanguage] = useState(null);
    const [translationLanguage, setTranslationLanguage] = useState(null);
    const [voice1, setVoice1] = useState(null);
    const [voice2, setVoice2] = useState(null);  
    const [showTransition, setShowTransition] = useState(false);
    const [error, setError] = useState(null);
    const [siteStats, setSiteStats] = useState(null);

    const [translationMode, setTranslationMode] = useState(false);

    const handleExampleClick = (sentence) => {
        if (window.setInputText) {
            window.setInputText(sentence);
        }
    };

    const handleNewAnalysis = (a) => {
        setAnalysis(a);
        setOriginalLanguage(language);
        setTranslationLanguage(nativeLanguage);
    }

    useEffect(() => {
        // First check for prop sentenceId (from /sentence/[id] route)
        // Then fall back to query param (from /?id= route)
        const idToLoad = propSentenceId || searchParams.get('id');
        if (idToLoad) {
            loadSavedSentence(idToLoad);
        }
        fetchSiteStats();
    }, [searchParams, isAuthenticated, propSentenceId]);

    const loadSavedSentence = async (id) => {
        const result = await loadSentence(id);
        if (result.success) {
            setAnalysis(result.sentence.analysis);
            setOriginalLanguage(result.sentence.originalLanguage);
            setTranslationLanguage(result.sentence.translationLanguage);
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

    const getLocalizedSubtitle = () => {
        const languageKey = supportedLanguages[language];
        const languageName = t(`languages.${languageKey}`);
        return t('home.subtitle').replace('{language}', languageName);
    };

    const getNativeExampleSentences = () => {
        const learningLanguageTranslations = resources[nativeLanguage];
        return learningLanguageTranslations?.home?.exampleSentences || [];
    }

    // Get example sentences in the learning language
    const getExampleSentences = () => {
        // Get the translations object for the learning language
        const learningLanguageTranslations = resources[language];
        return learningLanguageTranslations?.home?.exampleSentences || [];
    };

    return (
        <div className={`${styles.container} ${analysis ? styles.containerWithAnalysis : ''}`}>

            <div className={`${styles.girlContainer} ${analysis ? styles.hidden : ''}`}>
                <Image src="/images/hanbokgirl.png" alt={t('login.girlImageAlt')} width={1024} height={1536} />
            </div>
    
            <h1 className={`${styles.title} ${analysis ? styles.titleWithAnalysis : ''}`}>
            {'hanbok'.split('').map((letter, index) => (
                <span key={index} className={styles.titleLetter}>
                {letter}
                </span>
            ))}
            </h1>
    
            <h2 className={`${styles.subtitle} ${analysis ? styles.subtitleWithAnalysis : ''}`}>
                {getLocalizedSubtitle()}
            </h2>

            <div className={styles.changeNativeLanguageOuter}>
                <ChangeLanguageButton native={true} />
            </div>

            <TranslationSwitcher 
                translationMode={translationMode}
                setTranslationMode={setTranslationMode}
                originalLanguage={originalLanguage}
                translationLanguage={translationLanguage}
                analysis={!!analysis}
            />

            {
                // !analysis && (
                //     <a className={styles.aboutLink} href="/about">What is this?</a>
                // )
            }

            <SentenceForm
                analysis={analysis}
                setAnalysis={handleNewAnalysis}
                setVoice1={setVoice1}
                setVoice2={setVoice2}
                setTransition={setShowTransition}
                translationMode={translationMode}
                />

            {
                !analysis && (
                    <div className={styles.infoContainer}>
    

                    {
                        !analysis && <div className={styles.testSentences}>
                            <h3>{t('home.tryExample')}</h3>
                            {(translationMode ? getNativeExampleSentences() : getExampleSentences()).map((sentence, index) => (
                                <div 
                                    key={index} 
                                    className={`${styles.exampleSentence} ${getFontClass(language)}`}
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
                        siteStats && (
                            <div className={`${styles.statsContainer} ${analysis ? styles.statsContainerWithAnalysis : ''}`}>
                                <div className={styles.statItem}>
                                    <span className={styles.statNumber}>{siteStats.totalSentences.toLocaleString()}</span>
                                    <span className={styles.statLabel}>{t('home.stats.sentencesAnalyzed')}</span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statNumber}>{siteStats.totalWords.toLocaleString()}</span>
                                    <span className={styles.statLabel}>{t('home.stats.wordsLearned')}</span>
                                </div>
                                <div className={styles.statItem}>
                                    <span className={styles.statNumber}>{siteStats.totalUsers.toLocaleString()}</span>
                                    <span className={styles.statLabel}>{t('home.stats.activeUsers')}</span>
                                </div>
                            </div>
                        )
                    }

                        <div className={styles.quickLinks}>
                            <Link href="/about" className={styles.quickLink}>
                                <div className={styles.quickLinkIcons}>
                                    <IcBaselineLiveHelp />
                                </div>
                                <div className={styles.quickLinkText}>
                                    Learn more about Hanbok
                                </div>
                            </Link>
                            <Link href="/cards" className={styles.quickLink}>
                                <div className={styles.quickLinkIcons}>
                                    <FluentHatGraduation32Filled />
                                </div>
                                <div className={styles.quickLinkText}>
                                    Study with spaced repetition flashcards
                                </div>                            
                            </Link>
                        </div>
                    
                        <div className={styles.legal}>
                                <a href="/terms-of-service.html">Terms of Service</a>
                                <a href="/privacy-policy.html">Privacy Policy</a>
                        </div>
                        <div className={styles.copyright}>
                            © 2025 Hanbok Study. All rights reserved.
                        </div> 

                    </div>
                )
            }
        
            {
            analysis && 
            <Analysis 
                analysis={analysis} 
                voice1={voice1} 
                voice2={voice2}
                originalLanguage={originalLanguage}
                translationLanguage={translationLanguage}
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
