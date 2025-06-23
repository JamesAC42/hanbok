'use client';
import {useState, useEffect} from 'react';
import styles from '@/styles/components/siteStats.module.scss';

function SiteStats() {
    const [siteStats, setSiteStats] = useState(null);

    useEffect(() => {
        fetchSiteStats();
    }, []);

    const fetchSiteStats = async () => {
        try {
            const response = await fetch('/api/stats');
            const data = await response.json();
            if (data.success) {
                setSiteStats(data.stats);
            }
        } catch (error) {
            console.error('Error fetching site stats:', error);
        }
    };

    return (
        <>
        {
            siteStats && (
                <div className={`${styles.statsContainer} ${analysis ? styles.statsContainerWithAnalysis : ''}`}>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber}>{siteStats.totalSentences.toLocaleString()}</span>
                        <span className={styles.statLabel}>{t('home.stats.sentencesAnalyzed')}</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber}>{siteStats.totalWords.toLocaleString()}</span>
                        <span className={styles.statLabel}>{t('home.stats.wordsLearned')}</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statNumber}>{siteStats.totalUsers.toLocaleString()}</span>
                        <span className={styles.statLabel}>{t('home.stats.activeUsers')}</span>
                    </div>
                </div>
            )
        }
        </>
    )
}

export default SiteStats;