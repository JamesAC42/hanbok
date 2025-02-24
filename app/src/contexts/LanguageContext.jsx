'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { resources, supportedLanguages } from '../translations';

const LanguageContext = createContext();

import { EmojioneFlagForChina } from '../components/icons/ChineseCircle';
import { EmojioneFlagForJapan } from '../components/icons/JapanCircle';
import { EmojioneFlagForSpain } from '../components/icons/SpanishCircle';
import { EmojioneFlagForItaly } from '../components/icons/ItalianCircle';
import { EmojioneFlagForFrance } from '../components/icons/FrenchCircle';
import { EmojioneFlagForUnitedKingdom } from '../components/icons/EnglishCircle';
import { EmojioneFlagForSouthKorea } from '../components/icons/KoreaCircle';

export function LanguageProvider({ children }) {
    const [language, setLanguage] = useState('ko');
    const [nativeLanguage, setNativeLanguage] = useState('en');

    // Load saved preferences on mount
    useEffect(() => {
        const savedLanguage = localStorage.getItem('language');
        const savedNativeLanguage = localStorage.getItem('nativeLanguage');
        
        if (savedLanguage) setLanguage(savedLanguage);
        if (savedNativeLanguage) setNativeLanguage(savedNativeLanguage);
    }, []);

    // Save preferences when they change
    useEffect(() => {
        localStorage.setItem('language', language);
    }, [language]);

    useEffect(() => {
        localStorage.setItem('nativeLanguage', nativeLanguage);
    }, [nativeLanguage]);

    // Get translation string based on current native language
    const t = (path) => {
        const keys = path.split('.');
        let result = resources[nativeLanguage];
        
        for (const key of keys) {
            if (result === undefined) return path; // Return path if translation not found
            result = result[key];
        }
        
        return result || path; // Return path if translation not found
    };

    const getIcon = (lang = language) => {
        switch (lang) {
            case 'ko':
                return <EmojioneFlagForSouthKorea />;
            case 'en':
                return <EmojioneFlagForUnitedKingdom />;
            case 'zh':
                return <EmojioneFlagForChina />;
            case 'ja':
                return <EmojioneFlagForJapan />;
            case 'es':
                return <EmojioneFlagForSpain />;
            case 'it':
                return <EmojioneFlagForItaly />;
            case 'fr':
                return <EmojioneFlagForFrance />;
        }
    }

    const value = {
        language,
        setLanguage,
        nativeLanguage,
        setNativeLanguage,
        supportedLanguages,
        getIcon,
        t
    };

    return (
        <LanguageContext.Provider value={value}>
            {children}
        </LanguageContext.Provider>
    );
}

export const useLanguage = () => useContext(LanguageContext); 