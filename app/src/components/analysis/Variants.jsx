import styles from '@/styles/components/sentenceanalyzer/variants.module.scss';
import { useLanguage } from '@/contexts/LanguageContext';
import kpop from 'kpop';
import getFontClass from '@/lib/fontClass';

const Variants = ({analysis, language, showPronunciation}) => {
    const { t } = useLanguage();

    const renderReading = (variant) => {
        if(!showPronunciation) return null;
        let reading = variant.reading;
        if(language === 'ko') {
            try {
                reading = kpop.romanize(variant.text);
            } catch(err) {
                console.log(err);
            }
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
            <h3 className={styles.variantsHeader}>
                {t('analysis.variants.title')}
            </h3>
            <div className={styles.variantsContainer}>
                {
                    Object.keys(variants).map((variant) => (
                        <div
                            data-formality={variant.toLowerCase()}
                            className={styles.variantCard} 
                            key={variant}
                        >
                            <div className={styles.cardHeader}>
                                <span className={styles.variantType}>
                                    {variant}
                                </span>
                            </div>
                            
                            <div className={styles.cardBody}>
                                <div className={`${styles.variantText} ${getFontClass(language)}`}>
                                    {variants[variant].text}
                                </div>
                                {renderReading(variants[variant])}
                            </div>

                            <div className={styles.cardFooter}>
                                <div className={styles.variantWhenToUse}>
                                    {variants[variant].when_to_use}
                                </div>
                            </div>
                        </div>
                    ))
                }
            </div>
        </div>
    )
}

export default Variants;