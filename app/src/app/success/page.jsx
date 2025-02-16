'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/styles/components/pagelayout.module.scss';
import successStyles from '@/styles/components/success.module.scss';
import Image from 'next/image';
import Link from 'next/link';
import { MaterialSymbolsCheckCircleOutlineRounded } from '@/components/icons/CheckCircle';

const Success = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const { isAuthenticated, loading, fetchSession } = useAuth();
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
                            <h1>Processing Payment...</h1>
                            <p>Please wait while we confirm your payment.</p>
                        </>
                    ) : (
                        <>
                            <div className={successStyles.checkmark}>
                                <MaterialSymbolsCheckCircleOutlineRounded />
                            </div>
                            <h1>Thank You!</h1>
                            <p>Your payment was successful and your account has been upgraded.</p>
                            <div className={successStyles.buttons}>
                                <Link href="/profile" className={successStyles.button}>
                                    View Profile
                                </Link>
                                <Link href="/" className={successStyles.button}>
                                    Start Learning
                                </Link>
                            </div>
                        </>
                    )}
                </div>
            </div>
            <div className={styles.girlContainer}>
                <Image
                    src="/images/girl1.png"
                    alt="girl"
                    width={1920}
                    height={1080}
                    priority
                />
            </div>
        </div>
    );
};

export default Success; 