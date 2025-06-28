'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from '@/styles/components/pagelayout.module.scss';
import loginStyles from '@/styles/components/login.module.scss';
import Image from 'next/image';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import EmailLoginForm from '@/components/EmailLoginForm';
import RegisterForm from '@/components/RegisterForm';
import { MaterialSymbolsBookmarkSharp } from '@/components/icons/Bookmark';
import { MdiHeadphones } from '@/components/icons/Headphones';
import { MajesticonsLightbulbShine } from '@/components/icons/Lightbulb';
import { MaterialSymbolsNestClockFarsightAnalogRounded } from '@/components/icons/Clock';

import ContentPage from '@/components/ContentPage';

const Login = () => {
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();
    const { t } = useLanguage();
    const [activeTab, setActiveTab] = useState('login'); // 'login', 'register', 'google'
    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        if (!loading && isAuthenticated) {
            router.push('/profile');
        }
        document.title = t('login.pageTitle');
    }, [isAuthenticated, loading, router, t]);

    const handleTabChange = (newTab) => {
        if (newTab === activeTab) return;
        
        setIsTransitioning(true);
        
        // Small delay for smooth transition
        setTimeout(() => {
            setActiveTab(newTab);
            setTimeout(() => {
                setIsTransitioning(false);
            }, 50);
        }, 150);
    };

    if (loading) return null;

    return (
        <ContentPage>
        <div className={loginStyles.loginPage}>
            <Image src="/images/background.png" alt="Background" fill priority style={{ objectFit: 'cover' }} />
            
            <div className={loginStyles.loginContainer}>
                {/* Hero Section */}
                <div className={loginStyles.heroSection}>
                    <div className={loginStyles.heroContent}>
                        <h1 className={loginStyles.heroTitle}>{t('login.title')}</h1>
                        <p className={loginStyles.heroDescription}>
                            Master your language through interactive sentence analysis, 
                            vocabulary building, and AI-powered conversations.
                        </p>
                        
                        <div className={loginStyles.features}>
                            <div className={loginStyles.feature}>
                                <div className={loginStyles.featureIcon}>
                                    <MaterialSymbolsBookmarkSharp />
                                </div>
                                <div className={loginStyles.featureText}>
                                    <h3>Save & Study</h3>
                                    <p>Save sentences and build custom vocabulary flashcard decks</p>
                                </div>
                            </div>
                            <div className={loginStyles.feature}>
                                <div className={loginStyles.featureIcon}>
                                    <MaterialSymbolsNestClockFarsightAnalogRounded />
                                </div>
                                <div className={loginStyles.featureText}>
                                    <h3>Sentence History</h3>
                                    <p>Track your learning progress with detailed sentence analysis history</p>
                                </div>
                            </div>
                            <div className={loginStyles.feature}>
                                <div className={loginStyles.featureIcon}>
                                    <MdiHeadphones />
                                </div>
                                <div className={loginStyles.featureText}>
                                    <h3>Audio Practice</h3>
                                    <p>Generate native pronunciation audio for any sentence or word</p>
                                </div>
                            </div>
                            <div className={loginStyles.feature}>
                                <div className={loginStyles.featureIcon}>
                                    <MajesticonsLightbulbShine />
                                </div>
                                <div className={loginStyles.featureText}>
                                    <h3>AI Tutor</h3>
                                    <p>Get personalized explanations and practice with your AI language tutor</p>
                                </div>
                            </div>
                        </div>

                        <div className={loginStyles.signInInfo}>
                            <p>✨ Create your free account to get started</p>
                            <p>🔒 Secure authentication with email or Google</p>
                        </div>
                    </div>
                </div>

                {/* Auth Section */}
                <div className={loginStyles.authSection}>
                    <div className={loginStyles.authCard}>
                        <h2 className={loginStyles.authTitle}>Get Started</h2>
                        
                        <div className={loginStyles.authTabs}>
                            <button 
                                className={`${loginStyles.authTab} ${activeTab === 'login' ? loginStyles.active : ''}`}
                                onClick={() => handleTabChange('login')}
                            >
                                Sign In
                            </button>
                            <button 
                                className={`${loginStyles.authTab} ${activeTab === 'register' ? loginStyles.active : ''}`}
                                onClick={() => handleTabChange('register')}
                            >
                                Sign Up
                            </button>
                            <button 
                                className={`${loginStyles.authTab} ${activeTab === 'google' ? loginStyles.active : ''}`}
                                onClick={() => handleTabChange('google')}
                            >
                                Google
                            </button>
                        </div>

                        <div className={`${loginStyles.authContent} ${isTransitioning ? loginStyles.transitioning : ''}`}>
                            {activeTab === 'login' && <EmailLoginForm />}
                            {activeTab === 'register' && <RegisterForm />}
                            {activeTab === 'google' && (
                                <div className={loginStyles.googleContainer}>
                                    <p className={loginStyles.googleText}>
                                        Sign in quickly with your Google account
                                    </p>
                                    <GoogleSignInButton />
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
        </ContentPage>
    );
};

export default Login;