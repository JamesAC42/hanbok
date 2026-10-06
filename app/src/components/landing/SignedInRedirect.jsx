'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

// Signed-in learners start on their Home dashboard instead of the landing page.
export default function SignedInRedirect() {
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();
    useEffect(() => {
        if (!loading && isAuthenticated) router.replace('/home');
    }, [loading, isAuthenticated, router]);
    return null;
}
