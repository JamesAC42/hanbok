'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/styles/components/sentenceanalyzer/settingsbutton.module.scss';
import { useLanguage } from '@/contexts/LanguageContext';
import {MaterialSymbolsSettingsRounded} from '@/components/icons/Settings';

const SettingsButton = ({ showPronunciation, setShowPronunciation, language }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [playSoundEffects, setPlaySoundEffects] = useState(true);
    const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
    const [mounted, setMounted] = useState(false);
    
    const menuRef = useRef(null);
    const buttonRef = useRef(null);
    const { t } = useLanguage();

    useEffect(() => {
        setMounted(true);
        
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

    const updatePosition = () => {
        if (buttonRef.current) {
            const rect = buttonRef.current.getBoundingClientRect();
            setMenuPosition({
                top: rect.bottom + 5,
                left: rect.left + (rect.width / 2)
            });
        }
    };

    const toggleMenu = () => {
        if (!isMenuOpen) {
            updatePosition();
        }
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

        const handleScroll = () => {
            if (isMenuOpen) {
                setIsMenuOpen(false);
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', updatePosition);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isMenuOpen]);

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

            {isMenuOpen && mounted && createPortal(
                <div 
                    ref={menuRef} 
                    className={styles.settingsMenu}
                    style={{
                        position: 'fixed',
                        top: `${menuPosition.top}px`,
                        left: `${menuPosition.left}px`,
                        transform: 'translateX(-50%)',
                        zIndex: 99999,
                        marginTop: 0
                    }}
                >
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
                </div>,
                document.body
            )}
        </div>
    );
};

export default SettingsButton;
