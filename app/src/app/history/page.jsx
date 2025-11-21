'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Dashboard from '@/components/Dashboard';
import LanguageFilter from '@/components/LanguageFilter';
import styles from '@/styles/pages/history.module.scss';
import { useRef } from 'react';

export default function History() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingContent, setLoadingContent] = useState(true);
  const [error, setError] = useState(null);
  const { t, language, getIcon, supportedAnalysisLanguages } = useLanguage();
  const [selectedLanguage, setSelectedLanguage] = useState(language);
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const safeLabel = (key, fallback) => {
    const value = t(key);
    if (!value || value === key) return fallback;
    return value;
  };

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

        const typesParam = typeFilter === 'all' ? 'sentences,extended' : typeFilter === 'sentences' ? 'sentences' : 'extended';
        const endpoint = `/api/user/history?page=${page}&limit=${limit}&language=${selectedLanguage}&types=${typesParam}`;
        const response = await fetch(endpoint);
        const data = await response.json();

        if (data.success) {
          setItems(data.items || data.sentences || []);
          setTotalPages(data.totalPages);
        } else {
          setError(data.error);
        }
      } catch (err) {
        console.error(err);
        setError(t('history.fetchError'));
      } finally {
        setLoadingContent(false);
      }
    }
    fetchSentences();
  }, [page, limit, selectedLanguage, typeFilter, t]);

  const handleSentenceClick = (sentenceId) => {
    router.replace(`/sentence/${sentenceId}`);
  }

  const handleExtendedClick = (textId) => {
    router.replace(`/extended-text/${textId}`);
  }

  const handleTypeChange = (nextType) => {
    setTypeFilter(nextType);
    setPage(1);
  };

  const renderPageSwitcher = () => {
    if (totalPages <= 1) return null;
    
    return (              
      <div className={styles.pagination}>
        <div className={styles.pagerButtons}>
          <button 
            className={styles.pagerButton}
            disabled={page <= 1} 
            onClick={() => setPage(page - 1)}
          >
            {t('history.prev')}
          </button>
          <button 
            className={styles.pagerButton}
            disabled={page >= totalPages} 
            onClick={() => setPage(page + 1)}
          >
            {t('history.next')}
          </button>
        </div>
        <span>
          {t('history.pageOf')
            .replace('{current}', page)
            .replace('{total}', totalPages)
          }
        </span>
      </div>
    )
  }

  const handleLanguageChange = (code) => {
    setSelectedLanguage(code);
    setPage(1);
  };

  const renderTypeSelector = () => (
    <div className={styles.typeFilters}>
      {/** Fallback English labels in case translations are missing */ }
      {(() => {
        const allLabel = safeLabel('history.showAll', 'All items');
        const sentencesLabel = safeLabel('history.showSentences', 'Sentences');
        const extendedLabel = safeLabel('history.showExtended', 'Extended texts');
        return (
          <>
            <button
              className={`${styles.typeButton} ${typeFilter === 'all' ? styles.active : ''}`}
              onClick={() => handleTypeChange('all')}
            >
              {allLabel}
            </button>
            <button
              className={`${styles.typeButton} ${typeFilter === 'sentences' ? styles.active : ''}`}
              onClick={() => handleTypeChange('sentences')}
            >
              {sentencesLabel}
            </button>
            <button
              className={`${styles.typeButton} ${typeFilter === 'extended' ? styles.active : ''}`}
              onClick={() => handleTypeChange('extended')}
            >
              {extendedLabel}
            </button>
          </>
        );
      })()}
    </div>
  );

  const renderExtendedTextItem = (item) => {
    const title = item.title || safeLabel('history.untitledExtendedText', 'Untitled extended text');
    return (
      <div
        key={`extended-${item.textId}`}
        className={`${styles.sentenceItem} ${styles.extendedItem}`}
        onClick={() => handleExtendedClick(item.textId)}
      >
        <div className={styles.extendedHeader}>
          <p className={styles.extendedTitle}>{title}</p>
          <span className={styles.extendedBadge}>{safeLabel('history.extendedBadge', 'Extended text')}</span>
        </div>
        <p className={styles.sentenceTranslation}>{item.summary || safeLabel('history.extendedNoSummary', 'Open to view the full breakdown')}</p>
        <div className={styles.extendedMeta}>
          <span>{safeLabel('history.sentencesCount', '{count} sentences').replace('{count}', item.sentenceCount || 0)}</span>
          <span>•</span>
          <span>{item.originalLanguage?.toUpperCase()}</span>
        </div>
        <p className={styles.sentenceDate}>
          {t('history.createdOn')} {item.dateCreated ? new Date(item.dateCreated).toLocaleString() : 'Unknown date'}
        </p>
      </div>
    );
  };

  const renderSentenceItem = (sentence) => (
    <div
      onClick={() => handleSentenceClick(sentence.sentenceId)}
      key={sentence.sentenceId} 
      className={styles.sentenceItem}
    >
      <p className={styles.sentenceText}>{sentence.text}</p>
      <p className={styles.sentenceTranslation}>{sentence.translation || sentence.analysis?.sentence?.translation}</p>
      <p className={styles.sentenceDate}>
        {t('history.createdOn')} {sentence.dateCreated ? new Date(sentence.dateCreated).toLocaleString() : 'Unknown date'}
      </p>
    </div>
  );

  const renderContent = () => {
    if (loadingContent) {
      return <p className={styles.loading}>{t('history.loading')}</p>;
    }

    if (error) {
      return <p className={styles.error}>{error}</p>;
    }

    if (items.length === 0) {
      return (
        <div className={styles.noSentences}>
          <p>{t('history.noSentences')}</p>
          <p>{t('history.generateSentences')}</p>
        </div>
      );
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const visibleItems = normalizedQuery
      ? items.filter((item) => {
          const fields = [
            item.text,
            item.translation,
            item.title,
            item.summary
          ].filter(Boolean).map(val => String(val).toLowerCase());
          return fields.some(field => field.includes(normalizedQuery));
        })
      : items;

    if (visibleItems.length === 0) {
      return (
        <div className={styles.noSentences}>
          <p>{t('history.noSentences')}</p>
          <p>{t('history.generateSentences')}</p>
        </div>
      );
    }

    return (
      <>
        {renderPageSwitcher()}
        {visibleItems.map(item => item.type === 'extended_text' ? renderExtendedTextItem(item) : renderSentenceItem(item))}
        {renderPageSwitcher()}
      </>
    );
  }

  // Don't render while main auth is loading
  if (loading || !isAuthenticated) return null;

  return (
    <Dashboard>
      <div className={styles.historyContainer}>
        <h1 className={styles.pageTitle}>{t('history.title')}</h1>
        <div className={styles.historyContent}>
          <div className={styles.leftPanel}>
            <div className={styles.imageCard}>
              <img src="/images/bookshelf.jpg" alt={safeLabel('history.title', 'History')} />
              <div className={styles.imageOverlay}>
                <p>{safeLabel('history.libraryBlurb', 'Revisit every analysis and keep track of what you’ve explored.')}</p>
              </div>
            </div>
          </div>
          <div className={styles.rightPanel}>
            <div className={styles.searchFilters}>
              <div className={styles.searchRow}>
                <input
                  type="search"
                  placeholder={safeLabel('history.searchPlaceholder', 'Search history')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                <LanguageFilter 
                  selectedLanguage={selectedLanguage}
                  onSelectLanguage={handleLanguageChange}
                />
              </div>
              {renderTypeSelector()}
            </div>
            
            {renderContent()}
          </div>
        </div>
      </div>
    </Dashboard>
  );
}
