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
            top: buttonRect.bottom + window.scrollY,
            left: buttonRect.left + window.scrollX
        });
        setShowPicker(!showPicker);
    };

    // Filter out the current native/learning language from options
    const availableLanguages = Object.keys(supportedLanguages).filter(lang =>
        (native ? lang !== nativeLanguage : lang !== language)
    );

    return (
        <div className={styles.languageButtonOuter}>
            <div className={styles.buttonContainer} onClick={handleButtonClick}>
                <div 
                    className={styles.languageButton}
                    onClick={handleTooltipClose}
                >
                    {native ? getIcon(nativeLanguage) : getIcon(language)}
                </div>
                
                {showTooltip && (
                    <div className={styles.tooltip}>
                        {t('languagePicker.tooltip')}
                        <button 
                            className={styles.closeTooltip}
                            onClick={handleTooltipClose}
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
                        <div 
                            className={styles.pickerContent}
                            style={{
                                top: `${pickerPosition.top}px`,
                                left: `${pickerPosition.left}px`
                            }}
                        >
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
                                            onClick={() => handleLanguageChange(lang)}
                                            title={t(`languages.${supportedLanguages[lang]}`)}
                                            className={styles.languagePickerButton}
                                        >
                                            {getIcon(lang)}
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
