'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/styles/components/pagelayout.module.scss';
import studyStyles from '@/styles/components/study.module.scss';
import Image from 'next/image';
import { useLanguage } from '@/contexts/LanguageContext';
import { MaterialSymbolsArrowBackRounded } from '@/components/icons/ArrowBack';
import { MaterialSymbolsVolumeUp } from '@/components/icons/VolumeOn';
import { MaterialSymbolsVolumeOff } from '@/components/icons/VolumeOff';
import { use } from 'react';
import getFontClass from '@/lib/fontClass';
// Import our new study session manager
import studySessionManager from '@/lib/studySessionManager';

const StudyView = ({ params }) => {
    // Unwrap params using React.use()
    const unwrappedParams = use(params);
    const deckId = unwrappedParams.deckId;
    
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();
    const [deck, setDeck] = useState(null);
    const [deckSettings, setDeckSettings] = useState(null);
    const [loadingContent, setLoadingContent] = useState(true);
    const [error, setError] = useState(null);
    const { t } = useLanguage();
    const [studySession, setStudySession] = useState(null);

    const [currentCard, setCurrentCard] = useState(null);
    const [showAnswer, setShowAnswer] = useState(false);
    const [updatingCard, setUpdatingCard] = useState(false);
    const [cardIndex, setCardIndex] = useState(0);
    const [muted, setMuted] = useState(false);
    const [audioError, setAudioError] = useState(false);
    
    // Reset showAnswer when currentCard changes
    useEffect(() => {
        setShowAnswer(false);
    }, [currentCard]);
    
    // Audio player reference
    const audioRef = useRef(null);

    // Add a reference to each rating button for focus management
    const againButtonRef = useRef(null);
    const hardButtonRef = useRef(null);
    const goodButtonRef = useRef(null);
    const easyButtonRef = useRef(null);
    const showAnswerButtonRef = useRef(null);

    useEffect(() => {
        if (!loading && !isAuthenticated) {
            router.replace('/login');
        }
    }, [isAuthenticated, loading, router]);

    useEffect(() => {
        async function fetchDeckDetails() {
            console.log('Fetching deck details');
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

                // Fetch deck settings
                const settingsResponse = await fetch(`/api/decks/${deckId}/settings`);
                const settingsData = await settingsResponse.json();

                let deckSettings = {
                    steps: [1, 10, 60, 1440], // Default steps in minutes
                    newCardsPerDay: 20,
                    reviewsPerDay: 100
                };

                if (settingsData.success) {
                    deckSettings = {
                        ...deckSettings,
                        ...settingsData.settings
                    };
                } else {
                    console.error('Failed to fetch deck settings:', settingsData.error);
                }
                setDeckSettings(deckSettings);

                // Fetch study session data
                const studyResponse = await fetch(`/api/decks/${deckId}/study`);
                const studyData = await studyResponse.json();

                if (!studyData.success) {
                    setError(studyData.error || t('cards.studySessionError'));
                    return;
                }

                console.log('Study data:', studyData);

                // Initialize the study session
                setStudySession(studyData.studySession);
                
                // Initialize the study session manager with the session data and deck settings
                const firstCard = studySessionManager.initialize(studyData.studySession, (updateInfo) => {
                    // This callback will be called when the session state changes
                    if (updateInfo.currentCard) {
                        setCurrentCard(updateInfo.currentCard);
                    }
                    if (updateInfo.cardIndex !== undefined) {
                        setCardIndex(updateInfo.cardIndex);
                    }
                    if (updateInfo.sessionUpdated) {
                        setStudySession({...studySessionManager.session});
                    }
                }, deckSettings);
                
                // Make sure we update the session statistics
                studySessionManager.updateSessionStats();
                
                if (firstCard) {
                    setCurrentCard(firstCard);
                    setCardIndex(0);
                }
            } catch (err) {
                console.error(err);
                setError(t('cards.fetchError'));
            } finally {
                setLoadingContent(false);
            }
        }
        
        // Only fetch deck details when the page first loads and user is authenticated
        if (isAuthenticated && !loading && deckId) {
            fetchDeckDetails();
        }

    }, [deckId, isAuthenticated, loading, t]);

    // Helper function to log and handle audio errors
    const handleAudioError = (err) => {
        console.error('Error playing audio:', err);
        setAudioError(true);
        
        // If we get an error, we'll log extra information to help debug
        if (currentCard?.audioUrl) {
            console.log('Audio URL that failed:', currentCard.audioUrl);
        }
    };

    // Play audio when showing the answer, if not muted
    useEffect(() => {
        if (showAnswer && currentCard && currentCard.audioUrl && !muted) {
            // Reset audio error state when trying to play
            setAudioError(false);
            
            // Small delay to ensure the audio element is properly loaded
            const timer = setTimeout(() => {
                if (audioRef.current) {
                    console.log('Attempting to play audio on answer reveal:', currentCard.audioUrl);
                    audioRef.current.play().catch(handleAudioError);
                }
            }, 300);
            
            return () => clearTimeout(timer);
        }
    }, [showAnswer, currentCard, muted]);

    // Reset audio error state for new cards
    useEffect(() => {
        if (currentCard) {
            setAudioError(false);
        }
    }, [currentCard]);

    // Add keyboard event handler
    useEffect(() => {
        const handleKeyDown = (e) => {
            // Don't capture keyboard events if we're in an input field
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') {
                return;
            }
            
            // If card is updating, don't process keyboard shortcuts
            if (updatingCard) return;
            
            // Handle show answer with space or enter
            if (!showAnswer && (e.key === ' ' || e.key === 'Enter')) {
                e.preventDefault(); // Prevent page scrolling on space
                handleShowAnswer();
                return;
            }
            
            // Handle rating with number keys 1-4
            if (showAnswer) {
                switch (e.key) {
                    case '1':
                        handleCardRating('again');
                        break;
                    case '2':
                        handleCardRating('hard');
                        break;
                    case '3':
                        handleCardRating('good');
                        break;
                    case '4':
                        handleCardRating('easy');
                        break;
                    default:
                        break;
                }
            }
        };
        
        // Add event listener
        window.addEventListener('keydown', handleKeyDown);
        
        // Clean up event listener
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [showAnswer, currentCard, updatingCard]);

    const handleShowAnswer = () => {
        setShowAnswer(true);
    };

    const handleBackClick = () => {
        router.push(`/cards/${deckId}`);
    };

    const handleToggleMute = () => {
        setMuted(prev => !prev);
        // If currently muted and toggling to unmuted, play the audio
        if (muted && currentCard && currentCard.audioUrl && audioRef.current) {
            setAudioError(false);
            audioRef.current.play().catch(handleAudioError);
        }
    };

    const handlePlayAudio = () => {
        if (currentCard && currentCard.audioUrl && audioRef.current) {
            setAudioError(false);
            audioRef.current.play().catch(handleAudioError);
        }
    };

    const handleCardRating = async (rating) => {
        if (!currentCard || updatingCard) return;
        
        try {
            setUpdatingCard(true);

            // Reset answer display immediately
            setShowAnswer(false);
            
            console.log(`[study-page] Rating card ${currentCard.flashcardId} as '${rating}'. Initial state:`, {
                reviewState: currentCard.reviewState,
                intervalDays: currentCard.intervalDays,
                nextReviewDate: currentCard.nextReviewDate
            });
            
            // Calculate the new card state using our session manager
            const updatedCard = studySessionManager.handleCardRating(rating);
            
            console.log(`[study-page] Card after studySessionManager.handleCardRating:`, {
                flashcardId: updatedCard.flashcardId,
                reviewState: updatedCard.reviewState,
                intervalDays: updatedCard.intervalDays,
                nextReviewDate: updatedCard.nextReviewDate
            });
            
            // Clean up the card state to only include fields that should be persisted
            // Remove any fields that shouldn't be in the database record
            const { 
                content, audioUrl, audioId, _id,
                ...cardStateToUpdate 
            } = updatedCard;
            
            console.log(`[study-page] Card state after cleanup:`, {
                flashcardId: cardStateToUpdate.flashcardId,
                reviewState: cardStateToUpdate.reviewState,
                intervalDays: cardStateToUpdate.intervalDays,
                nextReviewDate: cardStateToUpdate.nextReviewDate
            });
            
            // Ensure we have required fields according to the schema
            if (!cardStateToUpdate.reviewHistory || !Array.isArray(cardStateToUpdate.reviewHistory) || cardStateToUpdate.reviewHistory.length === 0) {
                // Create a basic review history entry if none exists
                cardStateToUpdate.reviewHistory = [{
                    date: new Date().toISOString(),
                    rating: rating === 'again' ? 1 : rating === 'hard' ? 2 : rating === 'good' ? 3 : 4,
                    timeTaken: 0,
                    intervalDays: cardStateToUpdate.intervalDays || 0
                }];
            }
            
            // Ensure all required fields are present
            const requiredFields = {
                flashcardId: currentCard.flashcardId,
                userId: currentCard.userId,
                contentType: currentCard.contentType || 'word',
                contentId: currentCard.contentId,
                dateCreated: currentCard.dateCreated || new Date().toISOString(),
                nextReviewDate: cardStateToUpdate.nextReviewDate || new Date().toISOString(),
            };
            
            // Combine with any missing required fields
            const completeCardState = {
                ...requiredFields,
                ...cardStateToUpdate
            };
            
            console.log(`[study-page] Final card state before sending to server:`, {
                flashcardId: completeCardState.flashcardId,
                reviewState: completeCardState.reviewState,
                intervalDays: completeCardState.intervalDays,
                nextReviewDate: completeCardState.nextReviewDate
            });
            
            // Send the updated card state to the server
            const response = await fetch(`/api/decks/${deckId}/study`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    flashcardId: currentCard.flashcardId,
                    updatedCardState: completeCardState
                }),
            });

            const data = await response.json();

            if (!data.success) {
                console.error('Error updating card:', data.error);
                setError(t('cards.study.errorUpdating'));
                return;
            }
            
        } catch (err) {
            console.error('Error rating card:', err);
            setError(t('cards.study.errorUpdating'));
        } finally {
            setUpdatingCard(false);
        }
    };

    // Prepare card content for display
    const getCardContent = () => {
        if (!currentCard || !currentCard.content) return { question: '', answer: '' };
        
        let question = '';
        let answer = '';
        
        if (currentCard.contentType === 'word') {
            // Word-type cards
            const content = currentCard.content;
            
            // Question side is the original word in the original language
            question = content.originalWord || t('cards.unknownWord');
            
            // Answer side is the translated word
            answer = content.translatedWord || t('cards.unknownTranslation');
        } else if (currentCard.contentType === 'sentence') {
            // Sentence-type cards
            const content = currentCard.content;
            
            // Question side is the original sentence
            question = content.originalText || t('cards.unknownWord');
            
            // Answer side is the translated sentence
            answer = content.translatedText || t('cards.unknownTranslation');
        }
        
        return { question, answer };
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

        if (!studySession || !studySession.cards || studySession.cards.length === 0) {
            return (
                <div className={studyStyles.emptyState}>
                    <p>{t('cards.study.finishedStudying')}</p>
                <button 
                    className={`${studyStyles.backButton} ${studyStyles.backButtonEmpty}`}
                    onClick={handleBackClick}
                    aria-label={t('common.back')}
                >
                    <MaterialSymbolsArrowBackRounded />
                </button>
                </div>
            );
        }

        if (!currentCard) {
            return <p className={studyStyles.loading}>{t('cards.loading')}</p>;
        }

        const { question, answer } = getCardContent();
        const cardLanguage = currentCard.content?.originalLanguage || deck.language;

        return (
            <div className={studyStyles.studyContainer}>
                <button 
                    className={studyStyles.backButton}
                    onClick={handleBackClick}
                    aria-label={t('common.back')}
                >
                    <MaterialSymbolsArrowBackRounded />
                </button>
                
                <button 
                    className={studyStyles.muteButton}
                    onClick={handleToggleMute}
                    aria-label={muted ? t('cards.study.unmute') : t('cards.study.mute')}
                >
                    {muted ? <MaterialSymbolsVolumeOff /> : <MaterialSymbolsVolumeUp />}
                </button>
                
                {/* Hidden audio player */}
                {currentCard && currentCard.audioUrl && (
                    <audio 
                        ref={audioRef} 
                        src={currentCard.audioUrl} 
                        preload="auto"
                        onError={(e) => {
                            console.error('Audio element error:', e);
                            console.log('Failed to load audio URL:', currentCard.audioUrl);
                            setAudioError(true);
                        }}
                    />
                )}
                
                <div className={studyStyles.cardOuter}>
                    {currentCard && (
                        <div className={studyStyles.cardContent}>
                            <div className={`${studyStyles.cardFace} ${showAnswer ? studyStyles.showAnswer : ''}`}>
                                <div className={studyStyles.questionSide}>
                                    <h3>{t('cards.study.question')}</h3>
                                    <p className={`${cardLanguage} ${getFontClass(deck.language)}`} lang={cardLanguage}>{question}</p>
                                </div>
                                <div className={studyStyles.answerSide}>
                                    <h3>{t('cards.study.answer')}</h3>
                                    <p lang="en">{answer}</p>
                                    {currentCard.audioUrl && !audioError && (
                                        <button 
                                            className={studyStyles.playAudioButton}
                                            onClick={handlePlayAudio}
                                            aria-label={t('cards.study.playAudio')}
                                        >
                                            <MaterialSymbolsVolumeUp />
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <div className={studyStyles.studyStats}>
                    {deckSettings && (
                        <div className={studyStyles.statsContainer}>
                            <div className={studyStyles.statItem}>
                                <span className={studyStyles.statLabel}>{t('cards.study.newCards')}:</span>
                                <span className={studyStyles.statValue}>
                                    {studySession?.stats?.new || 0}
                                </span>
                            </div>
                            <div className={studyStyles.statItem}>
                                <span className={studyStyles.statLabel}>{t('cards.study.learningCards')}:</span>
                                <span className={studyStyles.statValue}>
                                    {studySession?.stats?.learning || 0}
                                </span>
                            </div>
                            <div className={studyStyles.statItem}>
                                <span className={studyStyles.statLabel}>{t('cards.study.dueCards')}:</span>
                                <span className={studyStyles.statValue}>
                                    {studySession?.stats?.due || 0}
                                </span>
                            </div>
                            <div className={studyStyles.statItem}>
                                <span className={studyStyles.statLabel}>{t('cards.study.totalCards')}:</span>
                                <span className={studyStyles.statValue}>
                                    {studySession?.stats?.total || 0}
                                </span>
                            </div>
                        </div>
                    )}
                </div>

                <div className={studyStyles.studyControls}>
                    {
                        showAnswer ? (
                            <div className={studyStyles.ratingControls}>
                                <h4>{t('cards.study.rateYourRecall')}</h4>
                                <div className={studyStyles.ratingButtons}>
                                    <button 
                                        ref={againButtonRef}
                                        className={`${studyStyles.ratingButton} ${studyStyles.againButton}`}
                                        onClick={() => handleCardRating('again')}
                                        disabled={updatingCard}
                                        title={t('cards.study.againShortcut')}
                                    >
                                        <span className={studyStyles.ratingLabel}>{t('cards.study.again')}</span>
                                        <span className={studyStyles.ratingShortcut}>(1)</span>
                                    </button>
                                    <button 
                                        ref={hardButtonRef}
                                        className={`${studyStyles.ratingButton} ${studyStyles.hardButton}`}
                                        onClick={() => handleCardRating('hard')}
                                        disabled={updatingCard}
                                        title={t('cards.study.hardShortcut')}
                                    >
                                        <span className={studyStyles.ratingLabel}>{t('cards.study.hard')}</span>
                                        <span className={studyStyles.ratingShortcut}>(2)</span>
                                    </button>
                                    <button 
                                        ref={goodButtonRef}
                                        className={`${studyStyles.ratingButton} ${studyStyles.goodButton}`}
                                        onClick={() => handleCardRating('good')}
                                        disabled={updatingCard}
                                        title={t('cards.study.goodShortcut')}
                                    >
                                        <span className={studyStyles.ratingLabel}>{t('cards.study.good')}</span>
                                        <span className={studyStyles.ratingShortcut}>(3)</span>
                                    </button>
                                    <button 
                                        ref={easyButtonRef}
                                        className={`${studyStyles.ratingButton} ${studyStyles.easyButton}`}
                                        onClick={() => handleCardRating('easy')}
                                        disabled={updatingCard}
                                        title={t('cards.study.easyShortcut')}
                                    >
                                        <span className={studyStyles.ratingLabel}>{t('cards.study.easy')}</span>
                                        <span className={studyStyles.ratingShortcut}>(4)</span>
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <button 
                                ref={showAnswerButtonRef}
                                className={studyStyles.showAnswerButton}
                                onClick={handleShowAnswer}
                                disabled={updatingCard}
                                title={t('cards.study.showAnswerShortcut')}
                            >
                                {t('cards.study.showAnswer')}
                                <span className={studyStyles.keyboardHint}>{t('cards.study.spaceOrEnter')}</span>
                            </button>
                        )
                    }
                </div>

            </div>
        );
    };

    // Don't render while main auth is loading
    if (loading || !isAuthenticated) return null;
    if (!deck) return null;

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
                <div className={studyStyles.girl}>
                    <Image
                        src="/images/hanbokgirl.png"
                        alt="girl"
                        width={1024}
                        height={1536}
                        priority
                    />
                </div>
            </div>
        </div>
    );
};

export default StudyView; 