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
                    ? `/api/saved-sentences?page=${page}&limit=${limit}`
                    : `/api/words?page=${page}&limit=${limit}`;

                const response = await fetch(endpoint);
                const data = await response.json();

                if (data.success) {
                    if (activePage === 'sentences') {
                        console.log(data.sentences);
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
                setError(`Error fetching saved ${activePage}.`);
            } finally {
                setLoadingContent(false);
            }
        }
        fetchContent();
    }, [page, limit, activePage]);

    const handleSentenceClick = (sentenceId) => {
        router.replace(`/sentence/${sentenceId}`);
    }

    const handleDeleteWord = async (word, e) => {
        e.stopPropagation();
        try {
            await removeWord({korean:word.korean, english:word.english});
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
                    Prev
                </button>
                <span>Page {page} of {totalPages}</span>
                <button 
                    disabled={page >= totalPages} 
                    onClick={() => setPage(page + 1)}
                >
                    Next
                </button>
            </div>
        )
    }

    const renderContent = () => {
        if (loadingContent) {
            return <p>Loading {activePage}...</p>;
        }

        if (error) {
            return <p className={savesStyles.error}>{error}</p>;
        }

        if (activePage === 'sentences') {
            if (sentences.length === 0) {
                return (
                    <div className={savesStyles.noSaves}>
                        <p>No saved sentences found.</p>
                        <p>Click the <MaterialSymbolsBookmarkSharp /> icon on any sentence to save it.</p>
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
                            <p className={savesStyles.sentenceText}>{sentence.text}</p>
                            <p className={savesStyles.sentenceTranslation}>{sentence.analysis?.sentence?.english}</p>
                            <p className={savesStyles.sentenceDate}>
                                Saved on {new Date(sentence.dateSaved).toLocaleString()}
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
                    <p>No saved words found.</p>
                    <p>Click the <MaterialSymbolsLibraryAddRounded /> icon on any word to save it.</p>
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
                                <span className={savesStyles.korean}>{word.korean}</span>
                                <span className={savesStyles.divider}>•</span>
                                <span className={savesStyles.english}>{word.english}</span>
                            </p>
                            <p className={savesStyles.wordDate}>
                                Saved on {new Date(word.dateSaved).toLocaleString()}
                            </p>
                        </div>
                        <button 
                            className={savesStyles.deleteButton}
                            onClick={(e) => handleDeleteWord(word, e)}
                            aria-label="Delete word"
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
                    <h1 className={styles.pageTitle}>Saved Items</h1>
                    
                    <div className={savesStyles.tabButtons}>
                        <button 
                            className={`${savesStyles.tabButton} ${activePage === 'sentences' ? savesStyles.active : ''}`}
                            onClick={() => {
                                setActivePage('sentences');
                                setPage(1);
                            }}
                        >
                            Sentences
                        </button>
                        <button 
                            className={`${savesStyles.tabButton} ${activePage === 'words' ? savesStyles.active : ''}`}
                            onClick={() => {
                                setActivePage('words');
                                setPage(1);
                            }}
                        >
                            Words
                        </button>
                    </div>

                    <p className={savesStyles.comingSoon}>
                        Flashcards coming soon!
                    </p>

                    {renderContent()}
                </div>
            </div>
            <div className={styles.girlContainer}>
                <Image
                    src="/images/girl1.png"
                    alt="girl"
                    width={1920}
                    height={1080}
                    priority
                />
            </div>
        </div>
    );
};

export default Saves;