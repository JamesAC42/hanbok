'use client';
import { createContext, useContext, useState, useEffect } from 'react';

const AdminContext = createContext();

export function AdminProvider({ children }) {
    
    const [admins, setAdmins] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const isAdmin = (email) => {
        return admins?.includes(email);
    }

    useEffect(() => {
        const fetchAdmins = async () => {
            try {
                const response = await fetch('/api/admin/admins');
                const data = await response.json();
                setAdmins(data.admins);
            } catch (error) {
                setError(error);
            } finally {
                setLoading(false);
            }
        };

        fetchAdmins();
    }, []);
    
    return (
        <AdminContext.Provider value={{ admins, loading, error, isAdmin }}>
            {children}
        </AdminContext.Provider>
    );
}
            
            
export const useAdmin = () => useContext(AdminContext); 