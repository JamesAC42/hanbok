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

    const languageKey = supportedLanguages[language] || '';
    const localizedLanguageName = t(`languages.${languageKey}`);
    const languageName = localizedLanguageName === `languages.${languageKey}`
        ? capitalize(languageKey)
        : localizedLanguageName;

    return (
        <div className={styles.translationSwitcherOuter}>


            <div className={styles.translationSwitcherContainer}>
                <div className={styles.languageSwitcherOuter}>
                    <LanguageSwitcher analysis={analysis}/>
                </div>
                <div className={styles.translationSwitcherInner} role="tablist">
                    <button
                        type="button"
                        role="tab"
                        aria-selected={!translationMode}
                        onClick={() => setTranslationMode(false)} 
                        className={`${styles.translateSwitcherItem} ${!translationMode ? styles.active : ''}`}>
                        <span className={styles.itemText}>
                            {t('sentenceForm.translateMode.analysis').replace('{language}', languageName)}
                        </span>
                    </button>
                    <button
                        type="button"
                        role="tab"
                        aria-selected={translationMode}
                        onClick={() => setTranslationMode(true)} 
                        className={`${styles.translateSwitcherItem} ${translationMode ? styles.active : ''}`}>
                        <span className={styles.itemText}>
                            {t('sentenceForm.translateMode.translate')}
                        </span>
                    </button>
                </div>
            </div>
        </div>
    )
}

export default TranslationSwitcher;