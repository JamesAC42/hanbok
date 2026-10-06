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
import Link from 'next/link';
import Mascot from '@/components/Mascot';
import useProgress from '@/hooks/useProgress';
import { WeekStrip } from '@/components/home/ActivityCharts';
import reviewStyles from '@/styles/pages/review.module.scss';

const SECONDS_PER_CARD = 8;
const plural = (n, word) => `${n} ${n === 1 ? word : `${word}s`}`;

const Cards = () => {
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();
    const [decks, setDecks] = useState([]);
    const [loadingContent, setLoadingContent] = useState(true);
    const [error, setError] = useState(null);
    const { t, getIcon, supportedAnalysisLanguages } = useLanguage();
    const { progress } = useProgress(isAuthenticated && !loading, 14);
    
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.replace('/login');
        }
        document.title = 'Hanbok - Review';
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
                        name: supportedAnalysisLanguages[deck.language] || deck.name,
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
    }, [isAuthenticated, loading, supportedAnalysisLanguages, t]);

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

        const today = decks.reduce((sum, d) => sum + d.stats.new + d.stats.learning + d.stats.due, 0);
        // Start with the deck that has the most waiting.
        const startDeck = [...decks].sort((a, b) =>
            (b.stats.new + b.stats.learning + b.stats.due) - (a.stats.new + a.stats.learning + a.stats.due))[0];
        const minutes = Math.max(1, Math.round((today * SECONDS_PER_CARD) / 60));
        const streak = progress?.streak;

        return (
            <>
                <section className={reviewStyles.hero}>
                    <Mascot pose={today ? 'cards' : 'sleep'} size={88} className={reviewStyles.heroMascot} />
                    <div className={reviewStyles.heroText}>
                        {today ? (
                            <>
                                <h2>{plural(today, 'card')} ready today</h2>
                                <p>About {plural(minutes, 'minute')}. Each card shows the sentence you saved it from.</p>
                            </>
                        ) : (
                            <>
                                <h2>You're done for today</h2>
                                <p>Come back tomorrow, or save new words from something you read.</p>
                            </>
                        )}
                        {streak?.current ? (
                            <p className={reviewStyles.streak}>Day {streak.current} of your streak</p>
                        ) : null}
                    </div>
                    <div className={reviewStyles.heroSide}>
                        {progress && <WeekStrip days={progress.days} />}
                        {today ? (
                            <Link href={`/cards/${startDeck.id}/study`} className={reviewStyles.startButton}>
                                Start review
                            </Link>
                        ) : (
                            <Link href="/analyze" className={reviewStyles.secondaryButton}>
                                Analyze something new
                            </Link>
                        )}
                    </div>
                </section>

                <h2 className={reviewStyles.sectionTitle}>Your decks</h2>
                <div className={reviewStyles.deckGrid}>
                    {decks.map(deck => {
                        const waiting = deck.stats.new + deck.stats.learning + deck.stats.due;
                        return (
                            <div key={deck.id} className={reviewStyles.deck}>
                                <div className={reviewStyles.deckTop}>
                                    <span className={reviewStyles.deckIcon}>{getIcon(deck.language)}</span>
                                    <div>
                                        <div className={reviewStyles.deckName}>{deck.name}</div>
                                        <div className={reviewStyles.deckMeta}>
                                            {plural(deck.cardCount, 'card')}
                                            {deck.lastReviewed && ` · reviewed ${new Date(deck.lastReviewed).toLocaleDateString()}`}
                                        </div>
                                    </div>
                                </div>
                                <div className={reviewStyles.deckCounts}>
                                    <span className={reviewStyles.countNew}><strong>{deck.stats.new}</strong> {t('cards.new')}</span>
                                    <span className={reviewStyles.countLearning}><strong>{deck.stats.learning}</strong> {t('cards.learning')}</span>
                                    <span className={reviewStyles.countDue}><strong>{deck.stats.due}</strong> {t('cards.due')}</span>
                                </div>
                                <div className={reviewStyles.deckActions}>
                                    {waiting > 0 ? (
                                        <Link href={`/cards/${deck.id}/study`} className={reviewStyles.deckStudy}>Study {waiting}</Link>
                                    ) : (
                                        <span className={reviewStyles.deckDone}>All caught up</span>
                                    )}
                                    <button onClick={() => handleDeckClick(deck.id)} className={reviewStyles.deckManage}>
                                        Browse and settings
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </>
        );
    };

    // Don't render while main auth is loading
    if (loading || !isAuthenticated) return null;

    return (
        <Dashboard>
            <div className={`${cardsStyles.cardsContent} ${reviewStyles.page}`}>
                <h1 className={cardsStyles.pageTitle}>Review</h1>
                
                {renderContent()}
            </div>
        </Dashboard>
    );
};

export default Cards; 