import styles from '@/styles/components/sentenceanalyzer/conjugation.module.scss';

const Conjugation = ({
    wordInfo
}) => {

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
        <div className={styles.conjugation}>
            
            <div className={styles.additionalInfo}>
            {
            wordInfo.grammar.conjugation.tense && (
                <div className={styles.tense}>
                <span className={styles.tenseLabel}>
                    Tense:
                </span>
                <span className={styles.tenseValue}>
                    {wordInfo.grammar.conjugation.tense.replaceAll('_', ' ')}
                </span>
                </div>
            )
            }

            {
            wordInfo.grammar.conjugation.formality && (
                <div className={styles.formality}>
                <span className={styles.formalityLabel}>
                    Formality:
                </span>
                <span className={styles.formalityValue}>
                    {wordInfo.grammar.conjugation.formality.replaceAll('_', ' ')}
                </span>
                </div>
            )
            }
            </div>
            
            {
            wordInfo.grammar.conjugation.steps && (
                <div className={styles.steps}>
                <div className={styles.stepsHeader}>
                    Conjugation Steps:
                </div>
                <div className={styles.stepsContent}>
                    <table className={styles.stepsTable}>
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