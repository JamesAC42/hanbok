'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Dashboard from '@/components/Dashboard';
import styles from '@/styles/pages/history.module.scss';

export default function History() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [sentences, setSentences] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingContent, setLoadingContent] = useState(true);
  const [error, setError] = useState(null);
  const { t, language, getIcon, supportedLanguages } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [showLanguageOptions, setShowLanguageOptions] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
    document.title = t('history.pageTitle') || 'History';
  }, [isAuthenticated, loading, router, t]);

  useEffect(() => {
    async function fetchSentences() {
      try {
        setLoadingContent(true);
        setError(null);

        const endpoint = `/api/user/history?page=${page}&limit=${limit}&language=${selectedLanguage}`;
        const response = await fetch(endpoint);
        const data = await response.json();

        if (data.success) {
          setSentences(data.sentences);
          setTotalPages(data.totalPages);
        } else {
          setError(data.error);
        }
      } catch (err) {
        console.error(err);
        setError(t('history.fetchError') || 'Failed to fetch sentences');
      } finally {
        setLoadingContent(false);
      }
    }
    fetchSentences();
  }, [page, limit, selectedLanguage, t]);

  const handleSentenceClick = (sentenceId) => {
    router.replace(`/sentence/${sentenceId}`);
  }

  const renderPageSwitcher = () => {
    if (totalPages <= 1) return null;
    
    return (              
      <div className={styles.pagination}>
        <button 
          disabled={page <= 1} 
          onClick={() => setPage(page - 1)}
        >
          {t('history.prev') || 'Previous'}
        </button>
        <span>
          {(t('history.pageOf') || 'Page {current} of {total}')
            .replace('{current}', page)
            .replace('{total}', totalPages)
          }
        </span>
        <button 
          disabled={page >= totalPages} 
          onClick={() => setPage(page + 1)}
        >
          {t('history.next') || 'Next'}
        </button>
      </div>
    )
  }

  const renderLanguageSelector = () => (
    <div className={`${styles.languageSelector} ${showLanguageOptions ? styles.show : ''}`}>
      <div className={styles.languageList}>
        <button
          className={styles.languageButton}
          onClick={() => setShowLanguageOptions(!showLanguageOptions)}>
          {getIcon(selectedLanguage)}
        </button>
        {Object.keys(supportedLanguages).map(code => (
          <button
            key={code}
            className={`${styles.languageOption} ${selectedLanguage === code ? styles.selected : ''}`}
            onClick={() => {
              setSelectedLanguage(code);
              setPage(1); // Reset to first page when changing language
              setShowLanguageOptions(false);
            }}
          >
            {getIcon(code)}
          </button>
        ))}
      </div>
    </div>
  );

  const renderContent = () => {
    if (loadingContent) {
      return <p className={styles.loading}>{t('history.loading') || 'Loading...'}</p>;
    }

    if (error) {
      return <p className={styles.error}>{error}</p>;
    }

    if (sentences.length === 0) {
      return (
        <div className={styles.noSentences}>
          <p>{t('history.noSentences') || 'No sentences found'}</p>
          <p>{t('history.generateSentences') || 'Generate some sentences to see them here!'}</p>
        </div>
      );
    }

    return (
      <>
        {renderPageSwitcher()}
        {sentences.map(sentence => (
          <div
            onClick={() => handleSentenceClick(sentence.sentenceId)}
            key={sentence.sentenceId} 
            className={styles.sentenceItem}
          >
            <p className={styles.sentenceText}>{sentence.text}</p>
            <p className={styles.sentenceTranslation}>{sentence.analysis?.sentence?.translation}</p>
            <p className={styles.sentenceDate}>
              {t('history.createdOn') || 'Created on'} {sentence.dateCreated ? new Date(sentence.dateCreated).toLocaleString() : 'Unknown date'}
            </p>
          </div>
        ))}
        {renderPageSwitcher()}
      </>
    );
  }

  // Don't render while main auth is loading
  if (loading || !isAuthenticated) return null;

  return (
    <Dashboard>
      <div className={styles.historyContainer}>
        {renderLanguageSelector()}
        <h1 className={styles.pageTitle}>{t('history.title') || 'History'}</h1>
        
        {renderContent()}
      </div>
    </Dashboard>
  );
}