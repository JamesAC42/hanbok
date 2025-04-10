'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from '@/styles/components/pagelayout.module.scss';
import successStyles from '@/styles/components/success.module.scss';
import Image from 'next/image';
import Link from 'next/link';
import { MaterialSymbolsCheckCircleOutlineRounded } from '@/components/icons/CheckCircle';

const SuccessContent = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated, loading, fetchSession } = useAuth();
    const { t } = useLanguage();
    const [processingPayment, setProcessingPayment] = useState(true);

    // Handle initial redirect checks
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.replace('/login');
        }

        const sessionId = searchParams.get('session_id');
        if (!sessionId) {
            router.replace('/');
        }
    }, [loading, isAuthenticated, router, searchParams]);

    // Handle payment processing separately
    useEffect(() => {
        if (processingPayment) {
            const timer = setTimeout(async () => {
                await fetchSession();
                setProcessingPayment(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [processingPayment]); // Only depend on processingPayment

    if (loading || !isAuthenticated) return null;

    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageContent}>
                <div className={successStyles.successContent}>
                    {processingPayment ? (
                        <>
                            <h1>{t('success.processing.title')}</h1>
                            <p>{t('success.processing.description')}</p>
                        </>
                    ) : (
                        <>
                            <div className={successStyles.checkmark}>
                                <MaterialSymbolsCheckCircleOutlineRounded />
                            </div>
                            <h1>{t('success.completed.title')}</h1>
                            <p>{t('success.completed.description')}</p>
                            <div className={successStyles.buttons}>
                                <Link href="/profile" className={successStyles.button}>
                                    {t('success.completed.viewProfile')}
                                </Link>
                                <Link href="/" className={successStyles.button}>
                                    {t('success.completed.startLearning')}
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
};

const Success = () => {
    return (
        <Suspense fallback={<div>Loading...</div>}>
            <SuccessContent />
        </Suspense>
    );
};

export default Success; 