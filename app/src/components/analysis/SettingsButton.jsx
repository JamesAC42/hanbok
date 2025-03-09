'use client';
import { useState, useEffect, useRef } from 'react';
import styles from '@/styles/components/sentenceanalyzer/settingsbutton.module.scss';
import { useLanguage } from '@/contexts/LanguageContext';
import GearIcon from '@/components/icons/Settings';

const SettingsButton = ({ showPronunciation, setShowPronunciation, language }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const menuRef = useRef(null);
    const buttonRef = useRef(null);
    const { t } = useLanguage();

    const toggleMenu = () => {
        setIsMenuOpen(!isMenuOpen);
    };

    const togglePronunciation = () => {
        const newValue = !showPronunciation;
        setShowPronunciation(newValue);
        localStorage.setItem('showPronunciation', JSON.stringify(newValue));
    };

    // Close menu when clicking outside
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

    if(!['ko', 'ja', 'zh', 'ru'].includes(language)) {
        return null;
    }

    return (
        <div className={styles.settingsContainer}>
            <button 
                ref={buttonRef}
                className={`${styles.settingsButton} ${isMenuOpen ? styles.active : ''}`}
                onClick={toggleMenu}
                title={t('analysis.settingsButton.title', 'Settings')}
            >
                <GearIcon />
            </button>

            {isMenuOpen && (
                <div ref={menuRef} className={styles.settingsMenu}>
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
                    </div>
                </div>
            )}
        </div>
    );
};

export default SettingsButton; 