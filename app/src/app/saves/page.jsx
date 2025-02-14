'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/styles/components/pagelayout.module.scss';
import savesStyles from '@/styles/components/saves.module.scss';
import Image from 'next/image';

const Saves = () => {
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();
    const [sentences, setSentences] = useState([]);
    const [page, setPage] = useState(1);
    const [limit] = useState(10);
    const [totalPages, setTotalPages] = useState(1);
    const [loadingSentences, setLoadingSentences] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.replace('/login');
        }
    }, [isAuthenticated, loading, router]);

    useEffect(() => {
        async function fetchSentences() {
            try {
                setLoadingSentences(true);
                setError(null);
                const response = await fetch(`/api/user/sentences?page=${page}&limit=${limit}`);
                const data = await response.json();
                if (data.success) {
                    setSentences(data.sentences);
                    setTotalPages(data.totalPages);
                } else {
                    setError(data.error);
                }
            } catch (err) {
                console.error(err);
                setError("Error fetching sentences.");
            } finally {
                setLoadingSentences(false);
            }
        }
        fetchSentences();
    }, [page, limit]);

    const handleSentenceClick = (sentenceId) => {
        router.replace(`/sentence/${sentenceId}`);
    }

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

    // Don't render while main auth is loading
    if (loading || !isAuthenticated) return null;

    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageContent}>
                <div className={savesStyles.savesContent}>
                    <h1 className={styles.pageTitle}>Saved Items</h1>
                    
                    {loadingSentences ? (
                        <p>Loading sentences...</p>
                    ) : error ? (
                        <p className={savesStyles.error}>{error}</p>
                    ) : (
                        <>
                            {renderPageSwitcher()}
                            {sentences.map(sentence => (
                                <div
                                    onClick={() => handleSentenceClick(sentence.sentenceId)}
                                    key={sentence.sentenceId} className={savesStyles.sentenceItem}>
                                    <p className={savesStyles.sentenceText}>{sentence.text}</p>
                                    <p className={savesStyles.sentenceDate}>{new Date(sentence.dateCreated).toLocaleString()}</p>
                                </div>
                            ))}
                            {renderPageSwitcher()}
                        </>
                    )}
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