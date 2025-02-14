'use client';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/styles/components/pagelayout.module.scss';
import profileStyles from '@/styles/components/profile.module.scss';
import Image from 'next/image';

const Profile = () => {
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();

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
                    {/* Add profile content here */}
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