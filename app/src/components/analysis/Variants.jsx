import styles from '@/styles/components/sentenceanalyzer/variants.module.scss';
import { useLanguage } from '@/contexts/LanguageContext';
import { romanize } from '@romanize/korean';
import getFontClass from '@/lib/fontClass';

const Variants = ({analysis, language}) => {
    const { t } = useLanguage();

    const renderReading = (variant) => {
        let reading = variant.reading;
        if(language === 'ko') {
            reading = romanize(variant.text);
        }
        
        if(reading) {
            return (
                <div className={styles.variantReading}>
                    {reading}
                </div>
            )
        }
        return null;
    }

    if(!analysis.variants || Object.keys(analysis.variants).length === 0) {
        return null;
    }

    return (
        <div className={styles.variants}>
            <div className={styles.variantsHeader}>
                {t('analysis.variants.title')}
            </div>
            <div className={styles.variantsContainer}>
                {
                    Object.keys(analysis.variants).map((variant) => (
                        <div
                            data-formality={variant}
                            className={styles.variant} 
                            key={variant}
                        >
                            <div className={styles.variantContent}>
                                <div className={styles.variantType}>
                                    {variant}
                                </div>
                                <div className={`${getFontClass(language)}`}>
                                    {analysis.variants[variant].text}
                                </div>
                                {renderReading(analysis.variants[variant])}
                            </div>
                            <div className={styles.variantWhenToUse}>
                                {analysis.variants[variant].when_to_use}
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

export default Variants;