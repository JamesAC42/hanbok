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
    sunrise: {
        background: 'linear-gradient(135deg, #fff7e6, #ffe7c7)',
        color: '#5a3b2e',
        border: '#ffd9aa',
        accent: '#ff8a3d'
    },
    midnight: {
        background: 'linear-gradient(135deg, #0c1021, #050814)',
        color: '#cdd7ff',
        border: '#132246',
        accent: '#6ab3ff'
    },
    ocean: {
        background: 'linear-gradient(135deg, #0f262f, #0a1d24)',
        color: '#c9f0ff',
        border: '#144056',
        accent: '#2cc5e0'
    },
    lavender: {
        background: 'linear-gradient(135deg, #f7f4ff, #ece6ff)',
        color: '#3d2f4a',
        border: '#dcd4ff',
        accent: '#9b86f4'
    },
    candy: {
        background: 'linear-gradient(135deg, #fff5fb, #ffe1f1)',
        color: '#5c284b',
        border: '#ffd1e8',
        accent: '#ff4fa2'
    },
    citrus: {
        background: 'linear-gradient(135deg, #f9ffe5, #f1f7d0)',
        color: '#494d2b',
        border: '#e7efb5',
        accent: '#d7a22a'
    },
    slate: {
        background: 'linear-gradient(135deg, #f1f3f5, #e5e8ed)',
        color: '#293845',
        border: '#d3d8e0',
        accent: '#4a6fa1'
    },
    matrix: {
        background: 'linear-gradient(135deg, #050f0a, #03150c)',
        color: '#8bffa8',
        border: '#0b2919',
        accent: '#00e36a'
    },
    sand: {
        background: 'linear-gradient(135deg, #f8f1eb, #f0e4d9)',
        color: '#3d2c23',
        border: '#e3d2c0',
        accent: '#c5915f'
    },
    aurora: {
        background: 'linear-gradient(135deg, #0b1224, #08101c)',
        color: '#d5e7ff',
        border: '#122440',
        accent: '#7ce7ff'
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
