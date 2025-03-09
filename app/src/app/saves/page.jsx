'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/styles/components/pagelayout.module.scss';
import savesStyles from '@/styles/components/saves.module.scss';
import Image from 'next/image';
import { MaterialSymbolsBookmarkSharp } from '@/components/icons/Bookmark';
import { MaterialSymbolsLibraryAddRounded } from '@/components/icons/Add';
import { MaterialSymbolsDeleteOutlineSharp } from '@/components/icons/Delete';
import { removeWord } from '@/api/words';
import { useLanguage } from '@/contexts/LanguageContext';
import getFontClass from '@/lib/fontClass';

const Saves = () => {
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();
    const [sentences, setSentences] = useState([]);
    const [words, setWords] = useState([]);
    const [activePage, setActivePage] = useState('sentences'); // 'sentences' or 'words'
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingContent, setLoadingContent] = useState(true);
    const [error, setError] = useState(null);
    const [activeWordId, setActiveWordId] = useState(null);
    const { t, language, setLanguage, nativeLanguage, setNativeLanguage, getIcon, supportedLanguages } = useLanguage();
    const [selectedLanguage, setSelectedLanguage] = useState(language);

    const [showLanguageOptions, setShowLanguageOptions] = useState(false);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.replace('/login');
        }
    }, [isAuthenticated, loading, router]);

    useEffect(() => {

        async function fetchContent() {
            try {
                setLoadingContent(true);
                setError(null);

                const endpoint = activePage === 'sentences' 
                    ? `/api/saved-sentences?page=${page}&limit=${limit}&language=${selectedLanguage}`
                    : `/api/words?page=${page}&limit=${limit}&originalLanguage=${selectedLanguage}&translationLanguage=en`;

                const response = await fetch(endpoint);
                const data = await response.json();

                if (data.success) {
                    if (activePage === 'sentences') {
                        setSentences(data.sentences);
                    } else {
                        setWords(data.words);
                    }
                    setTotalPages(data.totalPages);
                } else {
                    setError(data.error);
                }
            } catch (err) {
                console.error(err);
                setError(t('saves.fetchError', { type: activePage }));
            } finally {
                setLoadingContent(false);
            }
        }
        fetchContent();
    }, [page, limit, activePage, selectedLanguage]);

    const handleSentenceClick = (sentenceId) => {
        router.replace(`/sentence/${sentenceId}`);
    }

    const handleDeleteWord = async (word, e) => {
        e.stopPropagation();
        try {
            await removeWord({
                originalWord: word.originalWord,
                originalLanguage: word.originalLanguage
            });
            setWords(prevWords => prevWords.filter(w => w.wordId !== word.wordId));
        } catch (error) {
            console.error('Error deleting word:', error);
        }
    };

    const handleWordClick = (wordId) => {
        setActiveWordId(activeWordId === wordId ? null : wordId);
    };

    const renderPageSwitcher = () => {
        if(totalPages <= 1) return null;
        
        return(              
            <div className={savesStyles.pagination}>
                <button 
                    disabled={page <= 1} 
                    onClick={() => setPage(page - 1)}
                >
                    {t('saves.prev')}
                </button>
                <span>{t('saves.pageOf').replace('{current}', page).replace('{total}', totalPages)}</span>
                <button 
                    disabled={page >= totalPages} 
                    onClick={() => setPage(page + 1)}
                >
                    {t('saves.next')}
                </button>
            </div>
        )
    }

    const renderLanguageSelector = () => (
        <div className={`${savesStyles.languageSelector} ${showLanguageOptions ? savesStyles.show : ''}`}>
            <div className={savesStyles.languageList}>
                <button
                    className={savesStyles.languageButton}
                    onClick={() => setShowLanguageOptions(!showLanguageOptions)}>
                    {getIcon(selectedLanguage)}
                </button>
                {Object.keys(supportedLanguages).map(code => (
                    <button
                        key={code}
                        className={`${savesStyles.languageOption} ${selectedLanguage === code ? savesStyles.selected : ''}`}
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
            return <p>{t('saves.loading')}</p>;
        }

        if (error) {
            return <p className={savesStyles.error}>{error}</p>;
        }

        if (activePage === 'sentences') {
            if (sentences.length === 0) {
                return (
                    <div className={savesStyles.noSaves}>
                        <p>{t('saves.noSentences')}</p>
                        <p>{t('saves.clickBookmark')} <MaterialSymbolsBookmarkSharp /> {t('saves.toSave')}</p>
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
                            className={savesStyles.sentenceItem}
                        >
                            <p className={`${savesStyles.sentenceText} ${getFontClass(selectedLanguage)}`}>{sentence.text}</p>
                            <p className={`${getFontClass(sentence.translationLanguage)}`}>{sentence.analysis?.sentence?.translation}</p>
                            <p className={savesStyles.sentenceDate}>
                                {t('saves.savedOn')} {new Date(sentence.dateSaved).toLocaleString()}
                            </p>
                        </div>
                    ))}
                    {renderPageSwitcher()}
                </>
            );
        }

        // Words content
        if (words.length === 0) {
            return (
                <div className={savesStyles.noSaves}>
                    <p>{t('saves.noWords')}</p>
                    <p>{t('saves.clickAdd')} <MaterialSymbolsLibraryAddRounded /> {t('saves.toSave')}</p>
                </div>
            );
        }

        return (
            <div className={savesStyles.wordsContainer}>
                {renderPageSwitcher()}
                {words.map(word => (
                    <div
                        key={word.wordId} 
                        className={`${savesStyles.wordItem} ${activeWordId === word.wordId ? savesStyles.active : ''}`}
                        onClick={() => handleWordClick(word.wordId)}
                    >
                        <div className={savesStyles.wordContent}>
                            <p className={savesStyles.wordText}>
                                <span className={`${savesStyles.originalWord} ${getFontClass(selectedLanguage)}`}>{word.originalWord}</span>
                                <span className={savesStyles.divider}>•</span>
                                <span className={`${savesStyles.translatedWord} ${getFontClass(word.translationLanguage)}`}>{word.translatedWord}</span>
                            </p>
                            <p className={savesStyles.wordDate}>
                                {t('saves.savedOn')} {new Date(word.dateSaved).toLocaleString()}
                            </p>
                        </div>
                        <button 
                            className={savesStyles.deleteButton}
                            onClick={(e) => handleDeleteWord(word, e)}
                            aria-label={t('saves.deleteWord')}
                        >
                            <MaterialSymbolsDeleteOutlineSharp />
                        </button>
                    </div>
                ))}
                {renderPageSwitcher()}
            </div>
        );
    }

    // Don't render while main auth is loading
    if (loading || !isAuthenticated) return null;

    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageContent}>
                <div className={savesStyles.savesContent}>
                    {renderLanguageSelector()}
                    <div className={savesStyles.header}>
                        <h1 className={styles.pageTitle}>{t('saves.title')}</h1>
                    </div>
                    
                    <div className={savesStyles.tabButtons}>
                        <button 
                            className={`${savesStyles.tabButton} ${activePage === 'sentences' ? savesStyles.active : ''}`}
                            onClick={() => {
                                setActivePage('sentences');
                                setPage(1);
                            }}
                        >
                            {t('saves.sentences')}
                        </button>
                        <button 
                            className={`${savesStyles.tabButton} ${activePage === 'words' ? savesStyles.active : ''}`}
                            onClick={() => {
                                setActivePage('words');
                                setPage(1);
                            }}
                        >
                            {t('saves.words')}
                        </button>
                    </div>

                    <p className={savesStyles.comingSoon}>
                        {t('saves.flashcardsComingSoon')}
                    </p>

                    {renderContent()}
                </div>
            </div>
            <div className={styles.girlContainer}>
                <Image
                    src="/images/girl1.png"
                    alt={t('common.girlImage')}
                    width={1920}
                    height={1080}
                    priority
                />
            </div>
        </div>
    );
};

export default Saves;