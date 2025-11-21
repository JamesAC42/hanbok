'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/styles/components/pagelayout.module.scss';
import bookmarksStyles from '@/styles/components/bookmarks.module.scss';
import Image from 'next/image';
import { MaterialSymbolsBookmarkSharp } from '@/components/icons/Bookmark';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageFilter from '@/components/LanguageFilter';

import Dashboard from '@/components/Dashboard';
import { useRef } from 'react';

const Bookmarks = () => {
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
        document.title = t('bookmarks.pageTitle');
    }, [isAuthenticated, loading, router, t]);

    useEffect(() => {
        async function fetchSentences() {
        try {
            setLoadingContent(true);
            setError(null);

            const typesParam = typeFilter === 'all' ? 'sentences,extended' : typeFilter === 'sentences' ? 'sentences' : 'extended';
            const endpoint = `/api/saved-sentences?page=${page}&limit=${limit}&language=${selectedLanguage}&types=${typesParam}`;
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
            setError(t('bookmarks.fetchError'));
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
        if(totalPages <= 1) return null;
        
        return(              
            <div className={bookmarksStyles.pagination}>
                <div className={bookmarksStyles.pagerButtons}>
                    <button 
                        className={bookmarksStyles.pagerButton}
                        disabled={page <= 1} 
                        onClick={() => setPage(page - 1)}
                    >
                        {t('bookmarks.prev')}
                    </button>
                    <button 
                        className={bookmarksStyles.pagerButton}
                        disabled={page >= totalPages} 
                        onClick={() => setPage(page + 1)}
                    >
                        {t('bookmarks.next')}
                    </button>
                </div>
                <span>{t('bookmarks.pageOf').replace('{current}', page).replace('{total}', totalPages)}</span>
            </div>
        )
    }

    const renderTypeSelector = () => (
        <div className={bookmarksStyles.typeFilters}>
            {(() => {
                const allLabel = safeLabel('bookmarks.showAll', 'All items');
                const sentencesLabel = safeLabel('bookmarks.showSentences', 'Sentences');
                const extendedLabel = safeLabel('bookmarks.showExtended', 'Extended texts');
                return (
                    <>
                        <button
                            className={`${bookmarksStyles.typeButton} ${typeFilter === 'all' ? bookmarksStyles.active : ''}`}
                            onClick={() => handleTypeChange('all')}
                        >
                            {allLabel}
                        </button>
                        <button
                            className={`${bookmarksStyles.typeButton} ${typeFilter === 'sentences' ? bookmarksStyles.active : ''}`}
                            onClick={() => handleTypeChange('sentences')}
                        >
                            {sentencesLabel}
                        </button>
                        <button
                            className={`${bookmarksStyles.typeButton} ${typeFilter === 'extended' ? bookmarksStyles.active : ''}`}
                            onClick={() => handleTypeChange('extended')}
                        >
                            {extendedLabel}
                        </button>
                    </>
                );
            })()}
        </div>
    );

    const handleLanguageChange = (code) => {
        setSelectedLanguage(code);
        setPage(1);
    };

    const renderContent = () => {
        if (loadingContent) {
            return <p className={bookmarksStyles.loading}>{t('bookmarks.loading')}</p>;
        }

        if (error) {
            return <p className={bookmarksStyles.error}>{error}</p>;
        }

        if (items.length === 0) {
            return (
                <div className={bookmarksStyles.noBookmarks}>
                    <p>{t('bookmarks.noSentences')}</p>
                    <p>{t('bookmarks.clickBookmark')} <MaterialSymbolsBookmarkSharp /> {t('bookmarks.toSave')}</p>
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
                <div className={bookmarksStyles.noBookmarks}>
                    <p>{t('bookmarks.noSentences')}</p>
                    <p>{t('bookmarks.clickBookmark')} <MaterialSymbolsBookmarkSharp /> {t('bookmarks.toSave')}</p>
                </div>
            );
        }

        const renderSentenceItem = (sentence) => (
            <div
                onClick={() => handleSentenceClick(sentence.sentenceId)}
                key={`sentence-${sentence.sentenceId}`} 
                className={bookmarksStyles.sentenceItem}
            >
                <p className={bookmarksStyles.sentenceText}>{sentence.text}</p>
                <p className={bookmarksStyles.sentenceTranslation}>{sentence.translation || sentence.analysis?.sentence?.translation}</p>
                <p className={bookmarksStyles.sentenceDate}>
                    {t('bookmarks.savedOn')} {sentence.dateSaved ? new Date(sentence.dateSaved).toLocaleString() : ''}
                </p>
            </div>
        );

        const renderExtendedItem = (item) => {
            const title = item.title || safeLabel('bookmarks.untitledExtendedText', 'Untitled extended text');
            return (
                <div
                    onClick={() => handleExtendedClick(item.textId)}
                    key={`extended-${item.textId}`} 
                    className={`${bookmarksStyles.sentenceItem} ${bookmarksStyles.extendedItem}`}
                >
                    <div className={bookmarksStyles.extendedHeader}>
                        <p className={bookmarksStyles.extendedTitle}>{title}</p>
                        <span className={bookmarksStyles.extendedBadge}>{safeLabel('bookmarks.extendedBadge', 'Extended text')}</span>
                    </div>
                    <p className={bookmarksStyles.sentenceTranslation}>{item.summary || safeLabel('bookmarks.extendedNoSummary', 'Open to view the full breakdown')}</p>
                    <div className={bookmarksStyles.extendedMeta}>
                        <span>{safeLabel('bookmarks.sentencesCount', '{count} sentences').replace('{count}', item.sentenceCount || 0)}</span>
                        <span>•</span>
                        <span>{item.originalLanguage?.toUpperCase()}</span>
                    </div>
                    <p className={bookmarksStyles.sentenceDate}>
                        {t('bookmarks.savedOn')} {item.dateSaved ? new Date(item.dateSaved).toLocaleString() : ''}
                    </p>
                </div>
            );
        };

        return (
            <>
                {renderPageSwitcher()}
                {visibleItems.map(item => item.type === 'extended_text' ? renderExtendedItem(item) : renderSentenceItem(item))}
                {renderPageSwitcher()}
            </>
        );
    }

    // Don't render while main auth is loading
    if (loading || !isAuthenticated) return null;

    return (
        <Dashboard>
            <div className={bookmarksStyles.bookmarksContent}>
                <h1 className={bookmarksStyles.pageTitle}>{t('bookmarks.title')}</h1>
                <div className={bookmarksStyles.leftPanel}>
                    <div className={bookmarksStyles.imageCard}>
                        <img src="/images/bookshelf.jpg" alt={safeLabel('bookmarks.title', 'Bookmarks')} />
                        <div className={bookmarksStyles.imageOverlay}>
                            <p>{safeLabel('bookmarks.libraryBlurb', 'Save your favorite breakdowns and return to them anytime.')}</p>
                        </div>
                    </div>
                </div>
                <div className={bookmarksStyles.rightPanel}>
                    <div className={bookmarksStyles.headerRow}>
                        <LanguageFilter 
                            selectedLanguage={selectedLanguage}
                            onSelectLanguage={handleLanguageChange}
                        />
                    </div>
                    <div className={bookmarksStyles.searchFilters}>
                        <input
                            type="search"
                            placeholder={safeLabel('bookmarks.searchPlaceholder', 'Search bookmarks')}
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className={bookmarksStyles.searchInput}
                        />
                        {renderTypeSelector()}
                    </div>
                    
                    {renderContent()}
                </div>
            </div>
        </Dashboard>
    );
};

export default Bookmarks; 
