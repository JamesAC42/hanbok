'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/styles/components/pagelayout.module.scss';
import bookmarksStyles from '@/styles/components/bookmarks.module.scss';
import Image from 'next/image';
import { MaterialSymbolsBookmarkSharp } from '@/components/icons/Bookmark';
import { useLanguage } from '@/contexts/LanguageContext';

import Dashboard from '@/components/Dashboard';

const Bookmarks = () => {
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();
    const [sentences, setSentences] = useState([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingContent, setLoadingContent] = useState(true);
    const [error, setError] = useState(null);
    const { t, language, getIcon, supportedAnalysisLanguages } = useLanguage();
    const [selectedLanguage, setSelectedLanguage] = useState(language);
    const [showLanguageOptions, setShowLanguageOptions] = useState(false);

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

                const endpoint = `/api/saved-sentences?page=${page}&limit=${limit}&language=${selectedLanguage}`;
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
                setError(t('bookmarks.fetchError'));
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
        if(totalPages <= 1) return null;
        
        return(              
            <div className={bookmarksStyles.pagination}>
                <button 
                    disabled={page <= 1} 
                    onClick={() => setPage(page - 1)}
                >
                    {t('bookmarks.prev')}
                </button>
                <span>{t('bookmarks.pageOf').replace('{current}', page).replace('{total}', totalPages)}</span>
                <button 
                    disabled={page >= totalPages} 
                    onClick={() => setPage(page + 1)}
                >
                    {t('bookmarks.next')}
                </button>
            </div>
        )
    }

    const renderLanguageSelector = () => (
        <div className={`${bookmarksStyles.languageSelector} ${showLanguageOptions ? bookmarksStyles.show : ''}`}>
            <div className={bookmarksStyles.languageList}>
                <button
                    className={bookmarksStyles.languageButton}
                    onClick={() => setShowLanguageOptions(!showLanguageOptions)}>
                    {getIcon(selectedLanguage)}
                </button>
                {Object.keys(supportedAnalysisLanguages).map(code => (
                    <button
                        key={code}
                        className={`${bookmarksStyles.languageOption} ${selectedLanguage === code ? bookmarksStyles.selected : ''}`}
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
            return <p className={bookmarksStyles.loading}>{t('bookmarks.loading')}</p>;
        }

        if (error) {
            return <p className={bookmarksStyles.error}>{error}</p>;
        }

        if (sentences.length === 0) {
            return (
                <div className={bookmarksStyles.noBookmarks}>
                    <p>{t('bookmarks.noSentences')}</p>
                    <p>{t('bookmarks.clickBookmark')} <MaterialSymbolsBookmarkSharp /> {t('bookmarks.toSave')}</p>
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
                        className={bookmarksStyles.sentenceItem}
                    >
                        <p className={bookmarksStyles.sentenceText}>{sentence.text}</p>
                        <p className={bookmarksStyles.sentenceTranslation}>{sentence.analysis?.sentence?.translation}</p>
                        <p className={bookmarksStyles.sentenceDate}>
                            {t('bookmarks.savedOn')} {new Date(sentence.dateSaved).toLocaleString()}
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
            <div className={bookmarksStyles.bookmarksContent}>
                {renderLanguageSelector()}
                <h1 className={bookmarksStyles.pageTitle}>{t('bookmarks.title')}</h1>
                
                {renderContent()}
            </div>
        </Dashboard>
    );
};

export default Bookmarks; 