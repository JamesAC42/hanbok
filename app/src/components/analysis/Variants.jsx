import styles from '@/styles/components/sentenceanalyzer/variants.module.scss';
import { useLanguage } from '@/contexts/LanguageContext';

const Variants = ({analysis}) => {
    const { t } = useLanguage();
    
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
                                {analysis.variants[variant].text}
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