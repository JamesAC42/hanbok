'use client';
import { useState, useEffect, useRef } from 'react';
import styles from '@/styles/components/sentenceanalyzer/settingsbutton.module.scss';
import { useLanguage } from '@/contexts/LanguageContext';
import {MaterialSymbolsSettingsRounded} from '@/components/icons/Settings';

const SettingsButton = ({ showPronunciation, setShowPronunciation, language }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [playSoundEffects, setPlaySoundEffects] = useState(true);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);
    const { t } = useLanguage();

    useEffect(() => {
        const storedShowPronunciation = localStorage.getItem('showPronunciation');
        if (storedShowPronunciation !== null) {
            setShowPronunciation(JSON.parse(storedShowPronunciation));
        }

        const storedPlaySoundEffects = localStorage.getItem('playSoundEffects');
        if (storedPlaySoundEffects !== null) {
            setPlaySoundEffects(JSON.parse(storedPlaySoundEffects));
        } else {
            localStorage.setItem('playSoundEffects', JSON.stringify(true));
        }
    }, [setShowPronunciation]);

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const togglePronunciation = () => {
        const newValue = !showPronunciation;
        setShowPronunciation(newValue);
        localStorage.setItem('showPronunciation', JSON.stringify(newValue));
    };

    const toggleSoundEffects = () => {
        const newValue = !playSoundEffects;
        setPlaySoundEffects(newValue);
        localStorage.setItem('playSoundEffects', JSON.stringify(newValue));
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (
                menuRef.current && 
                !menuRef.current.contains(event.target) &&
                buttonRef.current && 
                !buttonRef.current.contains(event.target)
            ) {
                setIsMenuOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    return (
        <div className={styles.settingsContainer}>
            <button 
                ref={buttonRef}
                className={`${styles.settingsButton} ${isMenuOpen ? styles.active : ''}`}
                onClick={toggleMenu}
                title={t('analysis.settingsButton.title', 'Settings')}
            >
                <MaterialSymbolsSettingsRounded />
            </button>

            {isMenuOpen && (
                <div ref={menuRef} className={styles.settingsMenu}>
                    {
                        ['ko', 'ja', 'zh', 'ru'].includes(language) ?
                        <div className={styles.settingsMenuItem}>
                            <label className={styles.settingsToggle}>
                                <input 
                                    type="checkbox" 
                                    checked={showPronunciation} 
                                    onChange={togglePronunciation}
                                />
                                <span className={styles.toggleSlider}></span>
                            </label>
                            <span className={styles.settingsLabel}>
                                {t('analysis.settingsButton.showPronunciations', 'Show pronunciations')}
                            </span>
                        </div> : null
                    }
                    <div className={styles.settingsMenuItem}>
                        <label className={styles.settingsToggle}>
                            <input 
                                type="checkbox" 
                                checked={playSoundEffects} 
                                onChange={toggleSoundEffects}
                            />
                            <span className={styles.toggleSlider}></span>
                        </label>
                        <span className={styles.settingsLabel}>
                            {t('analysis.settingsButton.playSoundEffects', 'Play sound effects')}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsButton; 