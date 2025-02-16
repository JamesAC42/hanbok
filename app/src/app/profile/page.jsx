'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/styles/components/pagelayout.module.scss';
import profileStyles from '@/styles/components/profile.module.scss';
import Image from 'next/image';

const Profile = () => {
    const router = useRouter();
    const { user, isAuthenticated, loading } = useAuth();

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
                    <h1 className={styles.pageTitle}>Profile</h1>
                    <div className={profileStyles.userDetails}>
                        <h2>User Info</h2>
                        <p><strong>Name:</strong> {user.name}</p>
                        <p><strong>Email:</strong> {user.email}</p>
                        <p>
                          <strong>Tier:</strong> {user.tier == 0 ? "Basic" : user.tier === 1 ? "Plus" : "Unknown"}
                        </p>
                        <p>
                          <strong>Remaining Audio Generations:</strong> {
                            user.tier === 1 ? "Unlimited" : user.remainingAudioGenerations == null ? "0" : user.remainingAudioGenerations
                          }
                        </p>
                        <p>
                            <strong>Max Saved Sentences:</strong> {user.tier === 1 ? "Unlimited" : user.maxSavedSentences == null ? "0" : user.maxSavedSentences}
                        </p>
                        <p>
                            <strong>Max Saved Words:</strong> {user.tier === 1 ? "Unlimited" : user.maxSavedWords == null ? "0" : user.maxSavedWords}
                        </p>
                    </div>
                    <div className={profileStyles.tierInfo}>
                        {user.tier === 2 ? (
                            <>
                                <p><strong>Plus User Benefits:</strong> Enjoy unlimited audio generations, priority support, and premium features!</p>
                                <p>For more details, visit our <a href="/pricing">Pricing</a> page.</p>
                            </>
                        ) : (
                            <>
                                <p><strong>Basic User Benefits:</strong> You have limited audio generations available. Upgrade for more features and unlimited access.</p>
                                <p>For more details, visit our <a href="/pricing">Pricing</a> page.</p>
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