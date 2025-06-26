'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('light');
    const [loading, setLoading] = useState(true);

    // Load saved theme on mount
    useEffect(() => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme) {
            setTheme(savedTheme);
        }
        setLoading(false);
    }, []);

    // Save theme when it changes
    useEffect(() => {
        localStorage.setItem('theme', theme);
    }, [theme]);

    return (
        <ThemeContext.Provider value={{ theme, setTheme, loading }}>
            <div className={`theme-${theme}`}>
                {children}
            </div>
        </ThemeContext.Provider>
    );
}
export const useTheme = () => useContext(ThemeContext);