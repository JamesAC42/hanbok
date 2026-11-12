'use client';
import {useState, useEffect} from 'react';
import {useSearchParams} from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import styles from '@/styles/sentenceanalyzer.module.scss';
import SentenceForm from '@/components/analysis/SentenceForm';
import Analysis from '@/components/analysis/Analysis';
import { useLanguage } from '@/contexts/LanguageContext';
import getFontClass from '@/lib/fontClass';
import { resources } from '@/translations';
import TranslationSwitcher from '@/components/TranslationSwitcher';

import Tiger from '@/components/Tiger';
import Mascot from '@/components/Mascot';
import { takeSentence } from '@/lib/pendingSentence';
import { playFinishedSound } from '@/lib/finishedSound';


const SentenceAnalyzer = ({ sentenceId: propSentenceId }) => {    
    const searchParams = useSearchParams();
    const { loadSentence, isAuthenticated } = useAuth();
    const { t, language, nativeLanguage, supportedLanguages } = useLanguage();

    // Coming straight from the analyze form: it already has the analysis, so
    // draw it now and fetch the stored copy (audio keys etc.) in the background.
    const [handoff] = useState(() => takeSentence(propSentenceId));
    
    const [analysis, setAnalysis] = useState(handoff?.analysis || null);
    const [originalLanguage, setOriginalLanguage] = useState(handoff?.originalLanguage || null);
    const [translationLanguage, setTranslationLanguage] = useState(handoff?.translationLanguage || null);
    const [voice1, setVoice1] = useState(handoff?.voice1Key || null);
    const [voice2, setVoice2] = useState(handoff?.voice2Key || null);
    const [voice1Slow, setVoice1Slow] = useState(handoff?.voice1SlowKey || null);
    const [voice2Slow, setVoice2Slow] = useState(handoff?.voice2SlowKey || null);
    const [doNotCache, setDoNotCache] = useState(false);
    // The link may carry a random publicId; API calls below use the numeric id.
    const [loadedIds, setLoadedIds] = useState(handoff
        ? { sentenceId: handoff.sentenceId, publicId: handoff.publicId || null }
        : null);
    const [showTransition, setShowTransition] = useState(!!handoff);
    const [error, setError] = useState(null);
    // A /sentence/<id> link whose analysis hasn't arrived yet: show a loader,
    // not the empty analyze form (which looked like nothing had happened).
    const [loadingSentence, setLoadingSentence] = useState(!!propSentenceId && !handoff);

    const [translationMode, setTranslationMode] = useState(false);

    const handleExampleClick = (sentence) => {
        if (window.setInputText) {
            window.setInputText(sentence);
        }
    };

    // A fresh result just landed on screen: now is when "done" is true.
    useEffect(() => {
        if (handoff) playFinishedSound(handoff.sentenceId);
    }, [handoff]);

    const handleNewAnalysis = (a) => {
        setAnalysis(a);
        setOriginalLanguage(language);
        setTranslationLanguage(nativeLanguage);
        setVoice1(null);
        setVoice2(null);
        setVoice1Slow(null);
        setVoice2Slow(null);
        setDoNotCache(false);
        setLoadedIds(null);
    }
    
    useEffect(() => {
        // First check for prop sentenceId (from /sentence/[id] route)
        // Then fall back to query param (from /?id= route)
        const idToLoad = propSentenceId || searchParams.get('id');
        if (idToLoad) {
            loadSavedSentence(idToLoad);
        }
        
        // Check for pending analysis from localStorage (from tutor examples),
        // or ?text= from the browser extension on pages it can't run on.
        // A link only fills the input, so it never spends anyone's quota.
        const textParam = searchParams.get('text')?.slice(0, 1000);
        const pendingAnalysis = localStorage.getItem('pendingAnalysis') || textParam;
        if (pendingAnalysis) {
            // Clear the localStorage item
            localStorage.removeItem('pendingAnalysis');
            // The homepage asks for the breakdown to start right away.
            const run = localStorage.getItem('pendingAnalysisRun') === '1';
            localStorage.removeItem('pendingAnalysisRun');
            const fill = () => {
                if (run && window.runInputText) window.runInputText(pendingAnalysis);
                else if (window.setInputText) window.setInputText(pendingAnalysis);
            };
            
            // Set the text in the input field if the global function is available
            if (window.setInputText) {
                fill();
            } else {
                // If the function isn't available yet, try again after a short delay
                const timer = setTimeout(fill, 100);
                
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
        setLoadingSentence(false);
        if (result.success) {
            // The handed-over analysis is the same one; replacing it would only
            // re-render the page under someone who already started reading.
            if (!handoff) {
                setAnalysis(result.sentence.analysis);
                setOriginalLanguage(result.sentence.originalLanguage);
                setTranslationLanguage(result.sentence.translationLanguage);
            }
            setVoice1(result.sentence.voice1Key);
            setVoice2(result.sentence.voice2Key);
            setVoice1Slow(result.sentence.voice1SlowKey);
            setVoice2Slow(result.sentence.voice2SlowKey);
            setDoNotCache(result.sentence.doNotCache === true);
            setLoadedIds({ sentenceId: result.sentence.sentenceId, publicId: result.sentence.publicId || null });
            // Reset transition when loading saved sentence (but let a fresh result
            // that was handed over finish its entrance).
            if (!handoff) setShowTransition(false);
        } else if (!handoff) {
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
                !analysis && loadingSentence && (
                    <div className={styles.sentenceLoading} role="status" aria-live="polite">
                        <Mascot pose="cards" size={64} motion="bob" />
                    </div>
                )
            }

            { 
                !analysis && !loadingSentence &&
                (
                    <>
                    <SentenceForm
                        analysis={analysis}
                        setAnalysis={handleNewAnalysis}
                        setVoice1={setVoice1}
                        setVoice2={setVoice2}
                        setVoice1Slow={setVoice1Slow}
                        setVoice2Slow={setVoice2Slow}
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
            analysis && (
                <>
                <Analysis 
                    analysis={analysis} 
                    voice1={voice1} 
                    voice2={voice2}
                    voice1Slow={voice1Slow}
                    voice2Slow={voice2Slow}
                    originalLanguage={originalLanguage}
                    translationLanguage={translationLanguage}
                    showTransition={showTransition}
                    sentenceId={loadedIds?.sentenceId ?? null}
                    shareKey={loadedIds ? (loadedIds.publicId || loadedIds.sentenceId) : null}
                    doNotCache={doNotCache}
                    onCacheStatusChange={setDoNotCache} />
                </>
            )
            }

            {/* Floating Chat Button */}
            {analysis && loadedIds && (
                <Link 
                    href={`/tutor?sentenceId=${loadedIds.publicId || loadedIds.sentenceId}`}
                    className={styles.floatingChatButton}
                    title={t('sentenceForm.askAIHelp')}
                >
                    <Tiger size={34} />
                    <span>Ask Horangi</span>
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
