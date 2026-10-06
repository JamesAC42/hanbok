import styles from '@/styles/components/languageswitcher.module.scss';
import { useLanguage } from '@/contexts/LanguageContext';
import { resources } from '@/translations';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import { MingcuteDownFill } from '@/components/icons/DownCarat';

const CheckIcon = () => (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true">
        <path fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round" strokeLinejoin="round" d="M5 12.5l4.5 4.5L19 7.5" />
    </svg>
);

const LanguageSwitcher = ({ analysis }) => {
    const { language, setLanguage, supportedAnalysisLanguages, getIcon } = useLanguage();

    const [dropdownOpen, setDropdownOpen] = useState(false);
    const [alignLeft, setAlignLeft] = useState(true);
    const languageSwitcherRef = useRef(null);
    const triggerRef = useRef(null);
    const listRef = useRef(null);

    const languageKeys = useMemo(
        () => Object.keys(supportedAnalysisLanguages || {}),
        [supportedAnalysisLanguages]
    );

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (languageSwitcherRef.current && !languageSwitcherRef.current.contains(event.target)) {
                setDropdownOpen(false);
            }
        };
        const handleKey = (event) => {
            if (event.key === 'Escape') {
                setDropdownOpen(false);
                triggerRef.current?.focus();
            }
        };

        if (dropdownOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.addEventListener('keydown', handleKey);
            // Bring the chosen language into view and give it focus for keyboard users.
            const selected = listRef.current?.querySelector('[aria-selected="true"]');
            selected?.scrollIntoView({ block: 'nearest' });
            selected?.focus({ preventScroll: true });
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.removeEventListener('keydown', handleKey);
        };
    }, [dropdownOpen]);

    const capitalize = (str) => str.charAt(0).toUpperCase() + str.slice(1);

    const nameFor = (languageKey) => resources.en.languages[supportedAnalysisLanguages[languageKey]]
        || capitalize(supportedAnalysisLanguages[languageKey] || languageKey || '');

    const handleLanguageChange = (languageKey) => {
        setLanguage(languageKey);
        setDropdownOpen(false);
        triggerRef.current?.focus();
    };

    // Arrow keys move between rows while the list is open.
    const handleListKey = (event) => {
        if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return;
        event.preventDefault();
        const rows = [...(listRef.current?.querySelectorAll('button') || [])];
        const index = rows.indexOf(document.activeElement);
        const next = event.key === 'ArrowDown'
            ? rows[Math.min(index + 1, rows.length - 1)]
            : rows[Math.max(index - 1, 0)];
        next?.focus();
    };

    const currentName = language ? nameFor(language) : '';

    return (
        <div className={styles.languageSwitcherOuter} ref={languageSwitcherRef}>
            <button
                type="button"
                ref={triggerRef}
                onClick={() => {
                    // Open toward whichever side has room for the menu.
                    const rect = triggerRef.current?.getBoundingClientRect();
                    if (rect) setAlignLeft(window.innerWidth - rect.left >= 272);
                    setDropdownOpen(!dropdownOpen);
                }}
                className={`${styles.trigger} ${dropdownOpen ? styles.open : ''}`}
                aria-haspopup="listbox"
                aria-expanded={dropdownOpen}
                aria-label={`Language: ${currentName}`}
            >
                <span className={styles.flag}>{getIcon(language)}</span>
                <span className={styles.triggerText}>{currentName}</span>
                <MingcuteDownFill className={styles.chevron} aria-hidden="true" />
            </button>

            {dropdownOpen && (
                <div
                    className={`${styles.dropdown} ${alignLeft ? styles.alignLeft : ''}`}
                    role="listbox"
                    aria-label="Choose a language"
                    ref={listRef}
                    onKeyDown={handleListKey}
                >
                    {languageKeys.map((languageKey) => {
                        const selected = languageKey === language;
                        return (
                            <button
                                type="button"
                                key={languageKey}
                                role="option"
                                aria-selected={selected}
                                className={`${styles.languageItem} ${selected ? styles.selected : ''}`}
                                onClick={() => handleLanguageChange(languageKey)}
                            >
                                <span className={styles.flag}>{getIcon(languageKey)}</span>
                                <span className={styles.languageItemText}>{nameFor(languageKey)}</span>
                                {selected && <span className={styles.check}><CheckIcon /></span>}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default memo(LanguageSwitcher);
