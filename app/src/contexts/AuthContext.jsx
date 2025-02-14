'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
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
    
    const login = async (response) => {
        console.log(response);
        try {
            const loginResponse = await fetch('/api/login', { 
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ token: response.credential })
            });
            const data = await loginResponse.json();
            console.log(data);
            if(data.success) {
                console.log("loginResponse data", data);
                setUser(data.user);
            }
        } catch (error) {
            console.error('Error logging in:', error);
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

    const value = {
        user,
        loading,
        login,
        logout,
        isAuthenticated: !!user
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export const useAuth = () => useContext(AuthContext); 