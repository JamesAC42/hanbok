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

import AboutHome from '@/components/AboutHome';


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
        
        // Check for pending analysis from localStorage (from tutor examples)
        const pendingAnalysis = localStorage.getItem('pendingAnalysis');
        if (pendingAnalysis) {
            // Clear the localStorage item
            localStorage.removeItem('pendingAnalysis');
            
            // Set the text in the input field if the global function is available
            if (window.setInputText) {
                window.setInputText(pendingAnalysis);
            } else {
                // If the function isn't available yet, try again after a short delay
                const timer = setTimeout(() => {
                    if (window.setInputText) {
                        window.setInputText(pendingAnalysis);
                    }
                }, 100);
                
                return () => clearTimeout(timer);
            }
        }

    }, [searchParams, isAuthenticated, propSentenceId]);
    

    useEffect(() => {
        // Set the document title based on the analysis
        console.log('analysis', analysis);
        if(!!analysis) {
            if(analysis?.sentence?.original?.length > 10) {
                document.title = `${t('analysis.pageTitle')} - ${analysis.sentence.original.substr(0, 10) + '...'}`;
            } else {
                document.title = `${t('analysis.pageTitle')} - ${analysis.sentence.original}`;
            }
        }
    }
    , [analysis]);

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
    
            { 
                !analysis && false && (
                <TranslationSwitcher 
                    translationMode={translationMode}
                    setTranslationMode={setTranslationMode}
                    originalLanguage={originalLanguage}
                    translationLanguage={translationLanguage}
                    analysis={!!analysis}
                />
                )
            }

            { 
                !analysis && 
                (
                    <>
                    <SentenceForm
                        analysis={analysis}
                        setAnalysis={handleNewAnalysis}
                        setVoice1={setVoice1}
                        setVoice2={setVoice2}
                        setTransition={setShowTransition}
                        translationMode={translationMode}
                        setTranslationMode={setTranslationMode}
                        />
                    <h3 className={styles.tryExampleHeader}>{t('home.tryExample')}</h3>
                    <div className={styles.testSentences}>
                        {(translationMode ? getNativeExampleSentences() : getExampleSentences()).map((sentence, index) => (
                            <div 
                                key={index} 
                                className={`${styles.exampleSentence} ${language === 'ko' ? styles.koreanSans : getFontClass(language)}`}
                                onClick={() => handleExampleClick(sentence)}
                                role="button"
                                tabIndex={0}
                            >
                                {sentence}
                            </div>
                        ))}
                    </div>
                    </>
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

            {/* Floating Chat Button */}
            {analysis && (propSentenceId || searchParams.get('id')) && (
                <Link 
                    href={`/tutor?sentenceId=${propSentenceId || searchParams.get('id')}`}
                    className={styles.floatingChatButton}
                    title={t('sentenceForm.askAIHelp')}
                >
                    <IcBaselineLiveHelp />
                    <span>{t('sentenceForm.askAI')}</span>
                </Link>
            )}

            {error && (
                <div className={styles.error}>
                    {error}
                </div>
            )}
        </div>
    )
}

export default SentenceAnalyzer;
