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
import { MaterialSymbolsDownloadRounded } from '@/components/icons/Download';
import { MaterialSymbolsMoreVertRounded } from '@/components/icons/MoreVert';
import { MaterialSymbolsAdd } from '@/components/icons/Plus';
import DeckSettings from '@/components/cards/DeckSettings';
import EditCardModal from '@/components/cards/EditCardModal';
import StudyStatsDisplay from '@/components/StudyStatsDisplay';
import Dashboard from '@/components/Dashboard';
import Mascot from '@/components/Mascot';
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
    const { t, getIcon, supportedAnalysisLanguages } = useLanguage();
    
    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const cardsPerPage = 50;
    
    // Add exportStatus state to show loading state during export
    const [exportStatus, setExportStatus] = useState('idle'); // 'idle', 'loading', 'error'
    
    // Edit modal state
    const [editingCard, setEditingCard] = useState(null);
    const [showEditModal, setShowEditModal] = useState(false);
    const [modalMode, setModalMode] = useState('edit'); // 'edit' or 'create'

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.replace('/login');
        }
    }, [isAuthenticated, loading, router]);

    const capitalize = (str) => {   
        return str.charAt(0).toUpperCase() + str.slice(1);  
    }

    useEffect(() => {
        if(!!deck) {
            document.title = t('cards.deckPageTitle').replace('{language}', capitalize(supportedAnalysisLanguages[deck.language]) || 'Unknown');
        }
    }, [deck, t]);

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

    // Edit card functions
    const handleEditCard = (card) => {
        setEditingCard(card);
        setModalMode('edit');
        setShowEditModal(true);
    };

    const handleCreateCard = () => {
        setEditingCard(null);
        setModalMode('create');
        setShowEditModal(true);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setEditingCard(null);
        setModalMode('edit');
    };

    const handleCardSaved = (updatedCard) => {
        if (modalMode === 'create') {
            // Add new card to the end of the cards array
            setCards(prevCards => [...prevCards, updatedCard]);
            
            // Update deck card count
            setDeck(prevDeck => ({
                ...prevDeck,
                cardCount: (prevDeck.cardCount || 0) + 1
            }));
        } else {
            // Update the specific card in the cards array
            setCards(prevCards => 
                prevCards.map(card => 
                    card.flashcardId === editingCard.flashcardId 
                        ? { ...card, customFront: updatedCard.customFront, customBack: updatedCard.customBack }
                        : card
                )
            );
        }
    };

    const handleCardDeleted = (deletedCardId) => {
        // Remove the card from the cards array
        setCards(prevCards => 
            prevCards.filter(card => card.flashcardId !== deletedCardId)
        );
        
        // Update deck card count
        setDeck(prevDeck => ({
            ...prevDeck,
            cardCount: Math.max(0, (prevDeck.cardCount || 0) - 1)
        }));
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
            return renderEmptyDeck();
        }

        return (
            <>
                <div className={deckStyles.cardsGrid}>
                    {currentCards.map(card => (
                        <div key={card.flashcardId} className={deckStyles.cardItem}>
                            <div className={deckStyles.cardText}>
                                <span className={deckStyles.wordText}>
                                    {card.customFront || card.content?.originalWord || t('cards.unknownWord')}
                                </span>
                                <span className={deckStyles.translationText}>
                                    {card.customBack || card.content?.translatedWord || t('cards.unknownTranslation')}
                                </span>
                            </div>
                            <span className={`${deckStyles.statePill} ${deckStyles[card.reviewState || 'new']}`}>
                                {t(`cards.${card.reviewState || 'new'}`)}
                            </span>
                            <button 
                                className={deckStyles.cardEditButton}
                                onClick={() => handleEditCard(card)}
                                aria-label={t('cards.editCard')}
                                title={t('cards.editCard')}
                            >
                                <MaterialSymbolsMoreVertRounded />
                            </button>
                        </div>
                    ))}

                    {/* Add card button */}
                    <button type="button" className={deckStyles.addCardItem} onClick={handleCreateCard}>
                        <MaterialSymbolsAdd />
                        <span>{t('cards.addCard')}</span>
                    </button>
                </div>
                {renderPagination()}
            </>
        );
    };

    // Friendly empty state shared by both views
    const renderEmptyDeck = () => (
        <div className={deckStyles.emptyDeckContainer}>
            <Mascot pose="cards" size={84} />
            <p className={deckStyles.noCards}>{t('cards.noCardsInDeck')}</p>
            <button type="button" className={deckStyles.emptyAddButton} onClick={handleCreateCard}>
                <MaterialSymbolsAdd />
                {t('cards.addFirstCard')}
            </button>
        </div>
    );

    // Render the table view of cards with spaced repetition details
    const renderTableView = () => {
        if (cards.length === 0) {
            return renderEmptyDeck();
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
                                <th className={deckStyles.actionsColumn}>{t('cards.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {currentCards.map(card => (
                                <tr key={card.flashcardId} className={deckStyles.tableRow}>
                                    <td>{card.customFront || card.content?.originalWord || t('cards.unknownWord')}</td>
                                    <td>{card.customBack || card.content?.translatedWord || t('cards.unknownTranslation')}</td>
                                    <td>
                                        <span className={`${deckStyles.statePill} ${deckStyles[card.reviewState || 'new']}`}>
                                            {t(`cards.${card.reviewState || 'new'}`)}
                                        </span>
                                    </td>
                                    <td>{card.intervalDays || 0} {t('cards.days')}</td>
                                    <td>{card.easeFactor?.toFixed(2) || '2.50'}</td>
                                    <td>{formatDate(card.nextReviewDate)}</td>
                                    <td>{card.repetitionNumber || 0}</td>
                                    <td>{card.lapses || 0}</td>
                                    <td className={deckStyles.actionsCell}>
                                        <button 
                                            className={deckStyles.tableEditButton}
                                            onClick={() => handleEditCard(card)}
                                            aria-label={t('cards.editCard')}
                                            title={t('cards.editCard')}
                                        >
                                            <MaterialSymbolsMoreVertRounded />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                
                {/* Add card button for table view */}
                <div className={deckStyles.tableAddCardContainer}>
                    <button className={deckStyles.tableAddCardButton} onClick={handleCreateCard}>
                        <MaterialSymbolsAdd />
                        {t('cards.addCard')}
                    </button>
                </div>
                
                {renderPagination()}
            </>
        );
    };

    const handleExportClick = async () => {
        try {
            setExportStatus('loading');
            const response = await fetch(`/api/decks/${deckId}/export`);
            
            // Check if the response is OK
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to export deck');
            }
            
            // Get the filename from the Content-Disposition header or use a default
            const contentDisposition = response.headers.get('Content-Disposition');
            let filename = `deck_${deckId}_export.txt`;
            
            if (contentDisposition) {
                const filenameMatch = contentDisposition.match(/filename="(.+)"/);
                if (filenameMatch) {
                    filename = filenameMatch[1];
                }
            }
            
            // Get the blob from the response
            const blob = await response.blob();
            
            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);
            
            // Create a temporary link element
            const link = document.createElement('a');
            link.href = url;
            link.download = filename;
            
            // Append to the document, click it, and clean up
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            // Release the URL object
            window.URL.revokeObjectURL(url);
            
            setExportStatus('idle');
        } catch (error) {
            console.error('Error exporting deck:', error);
            setError(t('cards.exportError') || 'Failed to export deck');
            setExportStatus('error');
            setTimeout(() => setExportStatus('idle'), 3000);
        }
    };

    const renderContent = () => {
        if (loadingContent) {
            return <p className={deckStyles.loadingText}>{t('cards.loading')}</p>;
        }

        if (error) {
            return <p className={deckStyles.error}>{error}</p>;
        }

        if (!deck) {
            return <p className={deckStyles.error}>{t('cards.deckNotFound')}</p>;
        }

        const toStudy = deck.stats.new + deck.stats.learning + deck.stats.due;

        return (
            <>
                <section className={deckStyles.deckInfo}>
                    <div className={deckStyles.deckStats}>
                        <div className={`${deckStyles.statItem} ${deckStyles.new}`}>
                            <span className={deckStyles.statLabel}>{t('cards.new')}</span>
                            <span className={deckStyles.statValue}>
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
                        <div className={`${deckStyles.statItem} ${deckStyles.learning}`}>
                            <span className={deckStyles.statLabel}>{t('cards.learning')}</span>
                            <span className={deckStyles.statValue}>
                                {deck.stats.learning}
                            </span>
                        </div>
                        <div className={`${deckStyles.statItem} ${deckStyles.due}`}>
                            <span className={deckStyles.statLabel}>{t('cards.due')}</span>
                            <span className={deckStyles.statValue}>
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

                    <div className={deckStyles.studySide}>
                        {/* Calculate whether there are any cards to study */}
                        {toStudy === 0 && deck.cardCount > 0 && (
                            <div className={deckStyles.completedMessage}>
                                <Mascot pose="cheer" size={56} />
                                <p>{t('cards.completedForDay')} {t('cards.checkBackTomorrow')}</p>
                            </div>
                        )}

                        <button 
                            className={deckStyles.studyButton}
                            onClick={handleStudyClick}
                            disabled={deck.cardCount === 0 || toStudy === 0}
                        >
                            <MaterialSymbolsPlayArrowRounded />
                            {t('cards.studyNow')}
                        </button>
                    </div>
                </section>
                
                {/* Study Stats Display Component */}
                <StudyStatsDisplay deckId={deckId} />
                
                <section className={deckStyles.cardsList}>
                    <div className={deckStyles.cardsListHeader}>
                        <h2 className={deckStyles.cardsListTitle}>
                            {t('cards.cardsInDeck')}
                            <span className={deckStyles.cardCount}>{deck.cardCount}</span>
                        </h2>
                        <div className={deckStyles.viewToggle} role="group" aria-label={t('cards.viewMode')}>
                            <button
                                type="button"
                                className={viewMode === 'grid' ? deckStyles.viewTabActive : deckStyles.viewTab}
                                aria-pressed={viewMode === 'grid'}
                                onClick={() => viewMode !== 'grid' && toggleViewMode()}
                            >
                                {t('cards.gridView')}
                            </button>
                            <button
                                type="button"
                                className={viewMode === 'table' ? deckStyles.viewTabActive : deckStyles.viewTab}
                                aria-pressed={viewMode === 'table'}
                                onClick={() => viewMode !== 'table' && toggleViewMode()}
                            >
                                {t('cards.tableView')}
                            </button>
                        </div>
                    </div>
                    
                    {viewMode === 'grid' ? renderGridView() : renderTableView()}
                </section>
            </>
        );
    };

    // Don't render while main auth is loading
    if (loading || !isAuthenticated) return null;

    return (
        <Dashboard>
            <div className={deckStyles.deckContent}>
                <div className={deckStyles.page}>
                    <div className={deckStyles.header}>
                        <button 
                            className={deckStyles.backButton}
                            onClick={handleBackClick}
                            aria-label={t('common.back')}
                            title={t('common.back')}
                        >
                            <MaterialSymbolsArrowBackRounded />
                        </button>

                        <div className={deckStyles.titleBlock}>
                            {deck && <span className={deckStyles.eyebrow}>{t('cards.deckTitle')}</span>}
                            <h1 className={deckStyles.deckName}>
                                {deck && (
                                    <span className={deckStyles.languageIcon}>
                                        {getIcon(deck.language)}
                                    </span>
                                )}
                                <span className={deckStyles.deckNameText}>{deck ? deck.name : t('cards.deckTitle')}</span>
                            </h1>
                        </div>

                        {deck && (
                            <div className={deckStyles.deckActions}>
                                <button 
                                    className={`${deckStyles.iconButton} ${exportStatus === 'loading' ? deckStyles.loading : ''}`}
                                    onClick={handleExportClick}
                                    disabled={exportStatus === 'loading' || deck.cardCount === 0}
                                    aria-label={t('cards.exportDeck')}
                                    title={t('cards.exportDeckForAnki')}
                                >
                                    <MaterialSymbolsDownloadRounded />
                                </button>
                                <button 
                                    className={deckStyles.iconButton}
                                    onClick={toggleSettings}
                                    aria-label={t('cards.settings')}
                                    title={t('cards.deckSettings')}
                                >
                                    <MaterialSymbolsSettingsRounded />
                                </button>
                            </div>
                        )}
                    </div>
                    
                    {renderContent()}
                </div>
            </div>
            
            {/* Edit Card Modal */}
            <EditCardModal
                card={editingCard}
                isOpen={showEditModal}
                onClose={handleCloseEditModal}
                onSave={handleCardSaved}
                onDelete={handleCardDeleted}
                deckId={deckId}
                mode={modalMode}
            />
            
            {/* Deck Settings Modal */}
            {showSettings && (
                <DeckSettings 
                    deckId={deckId} 
                    onClose={toggleSettings}
                    onSettingsUpdated={refreshDeckData}
                />
            )}
        </Dashboard>
    );
};

export default DeckView;
