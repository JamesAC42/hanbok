'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    // user object now includes: tier (0 for free, 1 for basic, 2 for plus), 
    // remainingAudioGenerations (number), and remainingImageExtracts (number)
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSession();
    }, []);

    const fetchSession = async () => {
        try {
            const res = await fetch('/api/session');
            const data = await res.json();
            setUser(data.user);
        } catch (error) {
            console.error('Error fetching session:', error);
        } finally {
            setLoading(false);
        }
    };

    const decrementRemainingAudioGenerations = () => {
        setUser(prevUser => ({
            ...prevUser,
            remainingAudioGenerations: prevUser.remainingAudioGenerations - 1
        }));
    }
    
    const decrementRemainingImageExtracts = () => {
        setUser(prevUser => ({
            ...prevUser,
            remainingImageExtracts: prevUser.remainingImageExtracts - 1
        }));
    }
    
    const decrementRemainingSentenceAnalyses = () => {
        setUser(prevUser => ({
            ...prevUser,
            remainingSentenceAnalyses: Math.max((prevUser.remainingSentenceAnalyses || 0) - 1, 0)
        }));
    }
    
    const updateWeeklySentenceQuota = (weekSentencesUsed, weekSentencesTotal, weekSentencesRemaining) => {
        setUser(prevUser => ({
            ...prevUser,
            weekSentencesUsed,
            weekSentencesTotal,
            weekSentencesRemaining
        }));
    }

    const updateExtendedTextQuota = (weekExtendedTextUsed, weekExtendedTextTotal, weekExtendedTextRemaining) => {
        setUser(prevUser => {
            if (!prevUser) return prevUser;
            return {
                ...prevUser,
                weekExtendedTextUsed,
                weekExtendedTextTotal,
                weekExtendedTextRemaining
            };
        });
    }
    
    const login = async (userDataOrGoogleResponse) => {
        // If the parameter has a 'credential' property, it's a Google OAuth response
        if (userDataOrGoogleResponse.credential) {
            try {
                const loginResponse = await fetch('/api/login', { 
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ token: userDataOrGoogleResponse.credential })
                });
                const data = await loginResponse.json();
                if(data.success) {
                    setUser(data.user);
                }
            } catch (error) {
                console.error('Error logging in with Google:', error);
            }
        } else {
            // Otherwise, it's user data from email/password login
            setUser(userDataOrGoogleResponse);
        }
    };

    const logout = async () => {
        try {
            await fetch('/api/logout', { method: 'POST' });
            setUser(null);
        } catch (error) {
            console.error('Error logging out:', error);
        }
    };

    const loadSentence = async (sentenceId) => {
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
    };

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
