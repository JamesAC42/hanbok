'use client';
import { FluentCursorHover32Filled } from '@/components/icons/CursorHover';
import styles from '@/styles/components/sentenceanalyzer/wordinfo.module.scss';
import Conjugation from './Conjugation';
import { useLanguage } from '@/contexts/LanguageContext';
import renderPronunciation from '@/lib/pronunciation';
import { romanize } from '@romanize/korean';
import getFontClass from '@/lib/fontClass';

const WordInfo = ({wordInfo, shouldAnimate, language, showPronunciation}) => {
    const { t } = useLanguage();
    
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
                p = romanize(text);
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

    return(
        <>
        {wordInfo && (
            <div 
                className={`${styles.wordInfoContainer} ${shouldAnimate ? styles.animate : ''} ${getFontClass(language)}`}
                data-role={wordInfo.isParticle ? 'particle' : getCleanedType(wordInfo.type)}
            >
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
                    <span className={styles.dictionaryFormInner}>
                        {wordInfo.isParticle? wordInfo.particle : wordInfo.dictionary_form}
                        {language === 'ru' ? transliteration() : pronunciation()}
                    </span>
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