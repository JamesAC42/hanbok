import styles from '@/styles/components/sentenceanalyzer/conjugation.module.scss';
import { useLanguage } from '@/contexts/LanguageContext';
import getFontClass from '@/lib/fontClass';


const Conjugation = ({
    wordInfo,
    language
}) => {
    const { t } = useLanguage();

    const fillSteps = () => {
        if (!wordInfo.grammar.conjugation.steps || wordInfo.grammar.conjugation.steps.length === 0) {
            return true;
        }
        return false;
    }

    const renderStep = (step, index) => {
        if (typeof step === 'string') return step;
        
        return (
            <tr key={index} className={styles.step}>
                <td className={styles.stepNumber}>{index + 1}</td>
                <td className={styles.stepText}>{step.step}</td>
                <td className={styles.explanation}>{step.explanation}</td>
            </tr>
        )
    }

    if (!wordInfo) return null;
    if (!wordInfo.grammar?.conjugation) return null;

    return (
        <div className={`${styles.conjugation} ${getFontClass(language)} ${fillSteps() ? styles.fillSteps : ''}`}>
            
            <div className={styles.additionalInfo}>
            {
            wordInfo.grammar.conjugation.tense && (
                <div className={`${styles.tense}`}>
                <span className={styles.tenseLabel}>
                    {t('analysis.conjugation.tense')}:
                </span>
                <span className={styles.tenseValue}>
                    {wordInfo.grammar.conjugation.tense.replaceAll('_', ' ')}
                </span>
                </div>
            )
            }

            {
            wordInfo.grammar.conjugation.formality && language !== 'ja' && (
                <div className={`${styles.formality}`}>
                <span className={styles.formalityLabel}>
                    {t('analysis.conjugation.formality')}:
                </span>
                <span className={styles.formalityValue}>
                    {wordInfo.grammar.conjugation.formality.replaceAll('_', ' ')}
                </span>
                </div>
            )
            }

            {/* Russian-specific conjugation information */}
            {
            language === 'ru' && wordInfo.grammar.conjugation.person && (
                <div className={`${styles.person}`}>
                <span className={styles.personLabel}>
                    {t('analysis.conjugation.person')}:
                </span>
                <span className={styles.personValue}>
                    {wordInfo.grammar.conjugation.person.replaceAll('_', ' ')}
                </span>
                </div>
            )
            }

            {
            language === 'ru' && wordInfo.grammar.conjugation.number && (
                <div className={`${styles.number}`}>
                <span className={styles.numberLabel}>
                    {t('analysis.conjugation.number')}:
                </span>
                <span className={styles.numberValue}>
                    {wordInfo.grammar.conjugation.number.replaceAll('_', ' ')}
                </span>
                </div>
            )
            }

            {
            language === 'ru' && wordInfo.grammar.conjugation.gender && (
                <div className={`${styles.gender}`}>
                <span className={styles.genderLabel}>
                    {t('analysis.conjugation.gender')}:
                </span>
                <span className={styles.genderValue}>
                    {wordInfo.grammar.conjugation.gender.replaceAll('_', ' ')}
                </span>
                </div>
            )
            }

            {
            language === 'ru' && wordInfo.grammar.conjugation.mood && (
                <div className={`${styles.mood}`}>
                <span className={styles.moodLabel}>
                    {t('analysis.conjugation.mood')}:
                </span>
                <span className={styles.moodValue}>
                    {wordInfo.grammar.conjugation.mood.replaceAll('_', ' ')}
                </span>
                </div>
            )
            }
            </div>
            
            {
            wordInfo.grammar.conjugation.steps && wordInfo.grammar.conjugation.steps.length > 0 && (
                <div className={styles.steps}>
                <div className={styles.stepsHeader}>
                    {t('analysis.conjugation.steps')}:
                </div>
                <div className={styles.stepsContent}>
                    <table className={`${styles.stepsTable} ${getFontClass(language)}`}>
                        <tbody>
                            {wordInfo.grammar.conjugation.steps.map((step, index) => 
                                typeof step === 'string' 
                                ? <tr key={index}><td colSpan="3" className={styles.stringStep}>{step}</td></tr>
                                : renderStep(step, index)
                            )}
                        </tbody>
                    </table>
                </div>
                </div>
            )
            }
            
        </div>
    )
}

export default Conjugation;