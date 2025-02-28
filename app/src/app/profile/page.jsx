'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from '@/styles/components/pagelayout.module.scss';
import profileStyles from '@/styles/components/profile.module.scss';
import Image from 'next/image';
import Link from 'next/link';

const Profile = () => {
    const router = useRouter();
    const { user, isAuthenticated, loading } = useAuth();
    const { t } = useLanguage();

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.replace('/login');
        }
    }, [isAuthenticated, loading, router]);

    // Don't render anything while loading or if not authenticated
    if (loading || !isAuthenticated) return null;

    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageContent}>
                <div className={profileStyles.profileContent}>
                    <h1 className={styles.pageTitle}>{t('profile.title')}</h1>
                    <div className={profileStyles.userDetails}>
                        <h2>{t('profile.userInfo')}</h2>
                        <p><strong>{t('profile.name')}:</strong> {user.name}</p>
                        <p><strong>{t('profile.email')}:</strong> {user.email}</p>
                        <p>
                            <strong>{t('profile.tier')}:</strong> {
                                user.tier === 0 ? t('profile.tierTypes.basic') :
                                user.tier === 1 ? t('profile.tierTypes.plus') :
                                t('profile.tierTypes.unknown')
                            }
                        </p>
                        <p>
                            <strong>{t('profile.remainingAudioGenerations')}:</strong> {
                                user.tier === 1 ? t('profile.unlimited') :
                                user.remainingAudioGenerations == null ? "0" :
                                user.remainingAudioGenerations
                            }
                        </p>
                        <p>
                            <strong>{t('profile.maxSavedSentences')}:</strong> {
                                user.tier === 1 ? t('profile.unlimited') :
                                user.maxSavedSentences == null ? "0" :
                                user.maxSavedSentences
                            }
                        </p>
                        <p>
                            <strong>{t('profile.maxSavedWords')}:</strong> {
                                user.tier === 1 ? t('profile.unlimited') :
                                user.maxSavedWords == null ? "0" :
                                user.maxSavedWords
                            }
                        </p>
                        <p>
                            <strong>{t('profile.remainingImageExtracts')}:</strong> {
                                user.tier === 1 ? t('profile.unlimited') :
                                user.remainingImageExtracts == null ? "0" :
                                user.remainingImageExtracts
                            }
                        </p>
                    </div>
                    {!user.feedbackAudioCreditRedeemed && (
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
                                <p><strong>{t('profile.tierInfo.plus.title')}:</strong> {t('profile.tierInfo.plus.description')}</p>
                                <p>{t('profile.tierInfo.moreDetails')} <Link href="/pricing">Pricing</Link> page.</p>
                            </>
                        ) : (
                            <>
                                <p><strong>{t('profile.tierInfo.basic.title')}:</strong> {t('profile.tierInfo.basic.description')}</p>
                                <p>{t('profile.tierInfo.moreDetails')} <Link href="/pricing">Pricing</Link> page.</p>
                            </>
                        )}
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

export default Profile;