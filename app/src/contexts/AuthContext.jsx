'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { track, getAttribution, identifyUser } from '@/lib/analytics';
import { claimAnonSentences } from '@/lib/anonSentences';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    // user object now includes: tier (0 for free, 1 for basic, 2 for plus), 
    // remainingAudioGenerations (number), and remainingImageExtracts (number)
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        identifyUser(user);
    }, [user?.userId, user?.tier]);

    // Sentences broken down before signing in join this account's history.
    useEffect(() => {
        if (user?.userId) claimAnonSentences();
    }, [user?.userId]);

    useEffect(() => {
        fetchSession();
    }, []);

    const fetchSession = useCallback(async () => {
        try {
            const res = await fetch('/api/session');
            const data = await res.json();
            console.log("Session response:", data);
            setUser(data.user);
        } catch (error) {
            console.error('Error fetching session:', error);
        } finally {
            setLoading(false);
        }
    }, []);

    const decrementRemainingAudioGenerations = useCallback(() => {
        setUser(prevUser => ({
            ...prevUser,
            remainingAudioGenerations: prevUser.remainingAudioGenerations - 1
        }));
    }, []);
    
    const decrementRemainingImageExtracts = useCallback(() => {
        setUser(prevUser => ({
            ...prevUser,
            remainingImageExtracts: prevUser.remainingImageExtracts - 1
        }));
    }, []);
    
    const decrementRemainingSentenceAnalyses = useCallback(() => {
        setUser(prevUser => ({
            ...prevUser,
            remainingSentenceAnalyses: Math.max((prevUser.remainingSentenceAnalyses || 0) - 1, 0)
        }));
    }, []);
    
    const updateWeeklySentenceQuota = useCallback((weekSentencesUsed, weekSentencesTotal, weekSentencesRemaining) => {
        setUser(prevUser => ({
            ...prevUser,
            weekSentencesUsed,
            weekSentencesTotal,
            weekSentencesRemaining
        }));
    }, []);

    const updateExtendedTextQuota = useCallback((weekExtendedTextUsed, weekExtendedTextTotal, weekExtendedTextRemaining) => {
        setUser(prevUser => {
            if (!prevUser) return prevUser;
            return {
                ...prevUser,
                weekExtendedTextUsed,
                weekExtendedTextTotal,
                weekExtendedTextRemaining
            };
        });
    }, []);
    
    const login = useCallback(async (userDataOrGoogleResponse) => {
        // If the parameter has a 'credential' property, it's a Google OAuth response
        if (userDataOrGoogleResponse.credential) {
            try {
                const loginResponse = await fetch('/api/login', { 
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        token: userDataOrGoogleResponse.credential,
                        attribution: getAttribution()
                    })
                });
                const data = await loginResponse.json();
                console.log("Login response:", data);
                if(data.success) {
                    if (data.isNewUser) {
                        track('signup', { method: 'google' });
                    }
                    setUser(data.user);
                }
            } catch (error) {
                console.error('Error logging in with Google:', error);
            }
        } else {
            // Otherwise, it's user data from email/password login
            setUser(userDataOrGoogleResponse);
        }
    }, []);

    const logout = useCallback(async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
            setUser(null);
        } catch (error) {
            console.error('Error logging out:', error);
        }
    }, []);

    const loadSentence = useCallback(async (sentenceId) => {
        try {
            const response = await fetch(`/api/sentences/${sentenceId}`);
            const data = await response.json();
            
            if (data.success) {
                return {
                    success: true,
                    sentence: data.sentence
                };
            } else {
                return {
                    success: false,
                    error: data.error
                };
            }
        } catch (error) {
            console.error('Error loading sentence:', error);
            return {
                success: false,
                error: 'Failed to load sentence'
            };
        }
    }, []);

    const value = {
        user,
        loading,
        login,
        fetchSession,
        logout,
        loadSentence,
        decrementRemainingAudioGenerations,
        decrementRemainingImageExtracts,
        decrementRemainingSentenceAnalyses,
        updateWeeklySentenceQuota,
        updateExtendedTextQuota,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext); 
