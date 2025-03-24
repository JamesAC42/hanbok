/**
 * studySessionManager.js
 * Handles the client-side logic for spaced repetition flashcard study sessions.
 * This file implements SuperMemo 2 (SM-2) algorithm similar to Anki.
 */

/**
 * Manages the state of the current study session
 * - Handles card progression and ordering
 * - Applies spaced repetition algorithm (SM-2)
 * - Manages the complete review process
 */
export class StudySessionManager {
    constructor(initialSession) {
        this.session = initialSession;
        this.cardIndex = 0;
        this.currentCard = null;
        this.updateCallback = null;
        this.deckId = null;
        this.deckSettings = null;
    }

    /**
     * Initialize the study session with data from the server
     * @param {Object} sessionData - The session data from the API
     * @param {Function} updateCallback - Function to call when session state changes
     * @param {Object} deckSettings - The deck settings
     */
    initialize(sessionData, updateCallback, deckSettings) {
        this.session = sessionData;
        this.updateCallback = updateCallback;
        this.cardIndex = 0;
        this.deckSettings = deckSettings || {
            steps: [1, 10, 60, 1440], // Default steps in minutes
            newCardsPerDay: 20,
            reviewsPerDay: 100
        };

        if (sessionData && sessionData.deckId) {
            this.deckId = sessionData.deckId;
        }

        if (this.hasCards()) {
            this.currentCard = this.session.cards[0];
        }

        return this.currentCard;
    }

    /**
     * Check if there are any cards to study
     * @returns {boolean} True if there are cards to study
     */
    hasCards() {
        return this.session && this.session.cards && this.session.cards.length > 0;
    }

    /**
     * Get the current card being studied
     * @returns {Object|null} The current card or null if no cards
     */
    getCurrentCard() {
        return this.currentCard;
    }

    /**
     * Get the session statistics
     * @returns {Object} The session statistics
     */
    getStats() {
        if (!this.session || !this.session.stats) {
            return { new: 0, learning: 0, due: 0, total: 0 };
        }
        return this.session.stats;
    }

    /**
     * Move to the next card in the session
     * @returns {Object|null} The next card or null if no more cards
     */
    nextCard() {
        if (!this.hasCards()) return null;

        this.cardIndex = (this.cardIndex + 1) % this.session.cards.length;
        this.currentCard = this.session.cards[this.cardIndex];

        if (this.updateCallback) {
            this.updateCallback({
                currentCard: this.currentCard,
                cardIndex: this.cardIndex
            });
        }

        return this.currentCard;
    }

    /**
     * Update the session with new data from the server
     * @param {Object} updatedSession - The updated session data from the API
     * @returns {Object|null} The next card to study
     */
    updateSession(updatedSession) {
        this.session = updatedSession;
        this.cardIndex = 0;

        if (this.hasCards()) {
            this.currentCard = this.session.cards[0];
        } else {
            this.currentCard = null;
        }

        if (this.updateCallback) {
            this.updateCallback({
                currentCard: this.currentCard,
                cardIndex: this.cardIndex,
                sessionUpdated: true
            });
        }

        return this.currentCard;
    }

