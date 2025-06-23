'use client';
import styles from '@/styles/pages/lessons.module.scss';
import ContentPage from '@/components/ContentPage';

export default function Home() {
  return (
    <ContentPage>
        <div className={styles.lessonsContainer}>
            <h1 className={styles.pageTitle}>Lessons</h1>
        </div>
    </ContentPage>
  );
}