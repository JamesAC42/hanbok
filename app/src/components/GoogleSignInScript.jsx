"use client";
import { useAuth } from '@/contexts/AuthContext';
import Script from 'next/script';

export default function GoogleSignInScript() {
    const { isAuthenticated, loading } = useAuth();

    // Wait until we're done loading; if authenticated, do not render the script.
    if (loading || isAuthenticated) {
        return null;
    }

    return (
        <Script
            src="https://accounts.google.com/gsi/client"
            strategy="afterInteractive"
        />
    );
} 