'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/styles/components/pagelayout.module.scss';
import loginStyles from '@/styles/components/login.module.scss';
import Image from 'next/image';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { MaterialSymbolsBookmarkSharp } from '@/components/icons/Bookmark';
import { MdiHeadphones } from '@/components/icons/Headphones';
import { MajesticonsLightbulbShine } from '@/components/icons/Lightbulb';
import { MaterialSymbolsNestClockFarsightAnalogRounded } from '@/components/icons/Clock';


const Login = () => {
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();

    useEffect(() => {
        if (!loading && isAuthenticated) {
            router.push('/profile');
        }
    }, [isAuthenticated, loading, router]);

    if (loading) return null;

    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageContent}>
                <div className={loginStyles.loginContent}>
                    <h1 className={loginStyles.loginTitle}>Login</h1>
                    <p className={loginStyles.loginDescription}>
                        Log in with Google to unlock powerful features for your Korean learning journey. Don't have an account? One will be created for you automatically.
                    </p>
                    
                    <div className={loginStyles.features}>
                        <div className={loginStyles.feature}>
                            <div className={loginStyles.featureIcon}>
                                <MaterialSymbolsBookmarkSharp />
                            </div>
                            Save sentences and words for later review
                        </div>
                        <div className={loginStyles.feature}>
                            <div className={loginStyles.featureIcon}>
                                <MaterialSymbolsNestClockFarsightAnalogRounded />
                            </div>
                            Coming soon: Spaced repetition flashcards
                        </div>
                        <div className={loginStyles.feature}>
                            <div className={loginStyles.featureIcon}>
                                <MdiHeadphones />
                            </div>
                            15 free audio sentence generations
                        </div>
                        <div className={loginStyles.feature}>
                            <div className={loginStyles.featureIcon}>
                                <MajesticonsLightbulbShine />
                            </div>
                            Access to upcoming premium features
                        </div>
                    </div>

                    <div className={loginStyles.signInInfo}>
                        <p>✨ Free Account</p>
                        <p>🔐 Secure Google Sign In</p>
                    </div>

                    <div className={loginStyles.buttonContainer}>
                        <GoogleSignInButton />
                    </div>
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

export default Login;