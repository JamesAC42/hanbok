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
    const unlimited = t('profile.unlimited');
    const tierName =
        user.tier === 0 ? t('profile.tierTypes.free') :
        user.tier === 1 ? t('profile.tierTypes.basic') :
        user.tier === 2 ? t('profile.tierTypes.plus') :
        t('profile.tierTypes.unknown');
    const tierKey = user.tier === 1 ? 'basic' : user.tier === 2 ? 'plus' : 'free';

    const usage = [
        user.tier === 0 && {
            label: t('profile.weekSentencesRemaining'),
            value: user.weekSentencesRemaining !== undefined
                ? `${user.weekSentencesRemaining}/${user.weekSentencesTotal || 10}`
                : '0/10'
        },
        {
            label: t('profile.remainingSentenceAnalyses'),
            value: userNotFree ? unlimited : (user.remainingSentenceAnalyses ?? 0)
        },
        {
            label: t('profile.extendedTextAnalyses'),
            value: user.tier === 0
                ? `${Math.max(user.weekExtendedTextRemaining ?? 0, 0)}/${user.weekExtendedTextTotal ?? 0}`
                : unlimited
        },
        {
            label: t('profile.remainingAudioGenerations'),
            value: user.tier === 2 ? unlimited : (user.remainingAudioGenerations ?? 0)
        },
        {
            label: t('profile.remainingImageExtracts'),
            value: user.tier === 2 ? unlimited : (user.remainingImageExtracts ?? 0)
        },
        {
            label: t('profile.maxSavedSentences'),
            value: userNotFree ? unlimited : (user.maxSavedSentences ?? 0)
        },
        {
            label: t('profile.maxSavedWords'),
            value: userNotFree ? unlimited : (user.maxSavedWords ?? 0)
        }
    ].filter(Boolean);

    return (
        <Dashboard>
            <div className={profileStyles.profileContent}>
                <div className={profileStyles.profileHeader}>
                    <h1 className={profileStyles.pageTitle}>{t('profile.title')}</h1>
                    <button type="button" className={profileStyles.signOut} onClick={handleLogout}>
                        {t('profile.signOut')}
                    </button>
                </div>

                <section className={profileStyles.card}>
                    <div className={profileStyles.account}>
                        <div className={profileStyles.avatar}>{(user.name || '?').charAt(0).toUpperCase()}</div>
                        <div className={profileStyles.accountText}>
                            <strong>{user.name}</strong>
                            <span>{user.email}</span>
                        </div>
                        <span className={`${profileStyles.planChip} ${profileStyles[tierKey]}`}>{tierName}</span>
                    </div>
                </section>

                <section className={profileStyles.card}>
                    <h2 className={profileStyles.sectionLabel}>{t('profile.userInfo')}</h2>
                    <div className={profileStyles.usageGrid}>
                        {usage.map((item) => (
                            <div key={item.label} className={profileStyles.usageItem}>
                                <span className={profileStyles.usageLabel}>{item.label}</span>
                                <span className={profileStyles.usageValue}>{item.value}</span>
                            </div>
                        ))}
                    </div>
                </section>

                <section className={profileStyles.card}>
                    <h2 className={profileStyles.sectionLabel}>{t('profile.tier')}</h2>
                    <p className={profileStyles.planText}>
                        <strong>{t(`profile.tierInfo.${tierKey}.title`)}:</strong> {t(`profile.tierInfo.${tierKey}.description`)}
                    </p>
                    <div className={profileStyles.planLinks}>
                        <Link href="/pricing">{t('profile.tierInfo.moreDetails')} Pricing page</Link>
                        {userNotFree && (
                            <a href="https://billing.stripe.com/p/login/fZe9EtgcAgFe6UU5kk" target="_blank" rel="noreferrer">
                                {t('profile.manageSubscriptionLink')}
                            </a>
                        )}
                    </div>
                </section>

                {user.tier != 2 && !user.feedbackAudioCreditRedeemed && (
                    <section className={profileStyles.bonusAlert}>
                        <h3>{t('profile.bonusAlert.title')}</h3>
                        <p>
                            {t('profile.bonusAlert.description')} <Link href="/feedback">feedback page</Link>
                        </p>
                    </section>
                )}

                <p className={profileStyles.settingsMessage}>
                    {t('profile.settingsMoved')}
                </p>
            </div>
        </Dashboard>
    );
};

export default Profile;
