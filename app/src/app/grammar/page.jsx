'use client';
import { useEffect } from 'react';
import SentenceAnalyzer from '@/components/SentenceAnalyzer';
import { useLanguage } from '@/contexts/LanguageContext';
import Dashboard from '@/components/Dashboard';
import styles from '@/styles/pages/grammar.module.scss';

export default function Home() {
  return (
    <Dashboard>
      <div className={styles.grammarContainer}>
          <h1 className={styles.pageTitle}>Grammar</h1>
      </div>
    </Dashboard>
  );
}