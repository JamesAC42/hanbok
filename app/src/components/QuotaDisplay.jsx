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

    const total = quota.totalWeekly || 10;
    const remaining = Math.max(0, Math.min(quota.remainingWeekly, total));
    const used = total - remaining;

    return (
        <div className={styles.meter}>
            <div className={styles.meterText}>
                <strong>{remaining} of {total}</strong> free analyses left this week
            </div>
            <div className={styles.meterBar} role="progressbar" aria-valuemin={0} aria-valuemax={total} aria-valuenow={used} aria-label="Free analyses used this week">
                <span style={{ width: `${(used / total) * 100}%` }} />
            </div>
            <Link href="/pricing" className={styles.meterLink}>
                Go unlimited
            </Link>
        </div>
    );
};

export default QuotaDisplay;
