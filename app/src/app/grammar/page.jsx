'use client';
import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';
import Dashboard from '@/components/Dashboard';
import Mascot from '@/components/Mascot';
// Not linked from anywhere yet; shares the lessons "coming soon" card.
import styles from '@/styles/pages/lessons.module.scss';

export default function Home() {
  const { t } = useLanguage();

  return (
    <Dashboard>
      <div className={styles.lessonsPage}>
        <div className={styles.lessonsCard}>
          <Mascot pose="think" size={140} motion="bob" className={styles.mascot} />
          <span className={styles.pill}>{t('lessons.comingSoon')}</span>
          <h1 className={styles.pageTitle}>Grammar</h1>
          <Link href="/analyze" className={styles.backButton}>
            {t('sidebar.analyze')}
          </Link>
        </div>
      </div>
    </Dashboard>
  );
}
