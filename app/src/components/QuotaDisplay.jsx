'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import styles from '@/styles/components/QuotaDisplay.module.scss';

const QuotaDisplay = () => {
    const [quota, setQuota] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchQuota = async () => {
            try {
                const res = await fetch('/api/quota');
                if (res.ok) {
                    const data = await res.json();
                    setQuota(data);
                }
            } catch (error) {
                console.error('Failed to fetch quota', error);
            } finally {
                setLoading(false);
            }
        };

        fetchQuota();
    }, []);

    if (loading || !quota || quota.isPremium) {
        return null;
    }
    
    return (
        <div className={styles.quotaContainer}>
            <p>
                You have <strong>{quota.remainingWeekly}</strong> free sentence analyses remaining for the week.
            </p>
            <Link href="/pricing" className={styles.upgradeButton}>
                Upgrade to Premium
            </Link>
            <p className={styles.subtext}>
                Unlock unlimited sentences and more.
            </p>
        </div>
    );
};

export default QuotaDisplay;

