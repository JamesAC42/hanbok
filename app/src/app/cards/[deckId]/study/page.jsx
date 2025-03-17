'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/styles/components/pagelayout.module.scss';
import studyStyles from '@/styles/components/study.module.scss';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { MaterialSymbolsArrowBackRounded } from '@/components/icons/ArrowBack';
import { use } from 'react';

const StudyView = ({ params }) => {
    // Unwrap params using React.use()
    const unwrappedParams = use(params);
    const deckId = unwrappedParams.deckId;
    
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();
    const [deck, setDeck] = useState(null);
    const [loadingContent, setLoadingContent] = useState(true);
    const [error, setError] = useState(null);
    const { t } = useLanguage();
    
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.replace('/login');
        }
    }, [isAuthenticated, loading, router]);

    useEffect(() => {
        async function fetchDeckDetails() {
            try {
                setLoadingContent(true);
                setError(null);

                // Fetch deck details
                const deckResponse = await fetch(`/api/decks`);
                const deckData = await deckResponse.json();

                if (!deckData.success) {
                    setError(deckData.error || t('cards.fetchError'));
                    return;
                }

                // Find the specific deck
                const currentDeck = deckData.decks.find(d => d.deckId === parseInt(deckId));
                
                if (!currentDeck) {
                    setError(t('cards.deckNotFound'));
                    return;
                }

                setDeck({
                    id: currentDeck.deckId,
                    name: currentDeck.name,
                    language: currentDeck.language,
                });
            } catch (err) {
                console.error(err);
                setError(t('cards.fetchError'));
            } finally {
                setLoadingContent(false);
            }
        }
        
        if (isAuthenticated && !loading) {
            fetchDeckDetails();
        }
    }, [deckId, isAuthenticated, loading, t]);

    const handleBackClick = () => {
        router.push(`/cards/${deckId}`);
    };

    const renderContent = () => {
        if (loadingContent) {
            return <p>{t('cards.loading')}</p>;
        }

        if (error) {
            return <p className={studyStyles.error}>{error}</p>;
        }

        if (!deck) {
            return <p className={studyStyles.error}>{t('cards.deckNotFound')}</p>;
        }

        return (
            <div className={studyStyles.studyContainer}>
                <button 
                    className={studyStyles.backButton}
                    onClick={handleBackClick}
                    aria-label={t('common.back')}
                >
                    <MaterialSymbolsArrowBackRounded />
                </button>
                <p className={studyStyles.placeholder}>
                    {t('cards.studyPlaceholder')}
                </p>
            </div>
        );
    };

    // Don't render while main auth is loading
    if (loading || !isAuthenticated) return null;
    if (!deck) return null;

    console.log(deck);

    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageContent}>
                <div className={studyStyles.studyContent}>
                    
                    <div className={studyStyles.header}>
                        <h2 className={studyStyles.deckName}>
                        {t('cards.study.studying') + " "}{deck.name}</h2>
                    </div>
                    
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

export default StudyView; 