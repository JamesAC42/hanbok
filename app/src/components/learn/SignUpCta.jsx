'use client';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import Tiger from '@/components/Tiger';
import { loginHref } from '@/lib/anonSentences';
import { track } from '@/lib/analytics';
import styles from '@/styles/pages/learn.module.scss';

// Sign-up nudge for visitors who land on a search page. Hidden once signed in.
export default function SignUpCta({ title, source }) {
    const { user, loading } = useAuth();
    if (loading || user) return null;
    return (
        <section className={styles.signUp} aria-labelledby={`signup-${source}`}>
            <Tiger pose="celebrate" size={92} />
            <div className={styles.signUpBody}>
                <h2 className={styles.signUpTitle} id={`signup-${source}`}>{title || 'Learn Korean from the things you love'}</h2>
                <p>
                    A free Hanbok account turns every word you look up into a flashcard, breaks down
                    sentences from dramas, songs and texts, and keeps your streak going. No card needed.
                </p>
                <div className={styles.signUpActions}>
                    <div className={styles.signUpGoogle} onClickCapture={() => track('seo_signup_click', { source, method: 'google' })}>
                        <GoogleSignInButton text="signup_with" />
                    </div>
                    <Link href={loginHref(true)} className={styles.signUpEmail} onClick={() => track('seo_signup_click', { source, method: 'email' })}>
                        Sign up with email
                    </Link>
                </div>
            </div>
        </section>
    );
}
