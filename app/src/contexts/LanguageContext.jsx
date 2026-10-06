'use client';
import { createContext, useContext, useState, useEffect } from 'react';
import { resources, supportedLanguages, supportedAnalysisLanguages } from '../translations';

const LanguageContext = createContext();

import { EmojioneFlagForChina } from '../components/icons/ChineseCircle';
import { TraditionalChineseCircle } from '../components/icons/TraditionalChineseCircle';
import { EmojioneFlagForJapan } from '../components/icons/JapanCircle';
import { EmojioneFlagForSpain } from '../components/icons/SpanishCircle';
import { EmojioneFlagForItaly } from '../components/icons/ItalianCircle';
import { EmojioneFlagForFrance } from '../components/icons/FrenchCircle';
import { EmojioneFlagForUnitedKingdom } from '../components/icons/EnglishCircle';
import { EmojioneFlagForSouthKorea } from '../components/icons/KoreaCircle';
import { EmojioneFlagForGermany } from '../components/icons/GermanCircle';
import { EmojioneFlagForNetherlands } from '../components/icons/DutchCircle';
import { EmojioneFlagForRussia } from '../components/icons/RussianCircle';
import { EmojioneFlagForTurkey } from '../components/icons/TurkishCircle';
import { EmojioneFlagForIndonesia } from '../components/icons/IndonesianCircle';
import { EmojioneFlagForVietnam } from '../components/icons/VietnameseCircle';
import { EmojioneFlagForIndia } from '../components/icons/HindiCircle';

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
    const t = (path, replacements = {}) => {
        // Some callers pass default text instead of replacements: t(key, 'Fallback').
        const fallback = typeof replacements === 'string' ? replacements : path;
        if (typeof replacements === 'string') replacements = {};
        const keys = path.split('.');
        const lookup = (lang) => keys.reduce((node, key) => (node == null ? undefined : node[key]), resources[lang]);
        // A string missing from a translation falls back to English, not the raw key.
        let result = lookup(nativeLanguage);
        if (result === undefined && nativeLanguage !== 'en') result = lookup('en');

        if (typeof result === 'string') {
            return Object.keys(replacements).reduce((acc, key) => {
                const value = replacements[key];
                const pattern = new RegExp(`\\{${key}\\}`, 'g');
                return acc.replace(pattern, value !== undefined ? String(value) : '');
            }, result);
        }

        return result || fallback; // Return fallback if translation not found
    };

    const getIcon = (lang = language) => {
        switch (lang) {
            case 'ko':
                return <EmojioneFlagForSouthKorea />;
            case 'en':
                return <EmojioneFlagForUnitedKingdom />;
            case 'zh':
                return <EmojioneFlagForChina />;
            case 'zh-TW':
                return <TraditionalChineseCircle />;
            case 'ja':
                return <EmojioneFlagForJapan />;
            case 'es':
                return <EmojioneFlagForSpain />;
            case 'it':
                return <EmojioneFlagForItaly />;
            case 'fr':
                return <EmojioneFlagForFrance />;
            case 'de':
                return <EmojioneFlagForGermany />;
            case 'nl':
                return <EmojioneFlagForNetherlands />;
            case 'ru':
                return <EmojioneFlagForRussia />;
            case 'tr':
                return <EmojioneFlagForTurkey />;
            case 'id':
                return <EmojioneFlagForIndonesia />;
            case 'vi':
                return <EmojioneFlagForVietnam />;
            case 'hi':
                return <EmojioneFlagForIndia />;
        }
    }

    const value = {
        language,
        setLanguage,
        nativeLanguage,
        setNativeLanguage,
        supportedLanguages,
        supportedAnalysisLanguages,
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
