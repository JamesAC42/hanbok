'use client';
import { useEffect, useRef, useState } from 'react';
import { FluentCursorHover32Filled } from '@/components/icons/CursorHover';
import { MaterialSymbolsVolumeUp } from '@/components/icons/VolumeOn';
import { SvgSpinnersRingResize } from '@/components/icons/RingSpin';
import styles from '@/styles/components/sentenceanalyzer/wordinfo.module.scss';
import Conjugation from './Conjugation';
import { useLanguage } from '@/contexts/LanguageContext';
import renderPronunciation from '@/lib/pronunciation';
import kpop from 'kpop';
import getFontClass from '@/lib/fontClass';

const WordInfo = ({wordInfo, shouldAnimate, language, showPronunciation, onClose}) => {
    const { t } = useLanguage();
    const [audioUrl, setAudioUrl] = useState(null);
    const [isAudioLoading, setIsAudioLoading] = useState(false);
    const [isAudioPlaying, setIsAudioPlaying] = useState(false);
    const [audioError, setAudioError] = useState(null);
    const audioRef = useRef(null);

    const getDictionaryWord = () => {
      if (!wordInfo) return '';
      return wordInfo.isParticle ? wordInfo.particle : wordInfo.dictionary_form;
    };

    const getWordTranslation = () => {
      if (!wordInfo) return '';
      // Prefer a clear meaning/translation, fall back to the dictionary form so Japanese requests don't fail
      return wordInfo.meaning?.description || wordInfo.translation || wordInfo.dictionary_form || '';
    };

    useEffect(() => {
      // Reset audio state when switching words or languages
      setAudioUrl(null);
      setIsAudioPlaying(false);
      setAudioError(null);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    }, [wordInfo, language]);

    useEffect(() => {
      return () => {
        if (audioRef.current) {
          audioRef.current.pause();
          audioRef.current = null;
        }
      };
    }, []);
    
    const getCleanedType = (wordType) => {
      if (!wordType) {
        return '';
      }
      return wordType.replaceAll(' ', '_').toLowerCase();
    }
  
    const getDisplayType = (wordType) => {
      if (!wordType) {
        return '';
      }
      return wordType.replaceAll('_', ' ').toUpperCase();
    }

    const pronunciation = () => {
        if (!showPronunciation) return null;
        
        let text = wordInfo.isParticle? wordInfo.particle : wordInfo.dictionary_form
        let p = null;
        if(language === 'ko') {
            try {
                p = kpop.romanize(text);
            } catch(err) {
                p = text;
            }
        } else {
            p = renderPronunciation(wordInfo, language);
        }
        if(p) {
            return <span className={styles.pronunciation}>({p})</span>
        }
        return null;
    }

    // For Russian transliteration display
    const transliteration = () => {
        if (!showPronunciation) return null;
        
        if (language === 'ru' && wordInfo.transliteration) {
            return <span className={styles.transliteration}>[{wordInfo.transliteration}]</span>
        }
        return null;
    }

    const prepareAudioElement = (url) => {
        if (!url) return null;

        if (audioRef.current) {
            audioRef.current.pause();
            audioRef.current.src = url;
        } else if (typeof Audio !== 'undefined') {
            audioRef.current = new Audio(url);
        }

        if (!audioRef.current) return null;

        audioRef.current.onended = () => setIsAudioPlaying(false);
        audioRef.current.onpause = () => setIsAudioPlaying(false);
        audioRef.current.onplay = () => setIsAudioPlaying(true);

        return audioRef.current;
    };

    const fetchAudioUrl = async () => {
        const dictionaryWord = getDictionaryWord();
        if (!dictionaryWord || isAudioLoading) return null;

        setIsAudioLoading(true);
        setAudioError(null);

        try {
            const params = new URLSearchParams({
                word: dictionaryWord,
                language
            });

            const translation = getWordTranslation();
            if (language === 'ja' && translation) {
                params.append('translation', translation);
            }

            const response = await fetch(`/api/word-audio?${params.toString()}`, {
                credentials: 'include'
            });

            const data = await response.json();

            if (!response.ok || !data.success || !data.audioUrl) {
                const message = data?.message || 'Unable to load audio';
                throw new Error(message);
            }

            setAudioUrl(data.audioUrl);
            prepareAudioElement(data.audioUrl);
            return data.audioUrl;
        } catch (error) {
            console.error('Error fetching word audio:', error);
            setAudioError(error.message);
            return null;
        } finally {
            setIsAudioLoading(false);
        }
    };

    const handlePlayAudio = async () => {
        const dictionaryWord = getDictionaryWord();
        if (!dictionaryWord) return;

        if (isAudioPlaying && audioRef.current) {
            audioRef.current.pause();
            return;
        }

        let url = audioUrl;
        if (!url) {
            url = await fetchAudioUrl();
        } else if (!audioRef.current) {
            prepareAudioElement(url);
        }

        if (!url || !audioRef.current) return;

        try {
            await audioRef.current.play();
            setIsAudioPlaying(true);
        } catch (error) {
            console.error('Error playing word audio:', error);
            setAudioError('Unable to play audio');
        }
    };

    return(
        <>
        {wordInfo && (
            <div 
                className={`${styles.wordInfoContainer} ${shouldAnimate ? styles.animate : ''} ${getFontClass(language)}`}
                data-role={wordInfo.isParticle ? 'particle' : getCleanedType(wordInfo.type)}
            >
                <div className={styles.mobileHandle} onClick={onClose}>
                    <div className={styles.handleBar}></div>
                </div>
                <div className={styles.wordInfoBackground}></div>
                <div className={styles.wordInfoContainerInner}>

                {
                    wordInfo.type && (
                    <div className={`${styles.type} ${getFontClass(language)}`}>
                        {
                        wordInfo.isParticle ? 
                            "PARTICLE" : 
                            getDisplayType(wordInfo.type_translated)
                        }
                    </div>
                    )
                }
                
                <div className={`${styles.dictionaryForm} ${getFontClass(language)}`}>
                    <div className={styles.dictionaryFormRow}>
                        <span className={styles.dictionaryFormInner}>
                            {wordInfo.isParticle? wordInfo.particle : wordInfo.dictionary_form}
                            {language === 'ru' ? transliteration() : pronunciation()}
                        </span>
                        <button
                            type="button"
                            className={`${styles.audioButton} ${isAudioPlaying ? styles.audioButtonActive : ''}`}
                            onClick={handlePlayAudio}
                            disabled={!wordInfo || isAudioLoading}
                            aria-label={`Play audio for ${getDictionaryWord()}`}
                        >
                            {
                                isAudioLoading ? <SvgSpinnersRingResize /> : <MaterialSymbolsVolumeUp />
                            }
                        </button>
                    </div>
                    {audioError && (
                        <div className={styles.audioStatus}>{audioError}</div>
                    )}
                </div>

                <div className={styles.wordInfoContent}>
                    <ul>
                    {
                        !wordInfo.isParticle? 
                            
                        <li>
                        {wordInfo.meaning?.description}
                        </li> : null 
                    }
                    {
                        ((wordInfo.isParticle && wordInfo.function) ||
                        (!wordInfo.isParticle && wordInfo.meaning?.notes)) &&
                        <li>
                        <span className={styles.notes}>
                        {
                            wordInfo.isParticle ? 
                            `${t('analysis.wordInfo.function')}: ` : 
                            `${t('analysis.wordInfo.notes')}: `
                        }
                        {wordInfo.isParticle ? wordInfo.function?.replaceAll('_', ' ') : wordInfo.meaning?.notes}
                        </span>
                        </li>
                    }
                    {
                        wordInfo.meaning?.poetic_meaning && (
                            <li><span className={styles.poeticMeaning}>{t('analysis.wordInfo.poeticMeaning')}: {wordInfo.meaning.poetic_meaning}</span></li>
                        )
                    }
                    </ul>
                    
                    
                    {
                    wordInfo.grammar &&Object.keys(wordInfo?.grammar).length > 0 && (

                    <div className={styles.grammarInfo}>
                    {
                        !wordInfo.isParticle && wordInfo.grammar?.role ?
                        <div className={styles.roleInfo}>
                            {t('analysis.wordInfo.role')} <span className={styles.wordRole}>{wordInfo.grammar.role?.replaceAll('_', ' ')}</span>
                        </div>
                        : wordInfo.isParticle && (
                        <div className={styles.roleInfo}>
                            {t('analysis.wordInfo.role')}: <span className={styles.wordRole}>particle</span>
                        </div>
                        )
                    }

                    {/* Russian-specific case information */}
                    {
                        language === 'ru' && typeof(wordInfo.grammar?.case) === 'object' && Object.keys(wordInfo.grammar.case).length > 0 &&
                        <div className={styles.caseInfo}>
                            {t('analysis.wordInfo.case')} <span className={styles.wordCase}>{wordInfo.grammar.case?.name?.replaceAll('_', ' ')}</span><br/>
                            {t('analysis.wordInfo.notes')}: {wordInfo.grammar.case?.function}
                        </div>
                    }

                    {/* Russian-specific aspect information */}
                    {
                        language === 'ru' && typeof(wordInfo.grammar?.conjugation?.aspect) === 'string' &&
                        <div className={styles.aspectInfo}>
                            {t('analysis.wordInfo.aspect')} <span className={styles.wordAspect}>{wordInfo.grammar.conjugation?.aspect?.replaceAll('_', ' ')}</span>
                        </div>
                    }

                    {/* Chinese-specific aspect information */}
                    {
                        language === 'zh' && wordInfo.grammar?.aspect &&
                        <div className={styles.aspectInfo}>
                            {t('analysis.wordInfo.aspect')} <span className={styles.wordAspect}>{wordInfo.grammar.aspect.type}</span><br/>
                            {t('analysis.wordInfo.notes')}: {wordInfo.grammar.aspect.explanation}
                        </div>
                    }

                    {/* Vietnamese-specific aspect information */}
                    {
                        language === 'vi' && wordInfo.grammar?.aspect &&
                        <div className={styles.aspectInfo}>
                            {/* Aspect marker */}
                            {wordInfo.grammar.aspect.marker && (
                                <div className={styles.aspectMarker}>
                                    {t('analysis.wordInfo.aspectMarker')} <span className={styles.wordAspectMarker}>{wordInfo.grammar.aspect.marker}</span>
                                </div>
                            )}
                            
                            {/* Tense */}
                            {wordInfo.grammar.aspect.tense && (
                                <div className={styles.aspectTense}>
                                    {t('analysis.wordInfo.tense')} <span className={styles.wordAspectTense}>{wordInfo.grammar.aspect.tense}</span>
                                </div>
                            )}
                            
                            {/* Mood */}
                            {wordInfo.grammar.aspect.mood && (
                                <div className={styles.aspectMood}>
                                    {t('analysis.wordInfo.mood')} <span className={styles.wordAspectMood}>{wordInfo.grammar.aspect.mood}</span>
                                </div>
                            )}
                            
                            {/* Aspect explanation */}
                            {wordInfo.grammar.aspect.steps && wordInfo.grammar.aspect.steps.length > 0 && (
                                <div className={styles.aspectExplanation}>
                                    {wordInfo.grammar.aspect.steps.map((step, index) => (
                                        <div key={index} className={styles.aspectExplanationItem}>
                                            <div className={styles.aspectExplanationLabel}>
                                                {step.step}:
                                            </div>
                                            <div className={styles.aspectExplanationText}>
                                                {step.explanation}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    }

                    {/* Indonesian-specific affixation information */}
                    {
                        language === 'id' && wordInfo.grammar?.affixation &&
                        <div className={styles.affixationInfo}>
                            {/* Affixation structure */}
                            {wordInfo.grammar.affixation.structure && (
                                <div className={styles.affixationStructure}>
                                    {t('analysis.wordInfo.affixationStructure')} <span className={styles.wordAffixationStructure}>{wordInfo.grammar.affixation.structure}</span>
                                </div>
                            )}
                            
                            {/* Voice */}
                            {wordInfo.grammar.affixation.voice && (
                                <div className={styles.affixationVoice}>
                                    {t('analysis.wordInfo.voice')} <span className={styles.wordAffixationVoice}>{wordInfo.grammar.affixation.voice}</span>
                                </div>
                            )}
                            
                            {/* Politeness */}
                            {wordInfo.grammar.affixation.politeness && (
                                <div className={styles.affixationPoliteness}>
                                    {t('analysis.wordInfo.politeness')} <span className={styles.wordAffixationPoliteness}>{wordInfo.grammar.affixation.politeness}</span>
                                </div>
                            )}
                            
                            {/* Affixation steps */}
                            {wordInfo.grammar.affixation.steps && wordInfo.grammar.affixation.steps.length > 0 && (
                                <div className={styles.affixationSteps}>
                                    <div className={styles.affixationStepsHeader}>
                                        {t('analysis.wordInfo.affixationSteps')}
                                    </div>
                                    <div className={styles.affixationStepsContent}>
                                        {wordInfo.grammar.affixation.steps.map((step, index) => (
                                            <div key={index} className={styles.affixationStep}>
                                                <div className={styles.affixationStepNumber}>
                                                    {index + 1}
                                                </div>
                                                <div className={styles.affixationStepContent}>
                                                    <div className={styles.affixationStepText}>
                                                        {step.step}
                                                    </div>
                                                    <div className={styles.affixationStepExplanation}>
                                                        {step.explanation}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    }

                    {/* Hindi-specific postpositions information */}
                    {
                        language === 'hi' && wordInfo.grammar?.postpositions && wordInfo.grammar.postpositions.length > 0 && (
                        <div className={styles.postpositionsInfo}>
                            <div className={styles.postpositionsHeader}>
                                {t('analysis.wordInfo.postpositions')}
                            </div>
                            <div className={styles.postpositionsContent}>
                                {wordInfo.grammar.postpositions.map((postposition, index) => (
                                    <div key={index} className={styles.postpositionItem}>
                                        <span className={styles.postpositionText}>
                                            {postposition.postposition}
                                        </span>
                                        <span className={styles.postpositionFunction}>
                                            {postposition.function?.replaceAll('_', ' ')}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        )
                    }

                    {
                        wordInfo.grammar?.structure &&
                        <div className={styles.structureInfo}>
                            {t('analysis.wordInfo.structure')} <span className={styles.wordStructure}>{wordInfo.grammar.structure.pattern}</span><br/>
                            {t('analysis.wordInfo.notes')}: {wordInfo.grammar.structure.function}
                        </div>
                    }
                    
                    {/* Japanese-specific conjugation form display */}
                    {
                        language === 'ja' && wordInfo.grammar?.conjugation?.form &&
                        <div className={styles.formInfo}>
                            {t('analysis.wordInfo.form')} <span className={styles.wordForm}>{wordInfo.grammar.conjugation?.form?.replaceAll('_', ' ')}</span><br/>
                            {wordInfo.grammar.conjugation?.politeness && 
                                <div className={styles.politenessInfo}>
                                    {t('analysis.wordInfo.politeness')}: {wordInfo.grammar.conjugation?.politeness?.replaceAll('_', ' ')}
                                </div>
                            }
                        </div>
                    }
                    
                    {
                        (wordInfo.grammar?.particles && wordInfo.grammar.particles.length > 0) && (
                        <div className={styles.wordInfoParticles}>
                            <div className={styles.wordInfoParticlesHeader}>
                            {t('analysis.wordInfo.particles')}
                            </div>
                            <div className={styles.wordInfoParticlesContent}>
                            {wordInfo.grammar.particles.map((particle, index) => (
                            <div key={index} className={styles.wordInfoParticle}>
                                <span className={styles.particleText}>
                                {particle.particle}
                                </span>
                                <span className={styles.particleFunction}>
                                {particle.function?.replaceAll('_', ' ')}
                                </span>
                                </div>
                            ))}
                            </div>
                        </div>
                        )
                    }

                    {
                        (wordInfo.grammar?.conjugation) && <Conjugation language={language} wordInfo={wordInfo} />
                    }
                    </div>
                    )}
                </div>
                </div>
            </div>
            )}

            {!wordInfo && (
            <div className={styles.wordInfoPlaceholder}>
                <FluentCursorHover32Filled />
                {t('analysis.hoverExplanation', 'Hover over a word for explanation.')}
            </div>
            )}
        </>
    )
}

export default WordInfo;
