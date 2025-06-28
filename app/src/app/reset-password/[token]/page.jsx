'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from '@/styles/components/emailauth.module.scss';
import resetStyles from '@/styles/components/passwordreset.module.scss';
import Link from 'next/link';
import Image from 'next/image';
import ContentPage from '@/components/ContentPage';

const ResetPassword = () => {
    const { t } = useLanguage();
    const { token } = useParams();
    const router = useRouter();
    
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSuccess, setIsSuccess] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!token) {
            setError('Invalid reset link');
        }
    }, [token]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!newPassword || !confirmPassword) {
            setError('Please fill in all fields');
            return;
        }

        if (newPassword.length < 8) {
            setError('Password must be at least 8 characters long');
            return;
        }

        if (newPassword !== confirmPassword) {
            setError('Passwords do not match');
            return;
        }

        setIsSubmitting(true);
        setError('');

        try {
            const response = await fetch('/api/reset-password', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    token: token,
                    newPassword: newPassword
                }),
            });

            const data = await response.json();

            if (data.success) {
                setIsSuccess(true);
                // Redirect to login after 3 seconds
                setTimeout(() => {
                    router.push('/login');
                }, 3000);
            } else {
                setError(data.message || 'An error occurred. Please try again.');
            }
        } catch (error) {
            console.error('Password reset error:', error);
            setError('An error occurred. Please try again.');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!token) {
        return (
            <ContentPage>
                <div className={resetStyles.resetPage}>
                    <Image src="/images/background.png" alt="Background" fill priority style={{ objectFit: 'cover' }} />
                    
                    <div className={resetStyles.resetContainer}>
                        <div className={resetStyles.resetCard}>
                            <h1 className={resetStyles.resetTitle}>Invalid Reset Link</h1>
                            <p className={resetStyles.resetSubtitle}>
                                This password reset link is invalid or has expired.
                            </p>
                            
                            <div className={resetStyles.backToLogin}>
                                <Link href="/forgot-password">
                                    Request a new reset link
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </ContentPage>
        );
    }

    return (
        <ContentPage>
            <div className={resetStyles.resetPage}>
                <Image src="/images/background.png" alt="Background" fill priority style={{ objectFit: 'cover' }} />
                
                <div className={resetStyles.resetContainer}>
                    <div className={resetStyles.resetCard}>
                        {!isSuccess ? (
                            <>
                                <h1 className={resetStyles.resetTitle}>Set New Password</h1>
                                <p className={resetStyles.resetSubtitle}>
                                    Enter a new password for your account.
                                </p>

                                <form onSubmit={handleSubmit} className={resetStyles.resetForm}>
                                    <div className={resetStyles.formGroup}>
                                        <label htmlFor="newPassword">New Password</label>
                                        <input
                                            type="password"
                                            id="newPassword"
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="Enter new password (min. 8 characters)"
                                            required
                                            disabled={isSubmitting}
                                            minLength={8}
                                        />
                                    </div>

                                    <div className={resetStyles.formGroup}>
                                        <label htmlFor="confirmPassword">Confirm Password</label>
                                        <input
                                            type="password"
                                            id="confirmPassword"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Confirm new password"
                                            required
                                            disabled={isSubmitting}
                                            minLength={8}
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
                                        {isSubmitting ? 'Updating...' : 'Update Password'}
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
                                <h1 className={resetStyles.resetTitle}>Password Updated!</h1>
                                <p className={resetStyles.resetSubtitle}>
                                    Your password has been successfully updated. You can now log in with your new password.
                                </p>
                                
                                <div className={resetStyles.successIcon}>
                                    ✅
                                </div>
                                
                                <p className={resetStyles.helpText}>
                                    Redirecting you to the login page in 3 seconds...
                                </p>

                                <div className={resetStyles.backToLogin}>
                                    <Link href="/login">
                                        Go to Login →
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

export default ResetPassword; 