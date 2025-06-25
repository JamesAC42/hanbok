'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from '@/styles/components/pagelayout.module.scss';
import loginStyles from '@/styles/components/login.module.scss';
import Image from 'next/image';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { MaterialSymbolsBookmarkSharp } from '@/components/icons/Bookmark';
import { MdiHeadphones } from '@/components/icons/Headphones';
import { MajesticonsLightbulbShine } from '@/components/icons/Lightbulb';
import { MaterialSymbolsNestClockFarsightAnalogRounded } from '@/components/icons/Clock';

import ContentPage from '@/components/ContentPage';

const Login = () => {
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();
    const { t } = useLanguage();

    useEffect(() => {
        if (!loading && isAuthenticated) {
            router.push('/profile');
        }
        document.title = t('login.pageTitle');
    }, [isAuthenticated, loading, router, t]);

    if (loading) return null;

    return (
        <ContentPage>
        <div className={loginStyles.loginPage}>
            <Image src="/images/background.png" alt="Background" fill priority style={{ objectFit: 'cover' }} />
            
            <div className={loginStyles.loginContainer}>
                <div className={loginStyles.loginContent}>
                    <h1 className={loginStyles.loginTitle}>{t('login.title')}</h1>
                    <p className={loginStyles.loginDescription}>
                        {t('login.description')}
                    </p>
                    
                    <div className={loginStyles.features}>
                        <div className={loginStyles.feature}>
                            <div className={loginStyles.featureIcon}>
                                <MaterialSymbolsBookmarkSharp />
                            </div>
                            {t('login.features.save')}
                        </div>
                        <div className={loginStyles.feature}>
                            <div className={loginStyles.featureIcon}>
                                <MdiHeadphones />
                            </div>
                            {t('login.features.audio')}
                        </div>
                        <div className={loginStyles.feature}>
                            <div className={loginStyles.featureIcon}>
                                <MajesticonsLightbulbShine />
                            </div>
                            {t('login.features.premium')}
                        </div>
                    </div>

                    <div className={loginStyles.signInInfo}>
                        <p>{t('login.freeAccount')}</p>
                        <p>{t('login.secureSignIn')}</p>
                    </div>

                    <div className={loginStyles.buttonContainer}>
                        <GoogleSignInButton />
                    </div>
                </div>
            </div>
        </div>
        </ContentPage>
    );
};

export default Login;