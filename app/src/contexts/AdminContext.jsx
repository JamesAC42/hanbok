'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { useAuth } from './AuthContext';

const AdminContext = createContext();

export function AdminProvider({ children }) {
    const { user, loading: authLoading } = useAuth();
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const isAdmin = (email) => {
        if (!email) return false;
        return admins?.includes(email.toLowerCase());
    };

    const fetchAdmins = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('/api/admin/admins', {
                credentials: 'include'
            });

            if (!response.ok) {
                throw new Error(`Failed to fetch admins: ${response.status}`);
            }

            const data = await response.json();
            setAdmins((data.admins || []).map(email => email.toLowerCase()));
        } catch (error) {
            setAdmins([]);
            setError(error);
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (authLoading) {
            return;
        }

        if (!user) {
            setAdmins([]);
            setError(null);
            setLoading(false);
            return;
        }

        fetchAdmins();
    }, [authLoading, user, fetchAdmins]);
    
    return (
        <AdminContext.Provider value={{ admins, loading, error, isAdmin }}>
            {children}
        </AdminContext.Provider>
    );
}
            
            
export const useAdmin = () => useContext(AdminContext); 
