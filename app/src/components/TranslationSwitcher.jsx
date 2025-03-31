import styles from '@/styles/components/translationswitcher.module.scss';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';

const TranslationSwitcher = ({ 
    originalLanguage, 
    translationLanguage,
    translationMode,
    setTranslationMode,
    analysis
}) => {

    const { t, language, setLanguage, supportedLanguages } = useLanguage();

    const capitalize = (str) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    return (
        <div className={styles.translationSwitcherOuter}>


            <div className={styles.translationSwitcherContainer}>
                <div className={styles.languageSwitcherOuter}>
                    <LanguageSwitcher analysis={analysis}/>
                </div>
                <div className={styles.translationSwitcherInner}>
                    <div 
                        className={styles.translationSwitcherBar}
                        style={{
                            transform: `translateX(${translationMode ? '22rem' : '0%'})`
                        }}
                    ></div>
                    <div
                        onClick={() => setTranslationMode(false)} 
                        className={`${styles.translateSwitcherItem} ${!translationMode ? styles.active : ''}`}>
                        <div className={styles.itemText}>
                            {t('sentenceForm.translateMode.analysis').replace('{language}', capitalize(supportedLanguages[language]))}
                        </div>
                    </div>
                    <div 
                        onClick={() => setTranslationMode(true)} 
                        className={`${styles.translateSwitcherItem} ${translationMode ? styles.active : ''}`}>
                        <div className={styles.itemText}>
                            {t('sentenceForm.translateMode.translate')}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default TranslationSwitcher;