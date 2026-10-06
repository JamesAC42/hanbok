'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Dashboard from '@/components/Dashboard';
import LanguageFilter from '@/components/LanguageFilter';
import Link from 'next/link';
import Mascot from '@/components/Mascot';
import styles from '@/styles/pages/history.module.scss';

// History (everything analyzed), Saved (bookmarked) and Words (saved for
// flashcards) used to be separate pages; they share this one now.
const TABS = [
  { key: 'history', label: 'History', title: 'Everything you analyzed' },
  { key: 'saved', label: 'Saved', title: 'Sentences you bookmarked' },
  { key: 'words', label: 'Words', title: 'Words in your flashcards' },
];

const ENDPOINTS = {
  history: '/api/user/history',
  saved: '/api/saved-sentences',
};

const EMPTY_STATES = {
  history: {
    text: 'Nothing here yet. Every sentence and paragraph you analyze is kept here so you can come back to it.',
    action: 'Analyze a sentence',
    href: '/analyze',
  },
  saved: {
    text: 'Bookmark a sentence from its analysis page to keep it here.',
    action: 'Browse your history',
    tab: 'history',
  },
  words: {
    text: 'Save words from any analysis and they will show up here and in Review.',
    action: 'Analyze a sentence',
    href: '/analyze',
  },
};

