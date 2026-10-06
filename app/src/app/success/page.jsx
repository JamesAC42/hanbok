'use client';
import { useEffect, useState, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import successStyles from '@/styles/components/success.module.scss';
import Link from 'next/link';
import { track } from '@/lib/analytics';
import Dashboard from '@/components/Dashboard';
import Mascot from '@/components/Mascot';
import Confetti from '@/components/celebrate/Confetti';

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

                // Fire once per checkout session so refreshes don't double count
                const sessionId = searchParams.get('session_id');
                const trackedKey = `purchaseTracked:${sessionId}`;
                try {
                    if (sessionId && !sessionStorage.getItem(trackedKey)) {
                        sessionStorage.setItem(trackedKey, '1');
                        track('purchase');
                    }
                } catch (e) {
                    // sessionStorage unavailable; skip tracking
                }
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [processingPayment]); // Only depend on processingPayment

    if (loading || !isAuthenticated) return null;

    return (
        <Dashboard>
            <div className={successStyles.successPage}>
                <div className={`${successStyles.successContent} ${processingPayment ? '' : successStyles.done}`}>
                    {processingPayment ? (
                        <>
                            <Mascot pose="think" size={130} motion="bob" className={successStyles.mascot} />
                            <h1>{t('success.processing.title')}</h1>
                            <p>{t('success.processing.description')}</p>
                            <div className={successStyles.progress} role="progressbar" aria-label={t('success.processing.title')}>
                                <i />
                            </div>
                        </>
                    ) : (
                        <>
                            <Confetti />
                            <Mascot pose="celebrate" size={150} motion="hop" className={successStyles.mascot} />
                            <h1>{t('success.completed.title')}</h1>
                            <p>{t('success.completed.description')}</p>
                            <div className={successStyles.buttons}>
                                <Link href="/" className={successStyles.primaryButton}>
                                    {t('success.completed.startLearning')}
                                </Link>
                                <Link href="/profile" className={successStyles.secondaryLink}>
                                    {t('success.completed.viewProfile')}
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Dashboard>
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