    /**
     * Process a card rating and update its state according to SM-2
     * @param {string} rating - Rating (again, hard, good, easy)
     * @returns {Object} The updated card state
     */
    rateCard(rating) {
        if (!this.currentCard) return null;

        const now = new Date();
        // Make a shallow copy of the card to avoid modifying the original
        const card = { ...this.currentCard };
        const learningSteps = this.deckSettings?.steps || [1, 10, 60, 1440];

        // Add logging to see the incoming state
        console.log(`[rateCard] Rating ${rating} for card ${card.flashcardId}. Current state:`, {
            reviewState: card.reviewState || 'new',
            stepIndex: card.stepIndex || 0,
            repetitionNumber: card.repetitionNumber || 0,
            easeFactor: card.easeFactor || 2.5,
            intervalDays: card.intervalDays || 0,
            lapses: card.lapses || 0
        });

        const currentState = card.reviewState || 'new';
        const repetitionNumber = card.repetitionNumber || 0;
        const easeFactor = card.easeFactor || 2.5;
        const lapses = card.lapses || 0;
        const reviewCount = (card.reviewCount || 0) + 1;

        let sm2Grade;
        switch (rating) {
            case 'again': sm2Grade = 1; break;
            case 'hard': sm2Grade = 2; break;
            case 'good': sm2Grade = 3; break;
            case 'easy': sm2Grade = 4; break;
            default: sm2Grade = 1;
        }

        const updatedCard = {
            flashcardId: card.flashcardId,
            userId: card.userId,
            contentType: card.contentType,
            contentId: card.contentId,
            intervalDays: card.intervalDays || 0,
            easeFactor: easeFactor,
            reviewCount: reviewCount,
            dateCreated: card.dateCreated,
            reviewHistory: card.reviewHistory || [],
            createdBy: card.createdBy || 'web_app',
            suspended: card.suspended || false,
            tags: card.tags || [],
            content: card.content,
            audioUrl: card.audioUrl,
            audioId: card.audioId,
            repetitionNumber: repetitionNumber,
            reviewState: card.reviewState,
            nextReviewDate: card.nextReviewDate,
            lapses: lapses
        };

        const reviewHistoryEntry = {
            date: now,
            rating: sm2Grade,
            timeTaken: 0,
            intervalDays: updatedCard.intervalDays || 0
        };

        updatedCard.reviewHistory = [...(updatedCard.reviewHistory || []), reviewHistoryEntry];
        updatedCard.lastReviewed = now.toISOString();

        // reviewState
        // intervalDays
        // easefactor
        // nextReviewDate
        // repetitionNumber
        // lapses

        if (rating === 'again' || rating === 'hard') {

            if (card.reviewState === 'review') {
                updatedCard.reviewState = 'relearning';
            } else {
                updatedCard.reviewState = 'learning';
            }

            updatedCard.intervalDays = 0;
            if (rating === 'again') {
                updatedCard.nextReviewDate = new Date(now.getTime() + learningSteps[0] * 60000).toISOString();
            }
            else {
                updatedCard.nextReviewDate = new Date(now.getTime() + learningSteps[1] * 60000).toISOString();
            }

            if (rating === 'again' && currentState === 'review') {
                updatedCard.lapses = (lapses || 0) + 1;
            } else {
                updatedCard.lapses = lapses || 0;
            }

            updatedCard.repetitionNumber = 0;
        }
        else if (rating === 'good' || rating === 'easy') {
            
            updatedCard.reviewState = 'review';
            if (updatedCard.repetitionNumber === 0) {
                updatedCard.intervalDays = 1;
            } else if (updatedCard.repetitionNumber === 1) {
                updatedCard.intervalDays = 6;
            } else {
                updatedCard.intervalDays = Math.round(updatedCard.intervalDays * updatedCard.easeFactor);
            }

            updatedCard.nextReviewDate = new Date(now.getTime() + (Math.floor(updatedCard.intervalDays) * 24 * 60 * 60 * 1000)).toISOString();

            updatedCard.repetitionNumber = repetitionNumber + 1;
        }

        updatedCard.easeFactor = easeFactor + (0.1 - (5 - sm2Grade) * (0.08 + (5 - sm2Grade) * 0.02));
        if (updatedCard.easeFactor < 1.3) updatedCard.easeFactor = 1.3; // Minimum ease factor

        updatedCard.stepIndex = null;

        // Log the final state of the card before returning
        console.log(`[rateCard] Final card state:`, {
            flashcardId: updatedCard.flashcardId,
            reviewState: updatedCard.reviewState,
            intervalDays: updatedCard.intervalDays,
            nextReviewDate: updatedCard.nextReviewDate,
            easeFactor: updatedCard.easeFactor,
            repetitionNumber: updatedCard.repetitionNumber,
            lapses: updatedCard.lapses
        });

        return updatedCard;
    }

