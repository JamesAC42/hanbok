'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Dashboard from '@/components/Dashboard';
import HomeView from '@/components/home/HomeView';
import { useAuth } from '@/contexts/AuthContext';

export default function HomePage() {
    const { isAuthenticated, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        document.title = 'Home · Hanbok';
    }, []);

    useEffect(() => {
        if (!loading && !isAuthenticated) router.replace('/analyze');
    }, [loading, isAuthenticated, router]);

    return (
        <Dashboard>
            {isAuthenticated ? <HomeView /> : null}
        </Dashboard>
    );
}
