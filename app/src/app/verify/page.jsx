'use client';
import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ContentPage from '@/components/ContentPage';
import styles from '@/styles/components/verify.module.scss';

const VerifyEmail = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const [status, setStatus] = useState('verifying'); // 'verifying', 'success', 'error'
    const [message, setMessage] = useState('');
    const code = searchParams.get('code');

    useEffect(() => {
        document.title = 'Email Verification - Hanbok Study';
        
        if (!code) {
            setStatus('error');
            setMessage('No verification code provided. Please check your verification link.');
            return;
        }

        verifyEmail();
    }, [code]);

    const verifyEmail = async () => {
        try {
            const response = await fetch(`/api/verify/${code}`, {
                method: 'GET',
                credentials: 'include'
            });

            const data = await response.json();

            if (data.success) {
                setStatus('success');
                setMessage(data.message);
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } else {
                setStatus('error');
                setMessage(data.message);
            }
        } catch (error) {
            console.error('Verification error:', error);
            setStatus('error');
            setMessage('Verification failed. Please try again or contact support.');
        }
    };

    const handleResendVerification = async () => {
        const email = prompt('Please enter your email address to resend verification:');
        if (!email) return;

        try {
            const response = await fetch('/api/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email })
            });

            const data = await response.json();
            
            if (data.success) {
                setMessage('Verification email sent! Please check your inbox.');
            } else {
                setMessage(data.message);
            }
        } catch (error) {
            console.error('Resend verification error:', error);
            setMessage('Failed to send verification email. Please try again.');
        }
    };

    return (
        <ContentPage>
            <div className={styles.verifyPage}>
                <div className={styles.verifyContainer}>
                    <div className={styles.verifyContent}>
                        {status === 'verifying' && (
                            <>
                                <div className={styles.spinner}></div>
                                <h1>Verifying your email...</h1>
                                <p>Please wait while we verify your email address.</p>
                            </>
                        )}

                        {status === 'success' && (
                            <>
                                <div className={styles.successIcon}>✅</div>
                                <h1>Email Verified!</h1>
                                <p>{message}</p>
                                <p className={styles.redirectNote}>
                                    You'll be redirected to the login page in a few seconds...
                                </p>
                                <button 
                                    onClick={() => router.push('/login')}
                                    className={styles.loginButton}
                                >
                                    Go to Login
                                </button>
                            </>
                        )}

                        {status === 'error' && (
                            <>
                                <div className={styles.errorIcon}>❌</div>
                                <h1>Verification Failed</h1>
                                <p>{message}</p>
                                <div className={styles.actionButtons}>
                                    <button 
                                        onClick={handleResendVerification}
                                        className={styles.resendButton}
                                    >
                                        Resend Verification Email
                                    </button>
                                    <button 
                                        onClick={() => router.push('/login')}
                                        className={styles.loginButton}
                                    >
                                        Back to Login
                                    </button>
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </ContentPage>
    );
};

export default VerifyEmail; 