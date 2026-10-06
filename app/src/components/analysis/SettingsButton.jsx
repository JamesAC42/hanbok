'use client';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import styles from '@/styles/components/sentenceanalyzer/settingsbutton.module.scss';
import { useLanguage } from '@/contexts/LanguageContext';
import {MaterialSymbolsSettingsRounded} from '@/components/icons/Settings';

const SettingsButton = ({ showPronunciation, setShowPronunciation, language }) => {
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    const [playSoundEffects, setPlaySoundEffects] = useState(true);
    const [menuPosition, setMenuPosition] = useState({ top: 0, right: 0 });
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
            // Right-align the menu with the button so it never runs off screen.
            setMenuPosition({
                top: rect.bottom + 8,
                right: Math.max(8, window.innerWidth - rect.right)
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

        const handleKey = (event) => {
            if (event.key === 'Escape') {
                setIsMenuOpen(false);
                buttonRef.current?.focus();
            }
        };

        if (isMenuOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKey);
            // Move focus into the menu so keyboard users land on the first switch.
            menuRef.current?.querySelector('input')?.focus({ preventScroll: true });
            window.addEventListener('scroll', handleScroll, true);
            window.addEventListener('resize', updatePosition);
        }
        
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKey);
            window.removeEventListener('scroll', handleScroll, true);
            window.removeEventListener('resize', updatePosition);
        };
    }, [isMenuOpen]);

    // Portal into the theme wrapper so the menu picks up the user's theme colors.
    const portalTarget = mounted
        ? (document.querySelector('div[class*="theme-"]') || document.body)
        : null;

    const showPronunciationRow = ['ko', 'ja', 'zh', 'zh-TW', 'ru'].includes(language);

    return (
        <div className={styles.settingsContainer}>
            <button 
                ref={buttonRef}
                type="button"
                className={`${styles.settingsButton} ${isMenuOpen ? styles.active : ''}`}
                onClick={toggleMenu}
                title={t('analysis.settingsButton.title', 'Settings')}
                aria-label={t('analysis.settingsButton.title', 'Settings')}
                aria-haspopup="true"
                aria-expanded={isMenuOpen}
            >
                <MaterialSymbolsSettingsRounded />
            </button>

            {isMenuOpen && portalTarget && createPortal(
                <div 
                    ref={menuRef} 
                    className={styles.settingsMenu}
                    role="group"
                    aria-label={t('analysis.settingsButton.title', 'Settings')}
                    style={{
                        position: 'fixed',
                        top: `${menuPosition.top}px`,
                        right: `${menuPosition.right}px`,
                        zIndex: 99999
                    }}
                >
                    <div className={styles.menuTitle}>{t('analysis.settingsButton.title', 'Settings')}</div>
                    {
                        showPronunciationRow ?
                        <label className={`${styles.settingsMenuItem} ${showPronunciation ? styles.on : ''}`}>
                            <span className={styles.settingsLabel}>
                                {t('analysis.settingsButton.showPronunciations', 'Show pronunciations')}
                            </span>
                            <input 
                                type="checkbox" 
                                role="switch"
                                checked={!!showPronunciation} 
                                onChange={togglePronunciation}
                            />
                            <span className={styles.toggleSlider} aria-hidden="true"></span>
                        </label> : null
                    }
                    <label className={`${styles.settingsMenuItem} ${playSoundEffects ? styles.on : ''}`}>
                        <span className={styles.settingsLabel}>
                            {t('analysis.settingsButton.playSoundEffects', 'Play sound effects')}
                        </span>
                        <input 
                            type="checkbox" 
                            role="switch"
                            checked={!!playSoundEffects} 
                            onChange={toggleSoundEffects}
                        />
                        <span className={styles.toggleSlider} aria-hidden="true"></span>
                    </label>
                </div>,
                portalTarget
            )}
        </div>
    );
};

export default SettingsButton;
