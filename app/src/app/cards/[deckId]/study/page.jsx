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
import Dashboard from '@/components/Dashboard';
import SourceSentence from '@/components/cards/SourceSentence';
// Import our new study session manager
import studySessionManager from '@/lib/studySessionManager';
import Link from 'next/link';
import Mascot from '@/components/Mascot';
import Confetti from '@/components/celebrate/Confetti';
import useProgress from '@/hooks/useProgress';
import { markStage } from '@/lib/todayLoop';
import { track } from '@/lib/analytics';

const FOUR_BUTTONS_KEY = 'studyFourButtons';

const SessionDone = ({ reviewed, got, streak }) => {
    const pct = reviewed ? Math.round((got / reviewed) * 100) : 0;
    const days = streak ? (streak.activeToday ? streak.current : streak.current + 1) : null;
    return (
        <div className={studyStyles.done}>
            <Confetti />
            <Mascot pose="cheer" size={150} motion="hop" className={studyStyles.doneMascot} />
            <h1 className={studyStyles.doneTitle}>Review complete!</h1>
            <p className={studyStyles.doneLede}>Every word you saw today comes back right before you would forget it.</p>
            <div className={studyStyles.tiles}>
                <div className={studyStyles.tileKeep}><span>Reviewed</span><b>{reviewed}</b></div>
                <div className={studyStyles.tileFlame}><span>Streak</span><b>{days ? `${days} ${days === 1 ? 'day' : 'days'}` : '—'}</b></div>
                <div className={studyStyles.tileUnd}><span>Got it</span><b>{pct}%</b></div>
            </div>
            <div className={studyStyles.doneAsk}>
                <div>
                    <strong>Keep the loop going</strong>
                    <span>Read one new sentence and save its words for tomorrow.</span>
                </div>
                <div className={studyStyles.doneActions}>
                    <Link href="/home" className={studyStyles.ghostButton}>Home</Link>
                    <Link href="/analyze" className={studyStyles.readButton}>Read a sentence</Link>
                </div>
            </div>
        </div>
    );
};

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
    const { t, supportedAnalysisLanguages } = useLanguage();
    const [studySession, setStudySession] = useState(null);

    const [currentCard, setCurrentCard] = useState(null);
    const [showAnswer, setShowAnswer] = useState(false);
    // Rating saves run in the background (chained in order) so they never
    // block revealing the next card.
    const saveQueueRef = useRef(Promise.resolve());
    // Synchronous guard so a double click / key repeat can't rate twice
    // before React re-renders.
    const ratingLockRef = useRef(false);
    const [cardIndex, setCardIndex] = useState(0);
    const [muted, setMuted] = useState(false);
    const [audioError, setAudioError] = useState(false);
    
    // Enhanced state for better UX
    const [cardFlipping, setCardFlipping] = useState(false);
    const [showCelebration, setShowCelebration] = useState(false);
    const [ratingInProgress, setRatingInProgress] = useState(null);
    const [reviewed, setReviewed] = useState(0);
    const [got, setGot] = useState(0);
    const [fourButtons, setFourButtons] = useState(false);
    const initialTotal = useRef(0);
    const { progress } = useProgress(isAuthenticated && reviewed > 0 && studySession?.cards?.length === 0);
    const sessionDone = reviewed > 0 && studySession?.cards?.length === 0;
    useEffect(() => {
        if (sessionDone) track('review_done', { cards: reviewed });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [sessionDone]);

    useEffect(() => {
        try { setFourButtons(localStorage.getItem(FOUR_BUTTONS_KEY) === '1'); } catch { /* storage off */ }
    }, []);

    const toggleFourButtons = () => {
        setFourButtons(prev => {
            try { localStorage.setItem(FOUR_BUTTONS_KEY, prev ? '0' : '1'); } catch { /* storage off */ }
            return !prev;
        });
    };
    
    // Reset showAnswer when currentCard changes
    useEffect(() => {
        setShowAnswer(false);
        setCardFlipping(false);
        setShowCelebration(false);
        setRatingInProgress(null);
        ratingLockRef.current = false;
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
    
    const capitalize = (str) => {   
        return str.charAt(0).toUpperCase() + str.slice(1);
    }

    useEffect(() => {
        if(!!deck) {
            document.title = t('cards.studyPageTitle').replace('{language}', capitalize(supportedAnalysisLanguages[deck.language]) || 'Unknown');
        }
    }, [deck, t]);

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
                initialTotal.current = studyData.studySession?.cards?.length || 0;
                
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
            
            // Handle show answer with space or enter
            if (!showAnswer && (e.key === ' ' || e.key === 'Enter')) {
                e.preventDefault(); // Prevent page scrolling on space
                handleShowAnswer();
                return;
            }
            
            // Handle rating with number keys 1-4
            if (showAnswer && !fourButtons) {
                if (e.key === '1') handleCardRating('again');
                if (e.key === '2') handleCardRating('good');
                return;
            }
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
    }, [showAnswer, currentCard, cardFlipping, fourButtons]);

    const flipTimerRef = useRef(null);
    useEffect(() => () => clearTimeout(flipTimerRef.current), []);

    const handleShowAnswer = () => {
        if (cardFlipping) return;
        setCardFlipping(true);
        clearTimeout(flipTimerRef.current);
        // Small delay to sync with animation
        flipTimerRef.current = setTimeout(() => {
            setShowAnswer(true);
            setCardFlipping(false);
        }, 150);
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
        if (!currentCard || ratingLockRef.current) return;
        ratingLockRef.current = true;

        try {
            setRatingInProgress(rating);
            setReviewed(n => n + 1);
            if (rating !== 'again') setGot(n => n + 1);
            markStage('review');

            // Show celebration for good/easy ratings
            if (rating === 'good' || rating === 'easy') {
                setShowCelebration(true);
                setTimeout(() => setShowCelebration(false), 800);
            }

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
            
            // Persist in the background. The session manager has already
            // advanced to the next card locally, so the UI must not wait on
            // this request (previously the Show Answer button stayed disabled
            // until the POST finished, making it seem unresponsive).
            // Saves are chained so they reach the server in order.
            const body = JSON.stringify({
                flashcardId: currentCard.flashcardId,
                updatedCardState: completeCardState
            });
            saveQueueRef.current = saveQueueRef.current.then(async () => {
                try {
                    const response = await fetch(`/api/decks/${deckId}/study`, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body,
                    });
                    const data = await response.json();
                    if (!data.success) {
                        console.error('Error updating card:', data.error);
                        setError(t('cards.study.errorUpdating'));
                    }
                } catch (err) {
                    console.error('Error saving card rating:', err);
                    setError(t('cards.study.errorUpdating'));
                }
            });
        } catch (err) {
            console.error('Error rating card:', err);
            setError(t('cards.study.errorUpdating'));
            setRatingInProgress(null);
            ratingLockRef.current = false;
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
    
    const remaining = studySession?.cards?.length || 0;
    const total = Math.max(initialTotal.current, remaining, 1);
    const pctDone = Math.round(((total - remaining) / total) * 100);

    const renderContent = () => {
        if (loadingContent) {
            return <p className={studyStyles.loading}>{t('cards.loading')}</p>;
        }

        if (error) {
            return <p className={studyStyles.error}>{error}</p>;
        }

        if (!deck) {
            return <p className={studyStyles.error}>{t('cards.deckNotFound')}</p>;
        }

        if (!studySession || !studySession.cards || studySession.cards.length === 0) {
            if (reviewed > 0) {
                return <SessionDone reviewed={reviewed} got={got} streak={progress?.streak} />;
            }
            return (
                <div className={studyStyles.emptyState}>
                    <Mascot pose="sleep" size={120} />
                    <h2>Nothing to review right now</h2>
                    <p>{t('cards.study.finishedStudying')}</p>
                    <div className={studyStyles.doneActions}>
                        <button type="button" className={studyStyles.ghostButton} onClick={handleBackClick}>Back to deck</button>
                        <Link href="/analyze" className={studyStyles.readButton}>Read a sentence</Link>
                    </div>
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
                <div className={studyStyles.rhead}>
                    <button
                        type="button"
                        className={studyStyles.iconButton}
                        onClick={handleBackClick}
                        aria-label={t('common.back')}
                    >
                        <MaterialSymbolsArrowBackRounded />
                    </button>
                    <div
                        className={studyStyles.prog}
                        role="progressbar"
                        aria-label="Session progress"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={pctDone}
                    >
                        <i style={{ width: `${Math.max(pctDone, 3)}%` }} />
                    </div>
                    <span className={studyStyles.left}>{remaining} left</span>
                    <button
                        type="button"
                        className={studyStyles.iconButton}
                        onClick={handleToggleMute}
                        aria-label={muted ? t('cards.study.unmute') : t('cards.study.mute')}
                    >
                        {muted ? <MaterialSymbolsVolumeOff /> : <MaterialSymbolsVolumeUp />}
                    </button>
                </div>

                {/* Hidden audio player */}
                {currentCard && currentCard.audioUrl && (
                    <audio 
                        ref={audioRef} 
                        src={currentCard.audioUrl} 
                        preload="auto"
                        onError={(e) => {
                            console.error('Audio element error:', e);
                            setAudioError(true);
                        }}
                    />
                )}

                <div className={studyStyles.cardOuter}>
                    <div
                        className={`${studyStyles.flip} ${showAnswer ? studyStyles.flipped : ''} ${showCelebration ? studyStyles.celebration : ''}`}
                        onClick={() => { if (!showAnswer) handleShowAnswer(); }}
                    >
                        <div className={`${studyStyles.face} ${studyStyles.front}`} aria-hidden={showAnswer}>
                            <span className={studyStyles.faceLabel}>What does this mean?</span>
                            <p className={`${studyStyles.bigWord} ${cardLanguage} ${getFontClass(deck.language)}`} lang={cardLanguage}>{question}</p>
                            <span className={studyStyles.tapHint}>Tap the card or press space</span>
                        </div>
                        <div className={`${studyStyles.face} ${studyStyles.back}`} aria-hidden={!showAnswer}>
                            <p className={`${studyStyles.smallWord} ${getFontClass(deck.language)}`} lang={cardLanguage}>{question}</p>
                            <div className={studyStyles.answerRow}>
                                <p className={studyStyles.answerText} lang="en">{answer}</p>
                                {currentCard.audioUrl && !audioError && (
                                    <button 
                                        type="button"
                                        className={studyStyles.playAudioButton}
                                        onClick={(e) => { e.stopPropagation(); handlePlayAudio(); }}
                                        aria-label={t('cards.study.playAudio')}
                                    >
                                        <MaterialSymbolsVolumeUp />
                                    </button>
                                )}
                            </div>
                            {currentCard.contentType === 'word' && (
                                <SourceSentence source={currentCard.source} language={cardLanguage} />
                            )}
                        </div>
                    </div>
                </div>

                <div className={studyStyles.studyControls}>
                    {showAnswer ? (
                        fourButtons ? (
                            <div className={studyStyles.grade4}>
                                {[['again', 'again'], ['hard', 'hard'], ['good', 'good'], ['easy', 'easy']].map(([rating, key], i) => (
                                    <button
                                        key={rating}
                                        type="button"
                                        className={`${studyStyles.gradeButton} ${studyStyles[`g_${rating}`]} ${ratingInProgress === rating ? studyStyles.processing : ''}`}
                                        onClick={() => handleCardRating(rating)}
                                        disabled={ratingInProgress !== null}
                                    >
                                        {t(`cards.study.${key}`)} <kbd>{i + 1}</kbd>
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className={studyStyles.grade}>
                                <button
                                    type="button"
                                    className={`${studyStyles.gradeButton} ${studyStyles.g_again}`}
                                    onClick={() => handleCardRating('again')}
                                    disabled={ratingInProgress !== null}
                                >
                                    Missed it <kbd>1</kbd>
                                </button>
                                <button
                                    type="button"
                                    className={`${studyStyles.gradeButton} ${studyStyles.g_good}`}
                                    onClick={() => handleCardRating('good')}
                                    disabled={ratingInProgress !== null}
                                >
                                    Got it <kbd>2</kbd>
                                </button>
                            </div>
                        )
                    ) : (
                        <button 
                            type="button"
                            className={studyStyles.showAnswerButton}
                            onClick={handleShowAnswer}
                            disabled={cardFlipping}
                        >
                            {t('cards.study.showAnswer')}
                        </button>
                    )}
                    <button type="button" className={studyStyles.modeNote} onClick={toggleFourButtons}>
                        {fourButtons ? 'Prefer two buttons? Switch to Missed it / Got it.' : 'Prefer Again, Hard, Good and Easy? Switch to four buttons.'}
                    </button>
                </div>
            </div>
        );
    };

    // Don't render while main auth is loading
    if (loading || !isAuthenticated) return null;
    if (!deck && loadingContent) return null;

    return (
        <Dashboard>
            <div className={studyStyles.studyContent}>
                {renderContent()}
            </div>
        </Dashboard>
    );
};

export default StudyView; 