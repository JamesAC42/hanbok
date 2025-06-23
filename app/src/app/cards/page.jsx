'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/styles/components/pagelayout.module.scss';
import cardsStyles from '@/styles/components/cards.module.scss';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import FlashcardsFeature from '@/components/FlashcardsFeature';
import Dashboard from '@/components/Dashboard';

const Cards = () => {
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();
    const [decks, setDecks] = useState([]);
    const [loadingContent, setLoadingContent] = useState(true);
    const [error, setError] = useState(null);
    const { t, getIcon, supportedLanguages } = useLanguage();
    
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.replace('/login');
        }
        document.title = t('cards.pageTitle');
    }, [isAuthenticated, loading, router, t]);

    useEffect(() => {
        async function fetchDecks() {
            try {
                setLoadingContent(true);
                setError(null);

                // Fetch decks from the API
                const response = await fetch('/api/decks');
                const data = await response.json();

                if (data.success) {
                    setDecks(data.decks.map(deck => ({
                        id: deck.deckId,
                        name: supportedLanguages[deck.language] || deck.name,
                        language: deck.language,
                        cardCount: deck.cardCount || 0,
                        stats: {
                            new: deck.stats?.new || 0,
                            learning: deck.stats?.learning || 0,
                            due: deck.stats?.due || 0
                        },
                        lastReviewed: deck.lastReviewed
                    })));
                } else {
                    setError(data.error || t('cards.fetchError'));
                }
            } catch (err) {
                console.error(err);
                setError(t('cards.fetchError'));
            } finally {
                setLoadingContent(false);
            }
        }
        
        if (isAuthenticated && !loading) {
            fetchDecks();
        }
    }, [isAuthenticated, loading, supportedLanguages, t]);

    const handleDeckClick = (deckId) => {
        router.push(`/cards/${deckId}`);
    };

    const renderContent = () => {
        if (loadingContent) {
            return <p className={cardsStyles.loading}>{t('cards.loading')}</p>;
        }

        if (error) {
            return <p className={cardsStyles.error}>{error}</p>;
        }

        if (decks.length === 0) {
            return (
                <div className={cardsStyles.noDecks}>
                    <FlashcardsFeature />
                </div>
            );
        }

        return (
            <div className={cardsStyles.deckList}>
                {decks.map(deck => (
                    <div 
                        key={deck.id} 
                        className={cardsStyles.deckItem}
                        onClick={() => handleDeckClick(deck.id)}
                    >
                        <div className={cardsStyles.deckHeader}>
                            <h2 className={cardsStyles.deckName}>
                                <span className={cardsStyles.languageIcon}>
                                    {getIcon(deck.language)}
                                </span>
                                {deck.name}
                            </h2>
                            <div className={cardsStyles.cardCount}>
                                {deck.cardCount} {t('cards.cards')}
                            </div>
                        </div>
                        
                        <div className={cardsStyles.deckStats}>
                            <div className={cardsStyles.statItem}>
                                <span className={cardsStyles.statLabel}>{t('cards.new')}</span>
                                <span className={`${cardsStyles.statValue} ${cardsStyles.new}`}>
                                    {deck.stats.new}
                                </span>
                            </div>
                            <div className={cardsStyles.statItem}>
                                <span className={cardsStyles.statLabel}>{t('cards.learning')}</span>
                                <span className={`${cardsStyles.statValue} ${cardsStyles.learning}`}>
                                    {deck.stats.learning}
                                </span>
                            </div>
                            <div className={cardsStyles.statItem}>
                                <span className={cardsStyles.statLabel}>{t('cards.due')}</span>
                                <span className={`${cardsStyles.statValue} ${cardsStyles.due}`}>
                                    {deck.stats.due}
                                </span>
                            </div>
                        </div>
                        
                        {deck.lastReviewed && (
                            <div className={cardsStyles.lastReviewed}>
                                {t('cards.lastReviewed')}: {new Date(deck.lastReviewed).toLocaleDateString()}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        );
    };

    // Don't render while main auth is loading
    if (loading || !isAuthenticated) return null;

    return (
        <Dashboard>
            <div className={cardsStyles.cardsContent}>
                <h1 className={cardsStyles.pageTitle}>{t('cards.title')}</h1>
                
                {renderContent()}
            </div>
        </Dashboard>
    );
};

export default Cards; 