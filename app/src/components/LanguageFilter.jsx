'use client';

import { useState, useRef, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from '@/styles/components/languagefilter.module.scss';

export default function LanguageFilter({ selectedLanguage, onSelectLanguage }) {
  const { getIcon, supportedAnalysisLanguages } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className={styles.container} ref={dropdownRef}>
      <button 
        className={`${styles.trigger} ${isOpen ? styles.active : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Filter by language"
        title="Filter by language"
      >
        {selectedLanguage
          ? <span className={styles.icon}>{getIcon(selectedLanguage)}</span>
          : <span className={styles.allLabel}>All languages</span>}
        <span className={`${styles.chevron} ${isOpen ? styles.rotated : ''}`}>▼</span>
      </button>
      
      <div className={`${styles.dropdown} ${isOpen ? styles.show : ''}`}>
        {/* An empty code means no filter */}
        <button
          className={`${styles.option} ${styles.allOption} ${!selectedLanguage ? styles.selected : ''}`}
          onClick={() => {
            onSelectLanguage('');
            setIsOpen(false);
          }}
        >
          All languages
        </button>
        {Object.keys(supportedAnalysisLanguages).map(code => (
          <button
            key={code}
            className={`${styles.option} ${selectedLanguage === code ? styles.selected : ''}`}
            onClick={() => {
              onSelectLanguage(code);
              setIsOpen(false);
            }}
            title={supportedAnalysisLanguages[code].name}
          >
            {getIcon(code)}
          </button>
        ))}
      </div>
    </div>
  );
}

