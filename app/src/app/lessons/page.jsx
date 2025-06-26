'use client';
import styles from '@/styles/pages/lessons.module.scss';
import ContentPage from '@/components/ContentPage';
import { useLanguage } from '@/contexts/LanguageContext';
import Image from 'next/image';

export default function Home() {
  const { t } = useLanguage();

  return (
    <ContentPage>
      <div className={styles.lessonsPage}>
        <Image src="/images/background.png" alt="Background" fill priority style={{ objectFit: 'cover' }} />
        
        <div className={styles.lessonsContainer}>
          <div className={styles.lessonsContent}>
            <div className={styles.textContent}>
              <h1 className={styles.pageTitle}>{t('lessons.comingSoon')}</h1>
            </div>
            <div className={styles.imageContent}>
              <Image 
                src="/images/construction.png" 
                alt="Construction" 
                width={350}
                height={350}
                className={styles.constructionImage}
              />
            </div>
          </div>
        </div>
      </div>
    </ContentPage>
  );
} 