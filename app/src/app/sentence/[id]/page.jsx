'use client';
import { useEffect } from 'react';
import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import SentenceAnalyzer from '@/components/SentenceAnalyzer';
import Dashboard from '@/components/Dashboard';

import styles from '@/styles/pages/analysispage.module.scss';

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

    return <Dashboard noScroll={true}>
        <div className={styles.analysisContainer}>
            <SentenceAnalyzer sentenceId={resolvedParams.id} />
        </div>
    </Dashboard>;
};

export default SentencePage; 