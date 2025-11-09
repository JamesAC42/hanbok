'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from '@/styles/components/DashboardTopNav.module.scss';
import { MaterialSymbolsSettingsRounded } from './icons/Settings';
import { useLanguage } from '@/contexts/LanguageContext';
import { useTheme } from '@/contexts/ThemeContext';
import themes from '@/lib/themes';

const themePreviewStyles = {
    light: {
        background: 'linear-gradient(135deg, #ffffff, #f5f5f5)',
        color: '#171717',
        border: '#d9d9d9',
        accent: '#3d64e8'
    },
    dark: {
        background: 'linear-gradient(135deg, #1a1a1a, #121212)',
        color: '#ffffff',
        border: '#2f2f2f',
        accent: '#c2d0ff'
    },
    sepia: {
        background: 'linear-gradient(135deg, #f0eee8, #e7dfd9)',
        color: '#434343',
        border: '#d3cbc3',
        accent: '#607dbf'
    },
    neopolitan: {
        background: 'linear-gradient(135deg, #ffe7fc, #fffcf1)',
        color: '#7d6765',
        border: '#f3d0ea',
        accent: '#9b38e2'
    },
    forest: {
        background: 'linear-gradient(135deg, #0b0c10, #000403)',
        color: '#4EBA6F',
        border: '#1f2723',
        accent: '#6bb75a'
    },
    wiiu: {
        background: 'linear-gradient(135deg, #ffffff, #f0f3f7)',
        color: '#000000',
        border: '#c8d0dd',
        accent: '#0066CC'
    },
    edo: {
        background: 'linear-gradient(135deg, #0f0e17, #050507)',
        color: '#ff4c4c',
        border: '#2a1419',
        accent: '#ffa3a3'
    },
    lizard: {
        background: 'linear-gradient(135deg, #202c3a, #132534)',
        color: '#d7e855',
        border: '#25323f',
        accent: '#95f378'
    },
    frutiger: {
        background: 'linear-gradient(135deg, #2243c7, #0051ff)',
        color: '#34ff19',
        border: '#1b36a3',
        accent: '#ffffff'
    },
    miku: {
        background: 'linear-gradient(135deg, #272a30, #161619)',
        color: '#50e1eb',
        border: '#1d2227',
        accent: '#50e1eb'
    },
    rocket: {
        background: 'linear-gradient(135deg, #eeedf8, #fefefe)',
        color: '#1b2aff',
        border: '#d7d4ec',
        accent: '#ff4141'
    },
};

const DashboardTopNav = () => {
    const { t, nativeLanguage, setNativeLanguage, supportedLanguages, getIcon } = useLanguage();
    const { theme, setTheme } = useTheme();
    const [settingsOpen, setSettingsOpen] = useState(false);

    const toggleSettings = () => {
        setSettingsOpen((prev) => !prev);
    };

    const closeSettings = () => {
        setSettingsOpen(false);
    };

    const handleThemeSelect = (selectedTheme) => {
        setTheme(selectedTheme);
    };

    const handleNativeLanguageSelect = (languageCode) => {
        setNativeLanguage(languageCode);
    };

    useEffect(() => {
        if (!settingsOpen) {
            return;
        }

        const handleKeyDown = (event) => {
            if (event.key === 'Escape') {
                closeSettings();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [settingsOpen]);

    useEffect(() => {
        if (!settingsOpen) {
            return;
        }

        const previousOverflow = document.body.style.overflow;
        document.body.style.overflow = 'hidden';

        return () => {
            document.body.style.overflow = previousOverflow;
        };
    }, [settingsOpen]);

    return (
        <>
            <nav className={styles.topNav}>
                <Link href="/" className={styles.brand}>
                    hanbok
                </Link>
                <div className={styles.searchContainer}>
                    <input
                        type="text"
                        placeholder={t('dashboard.searchPlaceholder')}
                        className={styles.searchInput}
                        readOnly
                    />
                </div>
                <button
                    type="button"
                    className={styles.settingsButton}
                    onClick={toggleSettings}
                    aria-haspopup="dialog"
                    aria-expanded={settingsOpen}
                    aria-label={t('dashboard.openSettings')}
                >
                    <MaterialSymbolsSettingsRounded />
                </button>
            </nav>
            {settingsOpen && (
                <>
                    <div className={styles.overlay} onClick={closeSettings} />
                    <div
                        className={styles.settingsModal}
                        role="dialog"
                        aria-modal="true"
                        aria-labelledby="dashboard-settings-heading"
                    >
                        <div className={styles.modalHeader}>
                            <h2 id="dashboard-settings-heading">{t('dashboard.settingsTitle')}</h2>
                            <button
                                type="button"
                                onClick={closeSettings}
                                className={styles.closeButton}
                                aria-label={t('dashboard.closeSettings')}
                            >
                                ×
                            </button>
                        </div>
                        <div className={styles.modalContent}>
                            <section className={styles.section}>
                                <h3>{t('dashboard.themeHeading')}</h3>
                                <div className={styles.themeGrid}>
                                    {themes.map((availableTheme) => {
                                        const preview = themePreviewStyles[availableTheme] || {};
                                        const accent = preview.accent || 'var(--primary)';
                                        const isActive = theme === availableTheme;
                                        const style = {
                                            background: preview.background,
                                            color: preview.color,
                                            borderColor: preview.border,
                                            boxShadow: undefined,
                                        };

                                        if (isActive) {
                                            style.borderColor = accent;
                                            if (typeof accent === 'string' && accent.startsWith('#')) {
                                                style.boxShadow = `0 0 0 2px ${accent}33`;
                                            } else {
                                                style.boxShadow = '0 0 0 2px var(--primary)';
                                            }
                                        }

                                        return (
                                            <button
                                                key={availableTheme}
                                                type="button"
                                                onClick={() => handleThemeSelect(availableTheme)}
                                                className={`${styles.themeButton} ${
                                                    isActive ? styles.themeButtonActive : ''
                                                }`}
                                                style={style}
                                            >
                                                <span className={styles.themeLabel}>
                                                    {t(`profile.themes.${availableTheme}`)}
                                                </span>
                                                <span
                                                    className={styles.themeSwatch}
                                                    style={{ background: accent }}
                                                />
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>
                            <section className={`${styles.section} ${styles.languageSection}`}>
                                <h3>{t('dashboard.languageHeading')}</h3>
                                <div className={styles.languageGrid}>
                                    {Object.entries(supportedLanguages).map(([code, translationKey]) => (
                                        <button
                                            key={code}
                                            type="button"
                                            onClick={() => handleNativeLanguageSelect(code)}
                                            className={`${styles.languageButton} ${
                                                nativeLanguage === code ? styles.languageButtonActive : ''
                                            }`}
                                            aria-pressed={nativeLanguage === code}
                                        >
                                            <span className={styles.languageIcon}>{getIcon(code)}</span>
                                            <span className={styles.languageLabel}>
                                                {t(`languages.${translationKey}`)}
                                            </span>
                                        </button>
                                    ))}
                                </div>
                            </section>
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default DashboardTopNav;
