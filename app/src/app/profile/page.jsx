'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import profileStyles from '@/styles/components/profile.module.scss';
import Link from 'next/link';
import Dashboard from '@/components/Dashboard';

const Profile = () => {

    const router = useRouter();
    const { user, isAuthenticated, loading, logout } = useAuth();
    const { t } = useLanguage();

    const handleLogout = () => {
        logout();
        router.push('/');
    }

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.replace('/login');
        }
        if(!loading && isAuthenticated) {
            document.title = `${t('profile.pageTitle')} - ${user.name}`;
        }
    }, [isAuthenticated, loading, router, t]);

    // Don't render anything while loading or if not authenticated
    if (loading || !isAuthenticated) return null;

    const userNotFree = user.tier === 1 || user.tier === 2;

    return (
        <Dashboard>
            <div className={profileStyles.profileContent}>
                <h1 className={profileStyles.pageTitle}>{t('profile.title')}</h1>
                <div className={profileStyles.signOut}>
                    <div onClick={handleLogout}>{t('profile.signOut')}</div>
                </div>
                <div className={profileStyles.userDetails}>
                    <h2>{t('profile.userInfo')}</h2>
                    <p><strong>{t('profile.name')}:</strong> {user.name}</p>
                    <p><strong>{t('profile.email')}:</strong> {user.email}</p>
                    <p>
                        <strong>{t('profile.tier')}:</strong> {
                            user.tier === 0 ? t('profile.tierTypes.free') :
                            user.tier === 1 ? t('profile.tierTypes.basic') :
                            user.tier === 2 ? t('profile.tierTypes.plus') :
                            t('profile.tierTypes.unknown')
                        }
                    </p>
                    {user.tier === 0 && (
                        <p>
                            <strong>{t('profile.weekSentencesRemaining')}:</strong> {
                                user.weekSentencesRemaining !== undefined ? 
                                `${user.weekSentencesRemaining}/${user.weekSentencesTotal || 10}` : 
                                `0/10`
                            }
                        </p>
                    )}
                    <p>
                        <strong>{t('profile.remainingAudioGenerations')}:</strong> {
                            user.tier === 2 ? t('profile.unlimited') :
                            user.remainingAudioGenerations == null ? "0" :
                            user.remainingAudioGenerations
                        }
                    </p>
                    <p>
                        <strong>{t('profile.maxSavedSentences')}:</strong> {
                            userNotFree ? t('profile.unlimited') :
                            user.maxSavedSentences == null ? "0" :
                            user.maxSavedSentences
                        }
                    </p>
                    <p>
                        <strong>{t('profile.maxSavedWords')}:</strong> {
                            userNotFree ? t('profile.unlimited') :
                            user.maxSavedWords == null ? "0" :
                            user.maxSavedWords
                        }
                    </p>
                    <p>
                        <strong>{t('profile.remainingImageExtracts')}:</strong> {
                            user.tier === 2 ? t('profile.unlimited') :
                            user.remainingImageExtracts == null ? "0" :
                            user.remainingImageExtracts
                        }
                    </p>
                    <p>
                        <strong>{t('profile.remainingSentenceAnalyses')}:</strong> {
                            userNotFree ? t('profile.unlimited') :
                            user.remainingSentenceAnalyses == null ? "0" :
                            user.remainingSentenceAnalyses
                        }
                    </p>
                    <p>
                        <strong>{t('profile.extendedTextAnalyses')}:</strong> {
                            user.tier === 0
                                ? `${Math.max(user.weekExtendedTextRemaining ?? 0, 0)}/${user.weekExtendedTextTotal ?? 0}`
                                : t('profile.unlimited')
                        }
                    </p>
                </div>

                <div className={profileStyles.settingsContainer}>
                    <div className={profileStyles.settingsHeader}>
                        <h2>{t('profile.settings')}</h2>
                    </div>
                    <p className={profileStyles.settingsMessage}>
                        {t('profile.settingsMoved')}
                    </p>
                </div>

                {
                    userNotFree && (
                        <div className={profileStyles.manageSubscription}>
                            <h2>{t('profile.manageSubscription')}</h2>
                            <a href="https://billing.stripe.com/p/login/fZe9EtgcAgFe6UU5kk" target="_blank">
                                {t('profile.manageSubscriptionLink')}
                            </a>
                        </div>
                    )
                }
                {user.tier != 2 && !user.feedbackAudioCreditRedeemed && (
                    <div className={profileStyles.bonusAlert}>
                        <h3>{t('profile.bonusAlert.title')}</h3>
                        <p>
                            {t('profile.bonusAlert.description')} <Link href="/feedback">feedback page</Link>
                        </p>
                    </div>
                )}
                <div className={profileStyles.tierInfo}>
                    {user.tier === 1 ? (
                        <>
                            <p><strong>{t('profile.tierInfo.basic.title')}:</strong> {t('profile.tierInfo.basic.description')}</p>
                            <p>{t('profile.tierInfo.moreDetails')} <Link href="/pricing">Pricing</Link> page.</p>
                        </>
                    ) : user.tier === 2 ? (
                        <>
                            <p><strong>{t('profile.tierInfo.plus.title')}:</strong> {t('profile.tierInfo.plus.description')}</p>
                            <p>{t('profile.tierInfo.moreDetails')} <Link href="/pricing">Pricing</Link> page.</p>
                        </>
                    ) : (
                        <>
                            <p><strong>{t('profile.tierInfo.free.title')}:</strong> {t('profile.tierInfo.free.description')}</p>
                            <p>{t('profile.tierInfo.moreDetails')} <Link href="/pricing">Pricing</Link> page.</p>
                        </>
                    )}
                </div>
            </div>
        </Dashboard>
    );
};

export default Profile;
