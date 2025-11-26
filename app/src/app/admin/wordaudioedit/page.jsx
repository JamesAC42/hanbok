'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/styles/components/adminWordAudio.module.scss';

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

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [loading, isAuthenticated, router]);

  // Apply a black background while on this page
  useEffect(() => {
    const previousBg = document.body.style.backgroundColor;
    const previousColor = document.body.style.color;
    document.body.style.backgroundColor = '#000';
    document.body.style.color = '#f7f7f7';
    return () => {
      document.body.style.backgroundColor = previousBg;
      document.body.style.color = previousColor;
    };
  }, []);

  const keyForItem = (item) =>
    item._id || `${item.word}-${item.language}-${item.hiraganaReading || 'base'}`;

  const handleSearch = async (e) => {
    e?.preventDefault();
    setError(null);
    setStatus('');
    setLoadingSearch(true);

    try {
      const params = new URLSearchParams();
      if (queryWord) params.append('word', queryWord);
      if (language) params.append('language', language);

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
    <div className={styles.page}>
      <div className={styles.panel}>
        <div className={styles.header}>
          <h1>Word Audio Admin</h1>
          <p>Search, preview, and regenerate stored word audio entries.</p>
        </div>

        <form className={styles.searchBar} onSubmit={handleSearch}>
          <input
            type="text"
            placeholder="Search by word (regex supported)"
            value={queryWord}
            onChange={(e) => setQueryWord(e.target.value)}
          />
          <select value={language} onChange={(e) => setLanguage(e.target.value)}>
            {languageOptions.map((opt) => (
              <option key={opt.code || 'all'} value={opt.code}>
                {opt.label}
              </option>
            ))}
          </select>
          <button type="submit" disabled={loadingSearch}>
            {loadingSearch ? 'Searching…' : 'Search'}
          </button>
        </form>

        {status && <div className={styles.status}>{status}</div>}
        {error && <div className={styles.error}>{error}</div>}

        <div className={styles.results}>
          {sortedResults.map((item) => {
            const key = keyForItem(item);
            const dateLabel = item.dateGenerated
              ? new Date(item.dateGenerated).toLocaleString()
              : 'Unknown';

            return (
              <div className={styles.card} key={key}>
                <div className={styles.row}>
                  <span className={styles.label}>Word:</span>
                  <span className={styles.value}>{item.word}</span>
                </div>
                <div className={styles.row}>
                  <span className={styles.label}>Language:</span>
                  <span className={styles.value}>{item.language}</span>
                </div>
                {item.hiraganaReading && (
                  <div className={styles.row}>
                    <span className={styles.label}>Reading:</span>
                    <span className={styles.value}>{item.hiraganaReading}</span>
                  </div>
                )}
                <div className={styles.meta}>Last generated: {dateLabel}</div>
                <div className={styles.audio}>
                  {item.audioUrl ? (
                    <audio controls src={item.audioUrl} />
                  ) : (
                    <span className={styles.hint}>No audio URL stored.</span>
                  )}
                </div>
                <div className={styles.regenRow}>
                  <input
                    type="text"
                    placeholder="Translation (required for Japanese)"
                    value={translationInputs[key] || ''}
                    onChange={(e) =>
                      setTranslationInputs((prev) => ({ ...prev, [key]: e.target.value }))
                    }
                  />
                  <button
                    type="button"
                    onClick={() => handleRegenerate(item)}
                    disabled={!!regenerating[key]}
                  >
                    {regenerating[key] ? 'Regenerating…' : 'Regenerate'}
                  </button>
                </div>
                {item.language === 'ja' && (
                  <div className={styles.hint}>
                    Japanese requires a translation to derive the hiragana reading.
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {!loadingSearch && sortedResults.length === 0 && (
          <div className={styles.empty}>No results yet. Run a search to see entries.</div>
        )}
      </div>
    </div>
  );
};

export default WordAudioAdminPage;
