import styles from '@/styles/components/sentenceanalyzer/variants.module.scss';
import { useLanguage } from '@/contexts/LanguageContext';
import { romanize } from '@romanize/korean';
import getFontClass from '@/lib/fontClass';

const Variants = ({analysis, language, showPronunciation}) => {
    const { t } = useLanguage();

    const renderReading = (variant) => {
        if(!showPronunciation) return null;
        let reading = variant.reading;
        if(language === 'ko') {
            reading = romanize(variant.text);
        }
        if(language === 'ru') {
            reading = variant.transliteration;
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

    let variants;

    if((!analysis.variants && !analysis.register_variants)) {
        return null;
    }

    if(analysis.register_variants) {
        if(Object.keys(analysis.register_variants).length === 0) {  
            return null;
        }
        variants = analysis.register_variants;
    } else {
        if(Object.keys(analysis.variants).length === 0) {
            return null;
        }
        variants = analysis.variants;
    }

    return (
        <div className={styles.variants}>
            <div className={styles.variantsHeader}>
                {t('analysis.variants.title')}
            </div>
            <div className={styles.variantsContainer}>
                {
                    Object.keys(variants).map((variant) => (
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
                                    {variants[variant].text}
                                </div>
                                {renderReading(variants[variant])}
                            </div>
                            <div className={styles.variantWhenToUse}>
                                {variants[variant].when_to_use}
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

export default Variants;