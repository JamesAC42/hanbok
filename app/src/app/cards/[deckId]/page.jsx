'use client';
import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/styles/components/pagelayout.module.scss';
import deckStyles from '@/styles/components/deck.module.scss';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { MaterialSymbolsArrowBackRounded } from '@/components/icons/ArrowBack';
import { MaterialSymbolsPlayArrowRounded } from '@/components/icons/Play';
import { MaterialSymbolsSettingsRounded } from '@/components/icons/Settings';
import DeckSettings from '@/components/cards/DeckSettings';
import StudyStatsDisplay from '@/components/StudyStatsDisplay';
import { use } from 'react';

const DeckView = ({ params }) => {
    // Unwrap params using React.use()
    const unwrappedParams = use(params);
    const deckId = unwrappedParams.deckId;
    
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();
    const [deck, setDeck] = useState(null);
    const [cards, setCards] = useState([]);
    const [loadingContent, setLoadingContent] = useState(true);
    const [error, setError] = useState(null);
    const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'table'
    const [showSettings, setShowSettings] = useState(false);
    const { t, getIcon, supportedLanguages } = useLanguage();
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const cardsPerPage = 50;
    
    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.replace('/login');
        }
    }, [isAuthenticated, loading, router]);

    // Reset pagination when view mode changes or cards are loaded
    useEffect(() => {
        setCurrentPage(1);
    }, [viewMode, cards.length]);

    // Extract fetchDeckDetails function to be reused
    const fetchDeckDetails = useCallback(async () => {
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
                cardCount: currentDeck.cardCount || 0,
                stats: {
                    ...(currentDeck.stats || { new: 0, learning: 0, due: 0 }),
                    detailedStats: currentDeck.stats?.detailedStats || null
                },
                settings: currentDeck.settings || {
                    newCardsPerDay: 20,
                    reviewsPerDay: 100,
                    learningSteps: [1, 10, 60, 1440]
                },
                lastReviewed: currentDeck.lastReviewed
            });

            // Fetch cards for this deck
            const cardsResponse = await fetch(`/api/decks/${deckId}/cards`);
            const cardsData = await cardsResponse.json();

            if (cardsData.success) {
                setCards(cardsData.cards);
                
                // Update deck stats with more detailed information if available
                if (cardsData.stats) {
                    setDeck(prevDeck => ({
                        ...prevDeck,
                        stats: {
                            ...prevDeck.stats,
                            detailedStats: cardsData.stats
                        }
                    }));
                }
            } else {
                setError(cardsData.error || t('cards.fetchError'));
            }
        } catch (err) {
            console.error(err);
            setError(t('cards.fetchError'));
        } finally {
            setLoadingContent(false);
        }
    }, [deckId, t]);

    useEffect(() => {
        if (isAuthenticated && !loading) {
            fetchDeckDetails();
        }
    }, [deckId, isAuthenticated, loading, t, fetchDeckDetails]);

    const handleBackClick = () => {
        router.push('/cards');
    };

    const handleStudyClick = () => {
        router.push(`/cards/${deckId}/study`);
    };

    const toggleViewMode = () => {
        setViewMode(viewMode === 'grid' ? 'table' : 'grid');
    };

    const toggleSettings = () => {
        setShowSettings(!showSettings);
    };

    // Simplified refreshDeckData function that calls fetchDeckDetails
    const refreshDeckData = () => {
        fetchDeckDetails();
    };

    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return '-';
        const date = new Date(dateString);
        return date.toLocaleDateString();
    };

    // Calculate pagination values
    const indexOfLastCard = currentPage * cardsPerPage;
    const indexOfFirstCard = indexOfLastCard - cardsPerPage;
    const currentCards = cards.slice(indexOfFirstCard, indexOfLastCard);
    const totalPages = Math.ceil(cards.length / cardsPerPage);

    // Change page
    const paginate = (pageNumber) => setCurrentPage(pageNumber);
    const goToNextPage = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
    const goToPrevPage = () => setCurrentPage(prev => Math.max(prev - 1, 1));

    // Render pagination controls
    const renderPagination = () => {
        // Only hide pagination if there are no cards or exactly one page
        if (cards.length === 0 || totalPages <= 1) return null;

        const startCard = indexOfFirstCard + 1;
        const endCard = Math.min(indexOfLastCard, cards.length);

        return (
            <div className={deckStyles.pagination}>
                <button 
                    onClick={goToPrevPage} 
                    disabled={currentPage === 1}
                    className={deckStyles.paginationButton}
                >
                    &laquo; {t('common.previous')}
                </button>
                
                <div className={deckStyles.paginationInfo}>
                    {t('common.page')} {currentPage} {t('common.of')} {totalPages}
                    <div className={deckStyles.cardRange}>
                        {t('cards.showing')} {startCard}-{endCard} {t('common.of')} {cards.length} {t('cards.cards')}
                    </div>
                </div>
                
                <button 
                    onClick={goToNextPage} 
                    disabled={currentPage === totalPages}
                    className={deckStyles.paginationButton}
                >
                    {t('common.next')} &raquo;
                </button>
            </div>
        );
    };

    // Render the grid view of cards
    const renderGridView = () => {
        if (cards.length === 0) {
            return <p className={deckStyles.noCards}>{t('cards.noCardsInDeck')}</p>;
        }

        return (
            <>
                <div className={deckStyles.cardsGrid}>
                    {currentCards.map(card => (
                        <div key={card.flashcardId} className={deckStyles.cardItem}>
                            <div className={deckStyles.cardFront}>
                                <span className={deckStyles.wordText}>
                                    {card.content?.originalWord || t('cards.unknownWord')}
                                </span>
                            </div>
                            <div className={deckStyles.cardDivider}></div>
                            <div className={deckStyles.cardBack}>
                                <span className={deckStyles.translationText}>
                                    {card.content?.translatedWord || t('cards.unknownTranslation')}
                                </span>
                            </div>
                        </div>
                    ))}
                </div>
                {/* Always render pagination if there are cards */}
                {cards.length > 0 && renderPagination()}
            </>
        );
    };

    // Render the table view of cards with spaced repetition details
    const renderTableView = () => {
        if (cards.length === 0) {
            return <p className={deckStyles.noCards}>{t('cards.noCardsInDeck')}</p>;
        }

        return (
            <>
                <div className={deckStyles.tableContainer}>
                    <table className={deckStyles.cardsTable}>
                        <thead>
                            <tr>
                                <th>{t('cards.front')}</th>
                                <th>{t('cards.back')}</th>
                                <th>{t('cards.state')}</th>
                                <th>{t('cards.interval')}</th>
                                <th>{t('cards.easeFactor')}</th>
                                <th>{t('cards.nextReview')}</th>
                                <th>{t('cards.reviews')}</th>
                                <th>{t('cards.lapses')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentCards.map(card => (
                                <tr key={card.flashcardId}>
                                    <td>{card.content?.originalWord || t('cards.unknownWord')}</td>
                                    <td>{card.content?.translatedWord || t('cards.unknownTranslation')}</td>
                                    <td>
                                        <span className={deckStyles[card.reviewState || 'new']}>
                                            {t(`cards.${card.reviewState || 'new'}`)}
                                        </span>
                                    </td>
                                    <td>{card.intervalDays || 0} {t('cards.days')}</td>
                                    <td>{card.easeFactor?.toFixed(2) || '2.50'}</td>
                                    <td>{formatDate(card.nextReviewDate)}</td>
                                    <td>{card.repetitionNumber || 0}</td>
                                    <td>{card.lapses || 0}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Always render pagination if there are cards */}
                {cards.length > 0 && renderPagination()}
            </>
        );
    };

    const renderContent = () => {
        if (loadingContent) {
            return <p>{t('cards.loading')}</p>;
        }

        if (error) {
            return <p className={deckStyles.error}>{error}</p>;
        }

        if (!deck) {
            return <p className={deckStyles.error}>{t('cards.deckNotFound')}</p>;
        }

        return (
            <>
                <div className={deckStyles.deckInfo}>
                    <div className={deckStyles.deckHeader}>
                        <h2 className={deckStyles.deckName}>
                            <span className={deckStyles.languageIcon}>
                                {getIcon(deck.language)}
                            </span>
                            {deck.name}
                        </h2>
                        <div className={deckStyles.deckActions}>
                            <button 
                                className={deckStyles.settingsButton}
                                onClick={toggleSettings}
                                aria-label={t('cards.settings')}
                            >
                                <MaterialSymbolsSettingsRounded />
                            </button>
                            <div className={deckStyles.cardCount}>
                                {deck.cardCount} {t('cards.cards')}
                            </div>
                        </div>
                    </div>
                    
                    <div className={deckStyles.deckStats}>
                        <div className={deckStyles.statItem}>
                            <span className={deckStyles.statLabel}>{t('cards.new')}</span>
                            <span className={`${deckStyles.statValue} ${deckStyles.new}`}>
                                {deck.stats.new}
                            </span>
                            {deck.stats.detailedStats && deck.stats.detailedStats.new.available > deck.stats.detailedStats.new.remaining && (
                                <span className={deckStyles.statLimit}>
                                    {deck.stats.detailedStats.new.available} {t('cards.total')}
                                    {deck.stats.detailedStats.new.studied > 0 && (
                                        <> ({deck.stats.detailedStats.new.studied} {t('cards.studied')} {t('cards.today')})</>
                                    )}
                                </span>
                            )}
                        </div>
                        <div className={deckStyles.statItem}>
                            <span className={deckStyles.statLabel}>{t('cards.learning')}</span>
                            <span className={`${deckStyles.statValue} ${deckStyles.learning}`}>
                                {deck.stats.learning}
                            </span>
                        </div>
                        <div className={deckStyles.statItem}>
                            <span className={deckStyles.statLabel}>{t('cards.due')}</span>
                            <span className={`${deckStyles.statValue} ${deckStyles.due}`}>
                                {deck.stats.due}
                            </span>
                            {deck.stats.detailedStats && deck.stats.detailedStats.due.available > deck.stats.detailedStats.due.limited && (
                                <span className={deckStyles.statLimit}>
                                    {deck.stats.detailedStats.due.available} {t('cards.available')} 
                                    ({t('cards.limitedTo')} {deck.stats.detailedStats.due.limit})
                                </span>
                            )}
                        </div>
                    </div>
                    
                    <button 
                        className={deckStyles.studyButton}
                        onClick={handleStudyClick}
                        disabled={deck.cardCount === 0}
                    >
                        <MaterialSymbolsPlayArrowRounded />
                        {t('cards.studyNow')}
                    </button>
                </div>
                
                {/* Study Stats Display Component */}
                <StudyStatsDisplay deckId={deckId} />
                
                <div className={deckStyles.cardsList}>
                    <div className={deckStyles.cardsListHeader}>
                        <h3 className={deckStyles.cardsListTitle}>
                            {t('cards.cardsInDeck')}
                        </h3>
                        <div className={deckStyles.viewToggle}>
                            <span>{t('cards.viewMode')}:</span>
                            <label className={deckStyles.switch}>
                                <input 
                                    type="checkbox" 
                                    checked={viewMode === 'table'} 
                                    onChange={toggleViewMode}
                                />
                                <span className={deckStyles.slider}></span>
                            </label>
                            <span>{viewMode === 'grid' ? t('cards.gridView') : t('cards.tableView')}</span>
                        </div>
                    </div>
                    
                    {viewMode === 'grid' ? renderGridView() : renderTableView()}
                </div>

                {showSettings && (
                    <DeckSettings 
                        deckId={deckId} 
                        onClose={toggleSettings}
                        onSettingsUpdated={refreshDeckData}
                    />
                )}
            </>
        );
    };

    // Don't render while main auth is loading
    if (loading || !isAuthenticated) return null;

    return (
        <div className={styles.pageContainer}>
            <div className={styles.pageContent}>
                <div className={deckStyles.deckContent}>
                    <button 
                        className={deckStyles.backButton}
                        onClick={handleBackClick}
                        aria-label={t('common.back')}
                    >
                        <MaterialSymbolsArrowBackRounded />
                    </button>
                    
                    <div className={deckStyles.header}>
                        <h1>{t('cards.deckTitle')}</h1>
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

export default DeckView; 