    /**
     * Handle card rating and update the session
     * This updates the card locally and removes it from the session if needed
     * @param {string} rating - Rating (again, hard, good, easy)
     * @returns {Object} Updated card
     */
    handleCardRating(rating) {
        if (!this.currentCard) return null;

        try {
            console.log(`[handleCardRating] Processing rating '${rating}' for card ${this.currentCard.flashcardId}`);

            // Calculate the new card state based on the simplified algorithm
            const updatedCard = this.rateCard(rating);
            if (!updatedCard) return null;

            // Log the updated card before session handling
            console.log(`[handleCardRating] Card after rateCard:`, {
                flashcardId: updatedCard.flashcardId,
                reviewState: updatedCard.reviewState,
                intervalDays: updatedCard.intervalDays,
                nextReviewDate: updatedCard.nextReviewDate
            });

            // Make sure we have a valid session with cards
            if (!this.session || !this.session.cards || !Array.isArray(this.session.cards)) {
                console.error('Invalid session state in handleCardRating');
                return updatedCard;
            }

            // Make a copy of the session cards
            const sessionCards = [...this.session.cards];

            // Validate card index
            if (this.cardIndex < 0 || this.cardIndex >= sessionCards.length) {
                console.error(`Invalid card index ${this.cardIndex} (total cards: ${sessionCards.length})`);
                // Correct the index if it's out of bounds
                this.cardIndex = Math.max(0, Math.min(this.cardIndex, sessionCards.length - 1));
            }

            // Remove the current card from the session
            sessionCards.splice(this.cardIndex, 1);

            // SIMPLIFIED SESSION HANDLING:
            // - For "again" and "hard" ratings: Keep card in session
            // - For "good" and "easy" ratings: Remove card from session (graduate to review)

            if (rating === 'again' || rating === 'hard') {
                // Determine position for reinsertion
                let reinsertPosition;

                if (rating === 'again') {
                    // For "again" rating, put the card a few positions later (2-4 cards later)
                    reinsertPosition = Math.min(Math.floor(Math.random() * 3) + 2, sessionCards.length);
                } else { // 'hard'
                    // For "hard" rating, put the card further back (4-7 cards later)
                    reinsertPosition = Math.min(Math.floor(Math.random() * 4) + 4, sessionCards.length);
                }

                // Reinsert the card
                console.log(`[handleCardRating] Reinserting card at position ${reinsertPosition} (out of ${sessionCards.length} cards)`);
                sessionCards.splice(reinsertPosition, 0, updatedCard);
            } else {
                // For "good" and "easy" ratings, the card is not reinserted (it leaves the session)
                console.log(`[handleCardRating] Card not reinserted: graduated to review with interval of ${updatedCard.intervalDays} days`);
            }

            // Update the session with the new card order
            this.session = {
                ...this.session,
                cards: sessionCards
            };

            // If there are no more cards, current card becomes null
            if (sessionCards.length === 0) {
                this.currentCard = null;
                this.cardIndex = 0;
            }
            // Otherwise set the current card to the card at the current index (which is now the next card)
            else {
                // Make sure the index is within bounds
                this.cardIndex = Math.min(this.cardIndex, sessionCards.length - 1);
                this.currentCard = sessionCards[this.cardIndex];
            }

            // Update stats
            this.updateSessionStats();

            // Log the final card state before sending to the callback
            console.log(`[handleCardRating] Final card state before callback:`, {
                flashcardId: updatedCard.flashcardId,
                reviewState: updatedCard.reviewState,
                intervalDays: updatedCard.intervalDays,
                nextReviewDate: updatedCard.nextReviewDate,
                cardsRemaining: sessionCards.length
            });

            // Notify about the update
            if (this.updateCallback) {
                this.updateCallback({
                    currentCard: this.currentCard,
                    cardIndex: this.cardIndex,
                    updatedCard: updatedCard,
                    sessionUpdated: true
                });
            }

            return updatedCard;
        } catch (err) {
            console.error('Error in handleCardRating:', err);
            // If something goes wrong, return the original card to avoid losing progress
            return this.currentCard;
        }
    }

    /**
     * Update the session statistics based on current cards
     */
    updateSessionStats() {
        if (!this.session || !this.session.cards) return;

        const cards = this.session.cards;
        const newCards = cards.filter(card => card.reviewState === 'new').length;
        const learningCards = cards.filter(card =>
            card.reviewState === 'learning' || card.reviewState === 'relearning'
        ).length;
        const dueCards = cards.filter(card =>
            card.reviewState === 'review' && new Date(card.nextReviewDate) <= new Date()
        ).length;

        this.session.stats = {
            new: newCards,
            learning: learningCards,
            due: dueCards,
            total: cards.length
        };
    }

    /**
     * Format a time interval for display
     * @param {number} minutes - Time interval in minutes
     * @returns {string} Formatted time interval
     */
    formatTimeInterval(minutes) {
        if (minutes < 60) {
            return `${minutes}m`;
        } else if (minutes < 24 * 60) {
            return `${Math.floor(minutes / 60)}h`;
        } else {
            return `${Math.floor(minutes / (24 * 60))}d`;
        }
    }
}

// Export a singleton instance
const studySessionManager = new StudySessionManager(null);
export default studySessionManager; 