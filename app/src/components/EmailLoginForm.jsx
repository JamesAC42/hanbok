'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import styles from '@/styles/components/emailauth.module.scss';

const EmailLoginForm = () => {
    const [formData, setFormData] = useState({
        email: '',
        password: ''
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [showResendVerification, setShowResendVerification] = useState(false);
    const { login } = useAuth();
    const router = useRouter();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        // Clear error when user starts typing
        if (error) setError('');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!formData.email || !formData.password) {
            setError('Please fill in all fields');
            return;
        }

        setLoading(true);
        setError('');
        setShowResendVerification(false);

        try {
            const response = await fetch('/api/login-email', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'include',
                body: JSON.stringify(formData)
            });

            const data = await response.json();

            if (data.success) {
                // Update auth context with user data
                await login(data.user);
                router.push('/profile');
            } else {
                setError(data.message);
                if (data.requiresVerification) {
                    setShowResendVerification(true);
                }
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('Login failed. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    const handleResendVerification = async () => {
        setLoading(true);
        setError('');
        
        try {
            const response = await fetch('/api/resend-verification', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({ email: formData.email })
            });

            const data = await response.json();
            
            if (data.success) {
                setError('Verification email sent! Please check your inbox.');
                setShowResendVerification(false);
            } else {
                setError(data.message);
            }
        } catch (error) {
            console.error('Resend verification error:', error);
            setError('Failed to send verification email. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.authForm}>
            <form onSubmit={handleSubmit}>
                <div className={styles.formGroup}>
                    <label htmlFor="email">Email Address</label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        placeholder="Enter your email"
                    />
                </div>

                <div className={styles.formGroup}>
                    <label htmlFor="password">Password</label>
                    <input
                        type="password"
                        id="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                        disabled={loading}
                        placeholder="Enter your password"
                    />
                </div>

                {error && (
                    <div className={`${styles.error} ${showResendVerification ? styles.info : ''}`}>
                        {error}
                    </div>
                )}

                {showResendVerification && (
                    <div className={styles.resendContainer}>
                        <button
                            type="button"
                            onClick={handleResendVerification}
                            className={styles.resendButton}
                            disabled={loading}
                        >
                            Resend Verification Email
                        </button>
                    </div>
                )}

                <button
                    type="submit"
                    className={styles.submitButton}
                    disabled={loading}
                >
                    {loading ? 'Signing In...' : 'Sign In'}
                </button>
            </form>
        </div>
    );
};

export default EmailLoginForm; 