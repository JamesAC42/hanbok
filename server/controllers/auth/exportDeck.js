const { getDb } = require('../../database');

/**
 * Exports a deck's flashcards in Anki-compatible text format
 * @param {Object} req - Express request object
 * @param {Object} res - Express response object
 */
const exportDeck = async (req, res) => {
    try {
        const deckId = parseInt(req.params.deckId);
        const userId = req.session.user.userId;
        const db = getDb();

        // Validate deckId
        if (!deckId || isNaN(deckId)) {
            return res.status(400).json({
                success: false,
                error: 'Invalid deck ID'
            });
        }

        // Check if the deck exists and belongs to the user
        const deck = await db.collection('flashcard_decks').findOne({
            deckId,
            userId
        });

        if (!deck) {
            return res.status(404).json({
                success: false,
                error: 'Deck not found'
            });
        }

        // Get all flashcards for this deck
        // First get the flashcard IDs from the deck_cards collection
        const deckCards = await db.collection('deck_cards')
            .find({ deckId })
            .toArray();
        
        const flashcardIds = deckCards.map(card => card.flashcardId);
        
        if (flashcardIds.length === 0) {
            return res.status(404).json({
                success: false,
                error: 'No flashcards found in this deck'
            });
        }

        // Now get the actual flashcards using the IDs
        const flashcards = await db.collection('flashcards').find({
            flashcardId: { $in: flashcardIds },
            userId
        }).toArray();

        console.log(`Exporting ${flashcards.length} flashcards for deck ${deckId}`);

        // Get content for each flashcard
        // Build lists of word IDs and sentence IDs to fetch
        const wordIds = [];
        const sentenceIds = [];
        
        flashcards.forEach(card => {
            if (card.contentType === 'word' && card.contentId) {
                wordIds.push(card.contentId);
            } else if (card.contentType === 'sentence' && card.contentId) {
                sentenceIds.push(card.contentId);
            }
        });

        // Lookup content collections based on contentType
        let wordContents = [];
        let sentenceContents = [];

        if (wordIds.length > 0) {
            // Get word content
            wordContents = await db.collection('words').find({
                wordId: { $in: wordIds }
            }).toArray();
        }

        if (sentenceIds.length > 0) {
            // Get sentence content
            sentenceContents = await db.collection('sentences').find({
                sentenceId: { $in: sentenceIds }
            }).toArray();
        }

        // Create a map for quick lookup of content
        const contentMap = {};
        
        wordContents.forEach(word => {
            contentMap[word.wordId] = {
                front: word.originalWord || '',
                back: word.translatedWord || ''
            };
        });
        
        sentenceContents.forEach(sentence => {
            contentMap[sentence.sentenceId] = {
                front: sentence.originalText || '',
                back: sentence.translatedText || ''
            };
        });

        // Format data for Anki import (tab-separated values)
        // Each line: front, back, created, nextReview, interval, easeFactor, repetition, lapses, state, suspended, lastReviewed, reviewCount
        const lines = flashcards.map(card => {
            // Get content or use placeholder if content not found
            let content = { front: 'Unknown', back: 'Unknown' };
            
            if (card.contentId && contentMap[card.contentId]) {
                content = contentMap[card.contentId];
                console.log(`Found content for card ${card.flashcardId} with contentId ${card.contentId}`);
            } else if (card.content) {
                // Handle case where content is directly embedded in the card
                console.log(`Using embedded content for card ${card.flashcardId}`);
                if (card.contentType === 'word') {
                    content = {
                        front: card.content.originalWord || 'Unknown',
                        back: card.content.translatedWord || 'Unknown'
                    };
                } else if (card.contentType === 'sentence') {
                    content = {
                        front: card.content.originalText || 'Unknown',
                        back: card.content.translatedText || 'Unknown'
                    };
                }
            } else {
                console.log(`No content found for card ${card.flashcardId} (${card.contentType}, ${card.contentId})`);
            }
            
            // Format dates as Unix timestamps
            const dateCreated = card.dateCreated ? Math.floor(new Date(card.dateCreated).getTime() / 1000) : '';
            const nextReviewDate = card.nextReviewDate ? Math.floor(new Date(card.nextReviewDate).getTime() / 1000) : '';
            const lastReviewed = card.lastReviewed ? Math.floor(new Date(card.lastReviewed).getTime() / 1000) : '';
            
            // Escape any commas in content
            const escapedFront = content.front.replace(/,/g, '，'); // Use fullwidth comma
            const escapedBack = content.back.replace(/,/g, '，'); // Use fullwidth comma
            
            // Format the line with all requested fields
            return [
                escapedFront,                             // Front content
                escapedBack,                              // Back content
                dateCreated,                              // Date created as Unix timestamp
                nextReviewDate,                           // Next review date as Unix timestamp
                card.intervalDays || 0,                   // Interval days
                card.easeFactor?.toFixed(2) || 2.5,       // Ease factor
                card.repetitionNumber || 0,               // Repetition number
                card.lapses || 0,                         // Number of lapses
                card.reviewState || 'new',                // Review state
                card.suspended ? 1 : 0,                   // Suspended status (1 = suspended, 0 = not)
                lastReviewed,                             // Last reviewed date as Unix timestamp
                (card.reviewHistory?.length || 0)         // Review count
            ].join(',');
        });

        // Add header comment line to explain the format
        lines.unshift('# Front,Back,Created,NextReview,Interval,EaseFactor,Repetition,Lapses,State,Suspended,LastReviewed,ReviewCount');

        // Join lines with newlines and create the text file content
        const fileContent = lines.join('\n');

        // Set appropriate headers for a text file download
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Content-Disposition', `attachment; filename="deck_${deckId}_${deck.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}.txt"`);
        
        // Send the file content
        res.send(fileContent);

    } catch (error) {
        console.error('Error exporting deck:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to export deck'
        });
    }
};

module.exports = exportDeck; 