'use client';
import { FluentCursorHover32Filled } from '@/components/icons/CursorHover';
import styles from '@/styles/components/sentenceanalyzer/wordinfo.module.scss';
import Conjugation from './Conjugation';
import { useLanguage } from '@/contexts/LanguageContext';
import renderPronunciation from '@/lib/pronunciation';
import { romanize } from '@romanize/korean';
import getFontClass from '@/lib/fontClass';

const WordInfo = ({wordInfo, shouldAnimate, language}) => {
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
        let text = wordInfo.isParticle? wordInfo.particle : wordInfo.dictionary_form
        let p = null;
        if(language === 'ko') {
            p = romanize(text);
        } else {
            p = renderPronunciation(wordInfo, language);
        }
        if(p) {
            return <span className={styles.pronunciation}>({p})</span>
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
                    {wordInfo.isParticle? wordInfo.particle : wordInfo.dictionary_form}
                    {pronunciation()}
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
                        {wordInfo.isParticle ? wordInfo.function.replaceAll('_', ' ') : wordInfo.meaning?.notes}
                        </span>
                        </li>
                    }
                    </ul>
                    
                    
                    {
                    wordInfo.grammar &&Object.keys(wordInfo?.grammar).length > 0 && (

                    <div className={styles.grammarInfo}>
                    {
                        !wordInfo.isParticle && wordInfo.grammar?.role ?
                        <div className={styles.roleInfo}>
                            {t('analysis.wordInfo.role')} <span className={styles.wordRole}>{wordInfo.grammar.role.replaceAll('_', ' ')}</span>
                        </div>
                        : wordInfo.isParticle && (
                        <div className={styles.roleInfo}>
                            {t('analysis.wordInfo.role')} <span className={styles.wordRole}>particle</span>
                        </div>
                        )
                    }
                    
                    {
                        (wordInfo.grammar.particles && wordInfo.grammar.particles.length > 0) && (
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
                                {particle.function.replaceAll('_', ' ')}
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