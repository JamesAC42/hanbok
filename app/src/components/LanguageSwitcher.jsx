import styles from '@/styles/components/languageswitcher.module.scss';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { useState, useEffect, useRef } from 'react';

const LanguageSwitcher = ({ analysis }) => { 

    const { language, setLanguage, supportedLanguages, getIcon } = useLanguage();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const languageSwitcherRef = useRef(null);

    const getTransformFromLanguage = (l) => {
        let languages = Object.keys(supportedLanguages);
        let index = languages.indexOf(l);
        let transform = `translate(0, -${index * 3}rem)`;
        return transform;
    }

    useEffect(() => {
        // Function to handle clicks outside the dropdown
        const handleClickOutside = (event) => {
            if (languageSwitcherRef.current && !languageSwitcherRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };

        // Add event listener when dropdown is open
        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        // Cleanup function to remove event listener
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [dropdownOpen]);

    const capitalize = (str) => {
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    const handleLanguageChange = (languageKey) => {
        setLanguage(languageKey);
        setDropdownOpen(false);
    }

    const generateDropdown = () => {
        let languageAmount = Object.keys(supportedLanguages).length;
        let languageKeys = Object.keys(supportedLanguages);
        let languageItems = [];

        for(let i = 0; i < languageAmount; i++) {
            let languageKey = languageKeys[i];
            let languageName = supportedLanguages[languageKey];

            languageItems.push(
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
        }

        return languageItems;
    }

    const generateLanguageItems = () => {
        let languageAmount = Object.keys(supportedLanguages).length;
        let languageKeys = Object.keys(supportedLanguages);

        let languageItems = [];
        for(let i = 0; i < languageAmount * 50; i++) {
            
            let language = languageKeys[i % languageAmount];
            let languageName = supportedLanguages[language];

            languageItems.push(
                <div key={i} className={styles.languageItem}>
                    <div className={styles.languageItemInner}>  
                        <div className={styles.languageItemIcon}>
                            {getIcon(language)}
                        </div>
                        <div className={styles.languageItemText}>
                            {capitalize(languageName)}
                        </div>
                    </div>
                </div>
            )
        }

        return languageItems;
    }

    return (
        <div className={styles.languageSwitcherOuter} ref={languageSwitcherRef}>

            <div
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className={styles.languageSwitcherContainer}>
                <div
                    style={{transform: getTransformFromLanguage(language)}}
                    className={styles.languageSwitcherInner}>
                    {generateLanguageItems()}
                </div>
            </div>
            {dropdownOpen && (
                <div className={styles.dropdown}>
                    {generateDropdown()}
                </div>
            )}
            <div className={`${styles.helpTextImage} ${analysis ? styles.hidden : ''}`}>
                <Image src="/images/switchlanguagehelptext.png" alt="language-switcher" width={512} height={341} />
            </div>
        </div>
    )
}

export default LanguageSwitcher;