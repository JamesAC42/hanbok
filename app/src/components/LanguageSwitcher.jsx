import styles from '@/styles/components/languageswitcher.module.scss';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { memo, useEffect, useMemo, useRef, useState } from 'react';

const LanguageSwitcher = ({ analysis }) => {
    const { language, setLanguage, supportedAnalysisLanguages, getIcon } = useLanguage();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const languageSwitcherRef = useRef(null);

    const languageKeys = useMemo(
        () => Object.keys(supportedAnalysisLanguages || {}),
        [supportedAnalysisLanguages]
    );

    const getTransformFromLanguage = (l) => {
        const index = Math.max(languageKeys.indexOf(l), 0);
        return `translate(0, -${index * 3}rem)`;
    };

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (languageSwitcherRef.current && !languageSwitcherRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen]);

    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

    const handleLanguageChange = (languageKey) => {
        setLanguage(languageKey);
        setDropdownOpen(false);
    };

    const dropdownItems = useMemo(
        () => languageKeys.map((languageKey) => {
            const languageName = supportedAnalysisLanguages[languageKey];

            return (
                <div
                    key={languageKey}
                    className={styles.languageItem}
                    onClick={() => handleLanguageChange(languageKey)}
                >
                    <div className={styles.languageItemInner}>
                        <div className={styles.languageItemIcon}>
                            {getIcon(languageKey)}
                        </div>
                        <div className={styles.languageItemText}>
                            {capitalize(languageName)}
                        </div>
                    </div>
                </div>
            );
        }),
        [getIcon, languageKeys, supportedAnalysisLanguages]
    );

    const switcherItems = useMemo(
        () => languageKeys.map((languageKey) => {
            const languageName = supportedAnalysisLanguages[languageKey];

            return (
                <div key={languageKey} className={styles.languageItem}>
                    <div className={styles.languageItemInner}>
                        <div className={styles.languageItemIcon}>
                            {getIcon(languageKey)}
                        </div>
                        <div className={styles.languageItemText}>
                            {capitalize(languageName)}
                        </div>
                    </div>
                </div>
            );
        }),
        [getIcon, languageKeys, supportedAnalysisLanguages]
    );

    return (
        <div className={styles.languageSwitcherOuter} ref={languageSwitcherRef}>
            <div
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={styles.languageSwitcherContainer}
            >
                <div
                    style={{ transform: getTransformFromLanguage(language) }}
                    className={styles.languageSwitcherInner}
                >
                    {switcherItems}
                </div>
            </div>
            {dropdownOpen && (
                <div className={styles.dropdown}>
                    {dropdownItems}
                </div>
            )}

            {
                false && (
                    <div className={`${styles.helpTextImage} ${analysis ? styles.hidden : ''}`}>
                        <Image src="/images/switchlanguagehelptext.png" alt="language-switcher" width={512} height={341} />
                    </div>
                )
            }
        </div>
    );
};

export default memo(LanguageSwitcher);
