'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Dashboard from '@/components/Dashboard';
import LanguageFilter from '@/components/LanguageFilter';
import Link from 'next/link';
import Mascot from '@/components/Mascot';
import styles from '@/styles/pages/history.module.scss';
import { sentenceHref, sentenceKey } from '@/lib/sentenceLink';
import FolderPicker, { FolderIcon } from '@/components/library/FolderPicker';
import { fetchFolders, createFolder, renameFolder, deleteFolder } from '@/lib/libraryFolders';

// History (everything analyzed), Saved (bookmarked) and Words (saved for
// flashcards) used to be separate pages; they share this one now.
const TABS = [
  { key: 'history', label: 'History', title: 'Everything you analyzed' },
  { key: 'saved', label: 'Saved', title: 'Sentences and paragraphs you saved, in folders' },
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
  // History: remove one item (two taps) or clear it all. Both only hide items.
  const [confirmHide, setConfirmHide] = useState(null);
  const [hiding, setHiding] = useState(null);
  const [hideError, setHideError] = useState(null);
  const [confirmClear, setConfirmClear] = useState(false);
  const [clearing, setClearing] = useState(false);
  const [clearError, setClearError] = useState(null);
  // Saved: folders. activeFolder is 'all', 'unfiled' or a folderId.
  const [folderData, setFolderData] = useState(null);
  const [activeFolder, setActiveFolder] = useState('all');
  const [pickerFor, setPickerFor] = useState(null);
  const [renaming, setRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [confirmDeleteFolder, setConfirmDeleteFolder] = useState(false);
  const [folderError, setFolderError] = useState(null);
  const [itemsVersion, setItemsVersion] = useState(0);

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
          const folderParam = tab === 'saved' && activeFolder !== 'all' ? `&folder=${activeFolder}` : '';
          endpoint = `${ENDPOINTS[tab]}?page=${page}&limit=${limit}${selectedLanguage ? `&language=${selectedLanguage}` : ''}&types=${typesParam}${folderParam}`;
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
  }, [page, limit, selectedLanguage, typeFilter, tab, t, activeFolder, itemsVersion]);

  const loadFolders = async () => {
    try {
      setFolderData(await fetchFolders());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (tab === 'saved' && isAuthenticated) loadFolders();
  }, [tab, isAuthenticated]);

  const itemKey = (item) => (item.type === 'extended_text' ? `t-${item.textId}` : `s-${item.sentenceId}`);

  // Drops an item from the current page; steps back a page if that empties it.
  const dropItem = (key) => {
    const remaining = items.filter(item => itemKey(item) !== key);
    setItems(remaining);
    setTotalCount(count => (count === null ? null : Math.max(0, count - 1)));
    if (remaining.length === 0) {
      if (page > 1) setPage(page - 1);
      else setItemsVersion(v => v + 1);
    }
  };

  // Removing from history hides the item; it stays saved, in flashcards and in grammar.
  const hideItem = async (item) => {
    const key = itemKey(item);
    setHiding(key);
    setHideError(null);
    try {
      const url = item.type === 'extended_text'
        ? `/api/user/history/extended-texts/${item.textId}`
        : `/api/user/history/sentences/${item.sentenceId}`;
      const response = await fetch(url, { method: 'DELETE' });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      setConfirmHide(null);
      dropItem(key);
    } catch (err) {
      console.error(err);
      setHideError(key);
    } finally {
      setHiding(null);
    }
  };

  const clearHistory = async () => {
    setClearing(true);
    setClearError(null);
    try {
      const response = await fetch('/api/user/history/clear', { method: 'POST' });
      const data = await response.json();
      if (!data.success) throw new Error(data.error);
      setConfirmClear(false);
      setItems([]);
      setTotalCount(0);
      setTotalPages(1);
      setPage(1);
    } catch (err) {
      console.error(err);
      setClearError("Couldn't clear your history. Try again.");
    } finally {
      setClearing(false);
    }
  };

  const chooseFolder = (folder) => {
    setActiveFolder(folder);
    setPage(1);
    setRenaming(false);
    setConfirmDeleteFolder(false);
    setFolderError(null);
  };

  // Keeps the folder counts right after an item moves, and takes it off the
  // page when it no longer belongs to the folder being shown.
  const handleMoved = (item, folderId) => {
    const from = item.folderId ?? null;
    setFolderData(data => {
      if (!data) return data;
      const bump = (id, delta) => (f) => (f.folderId === id ? { ...f, count: Math.max(0, f.count + delta) } : f);
      let folders = data.folders;
      if (from !== null) folders = folders.map(bump(from, -1));
      if (folderId !== null) folders = folders.map(bump(folderId, 1));
      const unfiledCount = data.unfiledCount + (from === null ? -1 : 0) + (folderId === null ? 1 : 0);
      return { ...data, folders, unfiledCount };
    });
    const key = itemKey(item);
    const stillShown = activeFolder === 'all' || (activeFolder === 'unfiled' ? folderId === null : activeFolder === folderId);
    if (stillShown) {
      setItems(list => list.map(x => (itemKey(x) === key ? { ...x, folderId } : x)));
    } else {
      dropItem(key);
    }
  };

  const handleFolderCreated = (folder) => {
    setFolderData(data => (!data || data.folders.some(f => f.folderId === folder.folderId)
      ? data
      : { ...data, folders: [...data.folders, { ...folder, count: 0 }].sort((a, b) => a.name.localeCompare(b.name)) }));
  };

  const submitRename = async (event) => {
    event.preventDefault();
    const name = renameValue.trim();
    if (!name) return;
    setFolderError(null);
    try {
      const folder = await renameFolder(activeFolder, name);
      setFolderData(data => ({ ...data, folders: data.folders.map(f => (f.folderId === folder.folderId ? { ...f, name: folder.name } : f)).sort((a, b) => a.name.localeCompare(b.name)) }));
      setRenaming(false);
    } catch (err) {
      setFolderError(err.message);
    }
  };

  const removeFolder = async () => {
    setFolderError(null);
    try {
      await deleteFolder(activeFolder);
      chooseFolder('all');
      loadFolders();
    } catch (err) {
      setFolderError(err.message);
    }
  };

  const handleSentenceClick = (sentence) => {
    router.replace(sentenceHref(sentence));
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
    setActiveFolder('all');
    setConfirmHide(null);
    setConfirmClear(false);
    setPickerFor(null);
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
              <Link href={sentenceHref(word)} className={styles.wordSource}>See sentence</Link>
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

  const folderName = (folderId) => folderData?.folders.find(f => f.folderId === folderId)?.name;

  // Buttons under a row: remove (History) or file in a folder (Saved).
  const renderRowActions = (item) => {
    const key = itemKey(item);
    const stop = (event) => event.stopPropagation();

    if (tab === 'history') {
      if (confirmHide === key) {
        return (
          <div className={`${styles.rowActions} ${styles.rowConfirm}`} onClick={stop}>
            <span className={styles.wordConfirmText}>Remove from your history?</span>
            <button className={styles.wordRemoveConfirm} onClick={() => hideItem(item)} disabled={hiding === key}>
              {hiding === key ? 'Removing…' : 'Remove'}
            </button>
            <button className={styles.wordCancel} onClick={() => setConfirmHide(null)} disabled={hiding === key}>Cancel</button>
            {hideError === key && <span className={styles.wordError} role="alert">Couldn&apos;t remove it. Try again.</span>}
          </div>
        );
      }
      return (
        <div className={styles.rowActions} onClick={stop}>
          <button
            className={styles.rowRemove}
            onClick={() => { setConfirmHide(key); setHideError(null); }}
            title="Remove from history"
          >
            Remove
          </button>
        </div>
      );
    }

    if (tab === 'saved') {
      const name = folderName(item.folderId);
      const id = item.type === 'extended_text' ? item.textId : sentenceKey(item);
      return (
        <div className={styles.rowActions} onClick={stop}>
          <div className={styles.folderAnchor}>
            <button
              className={`${styles.folderButton} ${name ? styles.filed : ''}`}
              onMouseDown={stop}
              onTouchStart={stop}
              onClick={() => setPickerFor(pickerFor === key ? null : key)}
              aria-expanded={pickerFor === key}
            >
              <FolderIcon />
              <span>{name || 'Add to folder'}</span>
            </button>
            {pickerFor === key && (
              <FolderPicker
                type={item.type === 'extended_text' ? 'extended_text' : 'sentence'}
                itemId={id}
                align="left"
                currentFolderId={name ? item.folderId : null}
                folders={folderData?.folders}
                onMoved={(folderId) => handleMoved(item, folderId)}
                onFolderCreated={handleFolderCreated}
                onClose={() => setPickerFor(null)}
              />
            )}
          </div>
        </div>
      );
    }
    return null;
  };

  const renderExtendedTextItem = (item) => {
    const title = item.title || safeLabel('history.untitledExtendedText', 'Untitled extended text');
    return (
      <div
        key={`extended-${item.textId}`}
        className={`${styles.sentenceItem} ${styles.extendedItem} ${confirmHide === itemKey(item) ? styles.wordConfirming : ''} ${pickerFor === itemKey(item) ? styles.pickerOpen : ''}`}
        onClick={() => confirmHide !== itemKey(item) && handleExtendedClick(item.textId)}
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
        {renderRowActions(item)}
        <span className={styles.rowChevron} aria-hidden="true">›</span>
      </div>
    );
  };

  const renderSentenceItem = (sentence) => (
    <div
      onClick={() => confirmHide !== itemKey(sentence) && handleSentenceClick(sentence)}
      key={sentence.sentenceId} 
      className={`${styles.sentenceItem} ${confirmHide === itemKey(sentence) ? styles.wordConfirming : ''} ${pickerFor === itemKey(sentence) ? styles.pickerOpen : ''}`}
    >
      <p className={styles.sentenceText} lang={sentence.originalLanguage}>{sentence.text}</p>
      <p className={styles.sentenceTranslation}>{sentence.translation || sentence.analysis?.sentence?.translation}</p>
      {sentence.dateCreated && (
        <p className={styles.sentenceDate}>
          {t('history.createdOn')} {new Date(sentence.dateCreated).toLocaleDateString()}
        </p>
      )}
      {renderRowActions(sentence)}
      <span className={styles.rowChevron} aria-hidden="true">›</span>
    </div>
  );

  const renderFolderBar = () => {
    if (tab !== 'saved' || !folderData) return null;
    const active = typeof activeFolder === 'number' ? folderData.folders.find(f => f.folderId === activeFolder) : null;
    const chip = (key, label, count, extra = '') => (
      <button
        key={key}
        className={`${styles.folderChip} ${activeFolder === key ? styles.active : ''} ${extra}`}
        onClick={() => chooseFolder(key)}
        aria-pressed={activeFolder === key}
      >
        {typeof key === 'number' && <FolderIcon />}
        <span className={styles.folderChipName}>{label}</span>
        <span className={styles.folderCount}>{count}</span>
      </button>
    );
    return (
      <div className={styles.folderBar}>
        <div className={styles.folderChips} role="group" aria-label="Folders">
          {chip('all', 'All saved', folderData.totalCount)}
          {folderData.folders.length > 0 && chip('unfiled', 'Not in a folder', folderData.unfiledCount)}
          {folderData.folders.map(f => chip(f.folderId, f.name, f.count))}
          <div className={styles.folderAnchor}>
            <button
              className={styles.newFolderChip}
              onMouseDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={() => setPickerFor(pickerFor === 'new-folder' ? null : 'new-folder')}
            >
              + New folder
            </button>
            {pickerFor === 'new-folder' && (
              <NewFolderForm
                onCreated={(folder) => { handleFolderCreated(folder); setPickerFor(null); chooseFolder(folder.folderId); }}
                onClose={() => setPickerFor(null)}
              />
            )}
          </div>
        </div>
        {active && (
          <div className={styles.folderTools}>
            {renaming ? (
              <form className={styles.renameForm} onSubmit={submitRename}>
                <input
                  value={renameValue}
                  onChange={(e) => setRenameValue(e.target.value)}
                  maxLength={60}
                  aria-label="Folder name"
                  autoFocus
                />
                <button type="submit" className={styles.wordRemoveConfirmKeep} disabled={!renameValue.trim()}>Save</button>
                <button type="button" className={styles.wordCancel} onClick={() => setRenaming(false)}>Cancel</button>
              </form>
            ) : confirmDeleteFolder ? (
              <>
                <span className={styles.wordConfirmText}>Delete “{active.name}”? Its {active.count === 1 ? 'item stays' : 'items stay'} saved.</span>
                <button className={styles.wordRemoveConfirm} onClick={removeFolder}>Delete folder</button>
                <button className={styles.wordCancel} onClick={() => setConfirmDeleteFolder(false)}>Cancel</button>
              </>
            ) : (
              <>
                <button className={styles.wordCancel} onClick={() => { setRenaming(true); setRenameValue(active.name); }}>Rename</button>
                <button className={styles.wordCancel} onClick={() => setConfirmDeleteFolder(true)}>Delete folder</button>
              </>
            )}
            {folderError && <span className={styles.wordError} role="alert">{folderError}</span>}
          </div>
        )}
      </div>
    );
  };

  const renderClearHistory = () => {
    if (tab !== 'history' || (items.length === 0 && !confirmClear)) return null;
    if (!confirmClear) {
      return (
        <button className={styles.clearHistory} onClick={() => { setConfirmClear(true); setClearError(null); }}>
          Clear history
        </button>
      );
    }
    return (
      <div className={styles.clearConfirm} role="alertdialog" aria-label="Clear history">
        <span className={styles.wordConfirmText}>
          Clear everything from your history? Saved sentences, flashcards and grammar stay.
        </span>
        <div className={styles.clearConfirmButtons}>
          <button className={styles.wordRemoveConfirm} onClick={clearHistory} disabled={clearing}>
            {clearing ? 'Clearing…' : 'Clear history'}
          </button>
          <button className={styles.wordCancel} onClick={() => setConfirmClear(false)} disabled={clearing}>Cancel</button>
        </div>
        {clearError && <span className={styles.wordError} role="alert">{clearError}</span>}
      </div>
    );
  };

  const renderContent = () => {
    if (loadingContent) {
      return <p className={styles.loading}>{t('history.loading')}</p>;
    }

    if (error) {
      return <p className={styles.error}>{error}</p>;
    }

    if (items.length === 0) {
      if (tab === 'saved' && activeFolder !== 'all') {
        return (
          <div className={styles.noSentences}>
            <p>{activeFolder === 'unfiled'
              ? 'Everything you saved is in a folder.'
              : 'Nothing in this folder yet. Use “Add to folder” on anything you saved to file it here.'}</p>
          </div>
        );
      }
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
              {tab !== 'words' && (
                <div className={styles.filterRow}>
                  {renderTypeSelector()}
                  {renderClearHistory()}
                </div>
              )}
              {renderFolderBar()}
            </div>
            
            {renderContent()}
          </div>
        </div>
      </div>
    </Dashboard>
  );
}

// The "+ New folder" chip's small form.
function NewFolderForm({ onCreated, onClose }) {
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const ref = useRef(null);

  useEffect(() => {
    const onPointer = (event) => { if (ref.current && !ref.current.contains(event.target)) onClose(); };
    const onKey = (event) => { if (event.key === 'Escape') onClose(); };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('touchstart', onPointer);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('touchstart', onPointer);
      document.removeEventListener('keydown', onKey);
    };
  }, [onClose]);

  const submit = async (event) => {
    event.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    setError(null);
    try {
      onCreated(await createFolder(name));
    } catch (err) {
      setError(err.message);
      setBusy(false);
    }
  };

  return (
    <form ref={ref} className={styles.newFolderForm} onSubmit={submit}>
      <label className={styles.newFolderLabel} htmlFor="new-folder-name">New folder</label>
      <div className={styles.newFolderRow}>
        <input
          id="new-folder-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Drama lines"
          maxLength={60}
          autoFocus
          disabled={busy}
        />
        <button type="submit" className={styles.wordRemoveConfirmKeep} disabled={busy || !name.trim()}>Add</button>
      </div>
      {error && <span className={styles.wordError} role="alert">{error}</span>}
    </form>
  );
}
