'use client';

import { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from '@/styles/components/emailauth.module.scss';
import resetStyles from '@/styles/components/passwordreset.module.scss';
import Link from 'next/link';
import Image from 'next/image';
import ContentPage from '@/components/ContentPage';

const ForgotPassword = () => {
    const { t } = useLanguage();
    const [email, setEmail] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSubmitted, setIsSubmitted] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!email.trim()) {
            setError('Please enter your email address');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const response = await fetch('/api/request-password-reset', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    email: email.trim()
                }),
            });

            const data = await response.json();

            if (data.success) {
                setIsSubmitted(true);
            } else {
                setError(data.message || 'An error occurred. Please try again.');
            }
        } catch (error) {
            console.error('Forgot password error:', error);
            setError('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <ContentPage>
            <div className={resetStyles.resetPage}>
                <Image src="/images/background.png" alt="Background" fill priority style={{ objectFit: 'cover' }} />
                
                <div className={resetStyles.resetContainer}>
                    <div className={resetStyles.resetCard}>
                        {!isSubmitted ? (
                            <>
                                <h1 className={resetStyles.resetTitle}>Forgot your password?</h1>
                                <p className={resetStyles.resetSubtitle}>
                                    Enter your email address and we'll send you a link to reset your password.
                                </p>

                                <form onSubmit={handleSubmit} className={resetStyles.resetForm}>
                                    <div className={resetStyles.formGroup}>
                                        <label htmlFor="email">Email Address</label>
                                        <input
                                            type="email"
                                            id="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            placeholder="Enter your email"
                                            required
                                            disabled={isSubmitting}
                                        />
                                    </div>

                                    {error && (
                                        <div className={resetStyles.errorMessage}>
                                            {error}
                                        </div>
                                    )}

                                    <button 
                                        type="submit" 
                                        className={resetStyles.resetButton}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? 'Sending...' : 'Send Reset Link'}
                                    </button>
                                </form>

                                <div className={resetStyles.backToLogin}>
                                    <Link href="/login">
                                        ← Back to Login
                                    </Link>
                                </div>
                            </>
                        ) : (
                            <div className={resetStyles.successMessage}>
                                <h1 className={resetStyles.resetTitle}>Check your email</h1>
                                <p className={resetStyles.resetSubtitle}>
                                    If you have an account with this email, you should receive a password reset link soon.
                                </p>
                                
                                <div className={resetStyles.successIcon}>
                                    ✉️
                                </div>
                                
                                <p className={resetStyles.helpText}>
                                    Didn't receive an email? Check your spam folder or try again with a different email address.
                                </p>

                                <div className={resetStyles.backToLogin}>
                                    <Link href="/login">
                                        ← Back to Login
                                    </Link>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ContentPage>
    );
};

export default ForgotPassword; 