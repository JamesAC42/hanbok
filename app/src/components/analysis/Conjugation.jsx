import styles from '@/styles/components/sentenceanalyzer/conjugation.module.scss';
import { useLanguage } from '@/contexts/LanguageContext';
import getFontClass from '@/lib/fontClass';

const Conjugation = ({
    wordInfo,
    language
}) => {
    const { t } = useLanguage();

    if (!wordInfo || !wordInfo.grammar?.conjugation) return null;

    const { conjugation } = wordInfo.grammar;
    const finalForm = wordInfo.text || wordInfo.dictionary_form;

    return (
        <div className={`${styles.conjugation} ${getFontClass(language)}`}>
            
            <div className={styles.tags}>
                {conjugation.tense && (
                    <span className={styles.tag}>
                        {conjugation.tense.replaceAll('_', ' ')}
                    </span>
                )}
                {conjugation.formality && language !== 'ja' && (
                    <span className={styles.tag}>
                        {conjugation.formality.replaceAll('_', ' ')}
                    </span>
                )}
                {/* Russian specific tags */}
                {language === 'ru' && (
                    <>
                        {conjugation.person && <span className={styles.tag}>{conjugation.person}</span>}
                        {conjugation.number && <span className={styles.tag}>{conjugation.number}</span>}
                        {conjugation.gender && <span className={styles.tag}>{conjugation.gender}</span>}
                        {conjugation.mood && <span className={styles.tag}>{conjugation.mood}</span>}
                    </>
                )}
            </div>
            
            {conjugation.steps && conjugation.steps.length > 0 && (
                <div className={styles.formulaContainer}>
                    <div className={styles.header}>{t('analysis.conjugation.steps')}:</div>
                    <div className={styles.stepsList}>
                        {conjugation.steps.map((step, index) => {
                            const stepText = typeof step === 'string' ? step : step.step;
                            const explanation = typeof step === 'string' ? null : step.explanation;

                            return (
                                <div key={index} className={styles.stepItem}>
                                    <div className={styles.stepContent}>
                                        <div className={styles.stepNumber}><span className={styles.stepNumberText}>{index + 1}</span></div>
                                        <div className={styles.stepText}>{stepText}</div>
                                    </div>
                                    {explanation && <div className={styles.stepExplanation}>{explanation}</div>}
                                    {index < conjugation.steps.length - 1 && (
                                        <div className={styles.arrow}>↓</div>
                                    )}
                                </div>
                            );
                        })}
                         <div className={styles.arrow}>↓</div>
                         <div className={`${styles.stepItem} ${styles.finalResult}`}>
                            <div className={styles.stepContent}>
                                <div className={styles.stepText}>{finalForm}</div>
                            </div>
                            <div className={styles.stepExplanation}>Final Form</div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

export default Conjugation;
