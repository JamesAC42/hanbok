'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from '@/styles/components/login.module.scss';
import Mascot from '@/components/Mascot';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import EmailLoginForm from '@/components/EmailLoginForm';
import RegisterForm from '@/components/RegisterForm';
import HeardFromSelect from '@/components/HeardFromSelect';
import ContentPage from '@/components/ContentPage';
import Footer from '@/components/Footer';

const PERKS = [
    { color: 'read', icon: '✓', text: 'Free to start, no card needed' },
    { color: 'keep', icon: '★', text: 'Save words and sentences as flashcards' },
    { color: 'und', icon: '↻', text: 'Your history follows you to every device' },
];

const Login = () => {
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();
    const { t } = useLanguage();
    const [mode, setMode] = useState('login');

    useEffect(() => {
        if (!loading && isAuthenticated) {
            router.push('/home');
        }
        document.title = t('login.pageTitle');
    }, [isAuthenticated, loading, router, t]);

    // /login?signup opens on the sign-up tab.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.has('signup') || params.get('mode') === 'signup') setMode('signup');
    }, []);

    if (loading) return null;

    const signup = mode === 'signup';

    return (
        <ContentPage>
            <main className={styles.page}>
                <div className={styles.card}>
                    <Mascot pose={signup ? 'celebrate' : 'wave'} size={96} label="" motion="bob" className={styles.mascot} />
                    <h1 className={styles.title}>{signup ? 'Create your free account' : 'Welcome back'}</h1>
                    <p className={styles.sub}>
                        {signup
                            ? 'Keep every sentence you break down, and review it later.'
                            : 'Log in to pick up where you left off.'}
                    </p>

                    <div className={styles.tabs} role="tablist" aria-label="Log in or sign up">
                        <button type="button" role="tab" aria-selected={!signup}
                            className={!signup ? styles.tabOn : undefined} onClick={() => setMode('login')}>
                            Log in
                        </button>
                        <button type="button" role="tab" aria-selected={signup}
                            className={signup ? styles.tabOn : undefined} onClick={() => setMode('signup')}>
                            Sign up
                        </button>
                    </div>

                    {signup && (
                        <div className={styles.heardFrom}>
                            <HeardFromSelect />
                        </div>
                    )}

                    <div className={styles.google}>
                        <GoogleSignInButton key={mode} text={signup ? 'signup_with' : 'signin_with'} />
                    </div>

                    <div className={styles.divider}><span>or with email</span></div>

                    {signup ? <RegisterForm showHeardFrom={false} /> : <EmailLoginForm />}

                    <p className={styles.switch}>
                        {signup ? 'Already have an account? ' : 'New to Hanbok? '}
                        <button type="button" onClick={() => setMode(signup ? 'login' : 'signup')}>
                            {signup ? 'Log in' : 'Create a free account'}
                        </button>
                    </p>
                </div>

                <ul className={styles.perks}>
                    {PERKS.map((p) => (
                        <li key={p.text} className={styles[`perk_${p.color}`]}>
                            <i aria-hidden="true">{p.icon}</i>{p.text}
                        </li>
                    ))}
                </ul>

                <p className={styles.try}>
                    Just looking? <Link href="/analyze">Try a sentence without an account</Link>
                </p>
            </main>
            <Footer />
        </ContentPage>
    );
};

export default Login;
