'use client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useEffect, useState } from 'react';
import styles from '@/styles/components/changelanguagebutton.module.scss';

const ChangeLanguageButton = ({ native = false }) => {
    const { language, setLanguage, nativeLanguage, setNativeLanguage, getIcon, supportedLanguages, t } = useLanguage();
    const [showTooltip, setShowTooltip] = useState(false);
    const [showPicker, setShowPicker] = useState(false);
    const [pickerPosition, setPickerPosition] = useState({ top: 0, left: 0 });

    useEffect(() => {
        // Only show tooltip for non-native language button
        if (!native) {
            const hasSeenTooltip = localStorage.getItem('languageButtonTooltipSeen');
            if (!hasSeenTooltip) {
                setShowTooltip(true);
                localStorage.setItem('languageButtonTooltipSeen', 'true');
            }
        }
    }, [native]);

    const handleTooltipClose = () => {
        setShowTooltip(false);
    };

    const handleLanguageChange = (lang) => {
        if(native) {
            setNativeLanguage(lang);
        } else {
            setLanguage(lang);
        }
        setShowPicker(false);
    }

    const handleButtonClick = (event) => {
        const buttonRect = event.currentTarget.getBoundingClientRect();
        setPickerPosition({
            top: `calc(${buttonRect.top - window.scrollY}px - 15rem)`, 
            left: `calc(${buttonRect.right + window.scrollX}px + 10rem)`
        });
        setShowPicker(!showPicker);
    };

    // Filter out the current native/learning language from options
    const availableLanguages = Object.keys(supportedLanguages).filter(lang =>
        (native ? lang !== nativeLanguage : lang !== language)
    );

    return (
        <div className={styles.languageButtonOuter}>
            <button
                type="button"
                className={styles.buttonContainer}
                onClick={(event) => { handleTooltipClose(); handleButtonClick(event); }}
                aria-haspopup="dialog"
                aria-expanded={showPicker}
            >
                <span className={styles.buttonLabel}>{t('languagePicker.language')}</span>
                <span className={styles.languageButton}>
                    {native ? getIcon(nativeLanguage) : getIcon(language)}
                </span>
            </button>
            <div className={styles.tooltipAnchor}>
                
                {showTooltip && (
                    <div className={styles.tooltip}>
                        {t('languagePicker.tooltip')}
                        <button 
                            type="button"
                            className={styles.closeTooltip}
                            onClick={handleTooltipClose}
                            aria-label="Close"
                        >
                            ×
                        </button>
                    </div>
                )}
            </div>
            {
                showPicker && (
                    <div className={`${styles.picker} ${native ? styles.reverse : ''}`}>
                        <div className={styles.pickerBackground} onClick={() => setShowPicker(false)}></div>
                        <div className={styles.pickerContent} role="dialog" aria-modal="true">
                            <div className={styles.pickerHeader}>
                                <h3>
                                    {t(native ? 'languagePicker.changeNative' : 'languagePicker.changeLearning')}
                                </h3>
                            </div>
                            <div className={styles.pickerItemContainer}>
                            {
                                availableLanguages.map((lang) => (
                                    <div className={styles.pickerItem} key={lang}>
                                        <button 
                                            type="button"
                                            onClick={() => handleLanguageChange(lang)}
                                            title={t(`languages.${supportedLanguages[lang]}`)}
                                            className={styles.languagePickerButton}
                                        >
                                            {getIcon(lang)}
                                            <div className={styles.languagePickerButtonText}>
                                                {t(`languages.${supportedLanguages[lang]}`)}
                                            </div>
                                        </button>
                                    </div>
                                ))
                            }
                            </div>
                        </div>
                    </div>
                )
            }
        </div>
    );
};

export default ChangeLanguageButton;