export default function Library({ initialTab = 'history' }) {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [items, setItems] = useState([]);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [loadingContent, setLoadingContent] = useState(true);
  const [error, setError] = useState(null);
  const { t, language, getIcon, supportedAnalysisLanguages } = useLanguage();
  // Every language by default; the analysis language is often not the one
  // someone last studied, and filtering by it hid most of their history.
  const [selectedLanguage, setSelectedLanguage] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [tab, setTab] = useState(TABS.some(x => x.key === initialTab) ? initialTab : 'history');
  const [totalCount, setTotalCount] = useState(null);
  const [confirmRemove, setConfirmRemove] = useState(null);
  const [removingWord, setRemovingWord] = useState(null);
  const [removeError, setRemoveError] = useState(null);

  const safeLabel = (key, fallback) => {
    const value = t(key);
    if (!value || value === key) return fallback;
    return value;
  };

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
    document.title = 'Hanbok - Library';
  }, [isAuthenticated, loading, router, t]);

  useEffect(() => {
    async function fetchSentences() {
      try {
        setLoadingContent(true);
        setError(null);

        let endpoint;
        if (tab === 'words') {
          endpoint = `/api/words?page=${page}&limit=${limit}${selectedLanguage ? `&originalLanguage=${selectedLanguage}` : ''}`;
        } else {
          const typesParam = typeFilter === 'all' ? 'sentences,extended' : typeFilter === 'sentences' ? 'sentences' : 'extended';
          endpoint = `${ENDPOINTS[tab]}?page=${page}&limit=${limit}${selectedLanguage ? `&language=${selectedLanguage}` : ''}&types=${typesParam}`;
        }
        const response = await fetch(endpoint);
        const data = await response.json();

        if (data.success) {
          setItems(tab === 'words'
            ? (data.words || []).map(word => ({ ...word, type: 'word' }))
            : (data.items || data.sentences || []));
          setTotalPages(data.totalPages);
          setTotalCount(data.totalCount ?? null);
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
  }, [page, limit, selectedLanguage, typeFilter, tab, t]);

  const handleSentenceClick = (sentenceId) => {
    router.replace(`/sentence/${sentenceId}`);
  }

  const handleExtendedClick = (textId) => {
    router.replace(`/extended-text/${textId}`);
  }

  const handleTabChange = (nextTab) => {
    if (nextTab === tab) return;
    setTab(nextTab);
    setPage(1);
    setItems([]);
    setTotalCount(null);
    // Keep the address shareable without a full navigation.
    window.history.replaceState(null, '', `/library?tab=${nextTab}`);
  };

  const renderTabs = () => (
    <div className={styles.libraryTabs} role="tablist" aria-label="Library sections">
      {TABS.map(item => (
        <button
          key={item.key}
          role="tab"
          aria-selected={tab === item.key}
          className={`${styles.libraryTab} ${tab === item.key ? styles.active : ''}`}
          onClick={() => handleTabChange(item.key)}
        >
          {item.label}
        </button>
      ))}
    </div>
  );

  const renderEmptyState = () => {
    const empty = EMPTY_STATES[tab];
    return (
      <div className={styles.libraryEmpty}>
        <Mascot pose="sleep" size={104} />
        <p>{empty.text}</p>
        {empty.href ? (
          <Link href={empty.href} className={styles.libraryEmptyAction}>{empty.action}</Link>
        ) : (
          <button className={styles.libraryEmptyAction} onClick={() => handleTabChange(empty.tab)}>{empty.action}</button>
        )}
      </div>
    );
  };

  // Removing a word also deletes its flashcards, so it takes a second tap.
  const removeWord = async (word) => {
    setRemovingWord(word.wordId);
    setRemoveError(null);
    try {
      const response = await fetch('/api/words', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wordId: word.wordId }),
      });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      setConfirmRemove(null);
      const remaining = items.filter(item => item.wordId !== word.wordId);
      setItems(remaining);
      setTotalCount(count => (count === null ? null : Math.max(0, count - 1)));
      if (remaining.length === 0 && page > 1) setPage(page - 1);
    } catch (err) {
      console.error(err);
      setRemoveError(word.wordId);
    } finally {
      setRemovingWord(null);
    }
  };

  const renderWordItem = (word) => {
    const confirming = confirmRemove === word.wordId;
    const removing = removingWord === word.wordId;
    return (
      <div key={`word-${word.wordId}`} className={`${styles.sentenceItem} ${styles.wordItem} ${confirming ? styles.wordConfirming : ''}`}>
        <div className={styles.wordMain}>
          <span className={styles.wordOriginal} lang={word.originalLanguage}>{word.originalWord}</span>
          {word.reading && word.reading !== word.originalWord && (
            <span className={styles.wordReading}>{word.reading}</span>
          )}
          <span className={styles.wordTranslation}>{word.translatedWord}</span>
          {removeError === word.wordId && (
            <span className={styles.wordError} role="alert">Couldn&apos;t remove this word. Try again.</span>
          )}
        </div>
        {confirming ? (
          <div className={styles.wordActions}>
            <span className={styles.wordConfirmText}>Remove it and its flashcard?</span>
            <button className={styles.wordRemoveConfirm} onClick={() => removeWord(word)} disabled={removing}>
              {removing ? 'Removing…' : 'Remove'}
            </button>
            <button className={styles.wordCancel} onClick={() => setConfirmRemove(null)} disabled={removing}>Cancel</button>
          </div>
        ) : (
          <div className={styles.wordActions}>
            {word.sentenceId && (
              <Link href={`/sentence/${word.sentenceId}`} className={styles.wordSource}>See sentence</Link>
            )}
            <button
              className={styles.wordRemove}
              onClick={() => { setConfirmRemove(word.wordId); setRemoveError(null); }}
              aria-label={`Remove ${word.originalWord}`}
              title="Remove word"
            >
              ×
            </button>
          </div>
        )}
      </div>
    );
  };

  const handleTypeChange = (nextType) => {
    setTypeFilter(nextType);
    setPage(1);
  };

  const renderPageSwitcher = () => {
    // The API may leave totalPages out when everything fits on one page.
    if (!totalPages || totalPages <= 1) return null;
    
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
          <p className={styles.extendedTitle} lang={item.originalLanguage}>{title}</p>
          <span className={styles.extendedBadge}>{safeLabel('history.extendedBadge', 'Extended text')}</span>
        </div>
        <p className={styles.sentenceTranslation}>{item.summary || safeLabel('history.extendedNoSummary', 'Open to view the full breakdown')}</p>
        <div className={styles.extendedMeta}>
          <span>{safeLabel('history.sentencesCount', '{count} sentences').replace('{count}', item.sentenceCount || 0)}</span>
          {item.originalLanguage && (
            <>
              <span>•</span>
              <span>{item.originalLanguage.toUpperCase()}</span>
            </>
          )}
          {item.dateCreated && (
            <>
              <span>•</span>
              <span>{t('history.createdOn')} {new Date(item.dateCreated).toLocaleDateString()}</span>
            </>
          )}
        </div>
        <span className={styles.rowChevron} aria-hidden="true">›</span>
      </div>
    );
  };

  const renderSentenceItem = (sentence) => (
    <div
      onClick={() => handleSentenceClick(sentence.sentenceId)}
      key={sentence.sentenceId} 
      className={styles.sentenceItem}
    >
      <p className={styles.sentenceText} lang={sentence.originalLanguage}>{sentence.text}</p>
      <p className={styles.sentenceTranslation}>{sentence.translation || sentence.analysis?.sentence?.translation}</p>
      {sentence.dateCreated && (
        <p className={styles.sentenceDate}>
          {t('history.createdOn')} {new Date(sentence.dateCreated).toLocaleDateString()}
        </p>
      )}
      <span className={styles.rowChevron} aria-hidden="true">›</span>
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
      return renderEmptyState();
    }

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const visibleItems = normalizedQuery
      ? items.filter((item) => {
          const fields = [
            item.text,
            item.translation,
            item.title,
            item.summary,
            item.originalWord,
            item.translatedWord,
            item.reading
          ].filter(Boolean).map(val => String(val).toLowerCase());
          return fields.some(field => field.includes(normalizedQuery));
        })
      : items;

    if (visibleItems.length === 0) {
      return (
        <div className={styles.noSentences}>
          <p>{safeLabel('history.noMatches', 'Nothing matches your search on this page.')}</p>
        </div>
      );
    }

    return (
      <>
        <div className={styles.itemList}>
          {visibleItems.map(item => {
            if (item.type === 'word') return renderWordItem(item);
            return item.type === 'extended_text' ? renderExtendedTextItem(item) : renderSentenceItem(item);
          })}
        </div>
        {renderPageSwitcher()}
      </>
    );
  }

  // Don't render while main auth is loading
  if (loading || !isAuthenticated) return null;

  return (
    <Dashboard>
      <div className={styles.historyContainer}>
        <div className={styles.historyContent}>
          <header className={styles.libraryHeader}>
            <h1 className={styles.pageTitle}>Library</h1>
            <p className={styles.librarySubtitle}>
              {TABS.find(x => x.key === tab).title}
              {totalCount !== null && tab === 'words' ? ` · ${totalCount}` : ''}
            </p>
          </header>
          {renderTabs()}
          <div className={styles.rightPanel}>
            <div className={styles.searchFilters}>
              <div className={styles.searchRow}>
                <input
                  type="search"
                  placeholder={{ history: safeLabel('history.searchPlaceholder', 'Search history'), saved: 'Search saved sentences', words: 'Search words on this page' }[tab]}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className={styles.searchInput}
                />
                <LanguageFilter 
                  selectedLanguage={selectedLanguage}
                  onSelectLanguage={handleLanguageChange}
                />
              </div>
              {tab !== 'words' && renderTypeSelector()}
            </div>
            
            {renderContent()}
          </div>
        </div>
      </div>
    </Dashboard>
  );
}
