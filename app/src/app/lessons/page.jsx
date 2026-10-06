'use client';
import Link from 'next/link';
import styles from '@/styles/pages/lessons.module.scss';
import ContentPage from '@/components/ContentPage';
import Dashboard from '@/components/Dashboard';
import Mascot from '@/components/Mascot';
import Footer from '@/components/Footer';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

// Signed-in readers get the app shell; visitors keep the public site header.
// While auth is still loading, render a plain surface so neither shell flashes.
const BlankShell = () => <div style={{ minHeight: '100dvh', background: 'var(--background)' }} />;

export default function Home() {
  const { t } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const isPublic = !authLoading && !user;
  const Shell = authLoading ? BlankShell : (user ? Dashboard : ContentPage);

  return (
    <Shell>
      <div className={`${styles.lessonsPage} ${isPublic ? styles.publicPage : ''}`}>

        <div className={styles.lessonsCard}>
          <Mascot pose="study" size={150} motion="bob" className={styles.mascot} />
          <span className={styles.pill}>{t('sidebar.lessons')}</span>
          <h1 className={styles.pageTitle}>{t('lessons.comingSoon')}</h1>
          <p className={styles.lead}>
            {t('lessons.comingSoonLine', "We're building step-by-step lessons. Until then, keep learning from real sentences.")}
          </p>
          <Link href="/analyze" className={styles.backButton}>
            {t('sidebar.analyze')}
          </Link>
        </div>
      </div>
      {isPublic && <Footer />}
    </Shell>
  );
}
