'use client';
import { useEffect } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import SentenceAnalyzer from '@/components/SentenceAnalyzer';

const SentencePage = ({ params }) => {
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();
    const resolvedParams = use(params);

    // useEffect(() => {
    //     if (!loading && !isAuthenticated) {
    //         router.replace('/login');
    //     }
    // }, [isAuthenticated, loading, router]);

    // Don't render anything while loading or if not authenticated
    if (loading) return null;

    return <SentenceAnalyzer sentenceId={resolvedParams.id} />;
};

export default SentencePage; 