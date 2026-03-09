'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/styles/components/adminWordAudio.module.scss';
import adminStyles from '@/styles/components/admin.module.scss';
import Dashboard from '@/components/Dashboard';

const languageOptions = [
  { code: '', label: 'All languages' },
  { code: 'ko', label: 'Korean' },
  { code: 'ja', label: 'Japanese' },
  { code: 'zh', label: 'Chinese' },
  { code: 'ru', label: 'Russian' },
  { code: 'es', label: 'Spanish' },
  { code: 'fr', label: 'French' },
  { code: 'de', label: 'German' },
  { code: 'en', label: 'English' },
  { code: 'vi', label: 'Vietnamese' },
  { code: 'id', label: 'Indonesian' },
  { code: 'hi', label: 'Hindi' },
  { code: 'tr', label: 'Turkish' },
  { code: 'pt', label: 'Portuguese' }
];

const WordAudioAdminPage = () => {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  const [queryWord, setQueryWord] = useState('');
  const [language, setLanguage] = useState('');
  const [results, setResults] = useState([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [error, setError] = useState(null);
  const [status, setStatus] = useState('');
  const [regenerating, setRegenerating] = useState({});
  const [translationInputs, setTranslationInputs] = useState({});
  
  // Pagination state
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(24);
  const [totalResults, setTotalResults] = useState(0);
  const totalPages = Math.ceil(totalResults / limit);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  const keyForItem = (item) =>
    item._id || `${item.word}-${item.language}-${item.hiraganaReading || 'base'}`;

  const handleSearch = async (e, targetPage = 1) => {
    if (e) e.preventDefault();
    setError(null);
    setStatus('');
    setLoadingSearch(true);
    setPage(targetPage);

    try {
      const params = new URLSearchParams();
      if (queryWord) params.append('word', queryWord);
      if (language) params.append('language', language);
      params.append('page', targetPage);
      params.append('limit', limit);

      const response = await fetch(`/api/admin/word-audio?${params.toString()}`, {
        credentials: 'include'
      });

      if (response.status === 401 || response.status === 403) {
        router.replace('/');
        return;
      }

      if (!response.ok) {
        throw new Error('Failed to fetch word audio records');
      }

      const data = await response.json();
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch word audio records');
      }

      setResults(data.items || []);
      setTotalResults(data.total || 0);
      setStatus(`Showing ${data.items?.length || 0} of ${data.total || 0} result(s).`);
    } catch (err) {
      setError(err.message || 'Unexpected error');
    } finally {
      setLoadingSearch(false);
    }
  };

  const handleRegenerate = async (item) => {
    const key = keyForItem(item);
    const translation = translationInputs[key] || '';

    if (item.language === 'ja' && !translation) {
      setError('Translation is required to regenerate Japanese audio.');
      return;
    }

    setError(null);
    setStatus('');
    setRegenerating((prev) => ({ ...prev, [key]: true }));

    try {
      const response = await fetch('/api/admin/word-audio/regenerate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          word: item.word,
          language: item.language,
          translation: translation || undefined
        })
      });

      if (response.status === 401 || response.status === 403) {
        router.replace('/');
        return;
      }

      const data = await response.json();
      if (!response.ok || !data.success) {
        throw new Error(data.error || 'Failed to regenerate audio');
      }

      const updatedRecord = data.record || {
        ...item,
        audioUrl: data.audioUrl,
        dateGenerated: new Date().toISOString()
      };

      setResults((prev) =>
        prev.map((r) => (keyForItem(r) === key ? { ...r, ...updatedRecord } : r))
      );

      setStatus(`Regenerated audio for "${item.word}" (${item.language}).`);
    } catch (err) {
      setError(err.message || 'Unexpected error');
    } finally {
      setRegenerating((prev) => ({ ...prev, [key]: false }));
    }
  };

  const sortedResults = useMemo(
    () =>
      [...results].sort((a, b) => {
        const aDate = a.dateGenerated ? new Date(a.dateGenerated).getTime() : 0;
        const bDate = b.dateGenerated ? new Date(b.dateGenerated).getTime() : 0;
        return bDate - aDate;
      }),
    [results]
  );

  return (
    <Dashboard>
      <div className={adminStyles.adminContent}>
        <div className={styles.header}>
          <h1 className={adminStyles.adminTitle}>Word Audio Admin</h1>
          <p className={adminStyles.summaryStatMini}>Search, preview, and regenerate stored word audio entries.</p>
        </div>

        <section className={adminStyles.dashboardCard}>
          <form className={styles.searchBar} onSubmit={handleSearch}>
            <div className={adminStyles.filterContainer}>
              <label>Word Search</label>
              <input
                type="text"
                placeholder="Search by word (regex supported)"
                value={queryWord}
                onChange={(e) => setQueryWord(e.target.value)}
                className={adminStyles.adminSelect}
                style={{ paddingRight: '0.75rem', backgroundImage: 'none' }}
              />
            </div>
            <div className={adminStyles.filterContainer}>
              <label>Language</label>
              <select 
                value={language} 
                onChange={(e) => setLanguage(e.target.value)}
                className={adminStyles.adminSelect}
              >
                {languageOptions.map((opt) => (
                  <option key={opt.code || 'all'} value={opt.code}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>
            <button 
              type="submit" 
              disabled={loadingSearch}
              className={adminStyles.adminButton}
              style={{ marginTop: 'auto', height: 'fit-content' }}
            >
              {loadingSearch ? 'Searching…' : 'Search'}
            </button>
          </form>

          {status && <div className={styles.status}>{status}</div>}
          {error && <div className={adminStyles.error}>{error}</div>}
        </section>

        {totalPages > 1 && (
          <div className={adminStyles.tableFooter} style={{ marginBottom: '1rem' }}>
            <div className={adminStyles.pagination}>
              <button 
                onClick={() => handleSearch(null, page - 1)}
                disabled={page === 1 || loadingSearch}
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button 
                onClick={() => handleSearch(null, page + 1)}
                disabled={page === totalPages || loadingSearch}
              >
                Next
              </button>
            </div>
            <div className={adminStyles.limitContainer}>
              <label>Items per page</label>
              <select 
                value={limit} 
                onChange={(e) => {
                  const newLimit = Number(e.target.value);
                  setLimit(newLimit);
                  handleSearch(null, 1);
                }}
                className={adminStyles.adminSelect}
              >
                <option value={24}>24</option>
                <option value={48}>48</option>
                <option value={96}>96</option>
              </select>
            </div>
          </div>
        )}

        <div className={styles.results}>
          {sortedResults.map((item) => {
            const key = keyForItem(item);
            const dateLabel = item.dateGenerated
              ? new Date(item.dateGenerated).toLocaleString()
              : 'Unknown';

            return (
              <div className={styles.card} key={key}>
                <div className={styles.cardHeader}>
                  <span className={adminStyles.tierBadge} style={{ background: 'var(--background-alt)' }}>{item.language}</span>
                  <span className={styles.wordValue}>{item.word}</span>
                </div>
                
                {item.hiraganaReading && (
                  <div className={styles.row}>
                    <span className={styles.label}>Reading:</span>
                    <span className={styles.value}>{item.hiraganaReading}</span>
                  </div>
                )}
                
                <div className={styles.meta}>Generated: {dateLabel}</div>
                
                <div className={styles.audio}>
                  {item.audioUrl ? (
                    <audio key={item.audioUrl} controls>
                      <source src={item.audioUrl} type="audio/mpeg" />
                      Your browser does not support the audio element.
                    </audio>
                  ) : (
                    <span className={styles.hint}>No audio URL stored.</span>
                  )}
                </div>

                <div className={styles.regenSection}>
                  <input
                    type="text"
                    placeholder="Translation (required for JA)"
                    value={translationInputs[key] || ''}
                    onChange={(e) =>
                      setTranslationInputs((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                    className={adminStyles.adminSelect}
                    style={{ paddingRight: '0.75rem', backgroundImage: 'none', fontSize: '0.8rem' }}
                  />
                  <button
                    type="button"
                    onClick={() => handleRegenerate(item)}
                    disabled={!!regenerating[key]}
                    className={adminStyles.adminButton}
                    style={{ padding: '0.4rem 0.8rem', fontSize: '0.8rem' }}
                  >
                    {regenerating[key] ? 'Regenerating…' : 'Regenerate'}
                  </button>
                </div>
                {item.language === 'ja' && (
                  <div className={styles.hint}>
                    Japanese requires a translation to derive the reading.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {totalPages > 1 && (
          <div className={adminStyles.tableFooter} style={{ marginTop: '2rem' }}>
            <div className={adminStyles.pagination}>
              <button 
                onClick={() => handleSearch(null, page - 1)}
                disabled={page === 1 || loadingSearch}
              >
                Previous
              </button>
              <span>
                Page {page} of {totalPages}
              </span>
              <button 
                onClick={() => handleSearch(null, page + 1)}
                disabled={page === totalPages || loadingSearch}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {!loadingSearch && sortedResults.length === 0 && (
          <div className={adminStyles.noData}>No results yet. Run a search to see entries.</div>
        )}
      </div>
    </Dashboard>
  );
};

export default WordAudioAdminPage;
