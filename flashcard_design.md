# Spaced Repetition Flashcard System Design Document

## 1. Overview

The spaced repetition flashcard system will enhance the application by allowing users to systematically review saved words and sentences. This system will implement proven memory retention techniques by automatically scheduling reviews based on user performance, optimizing the learning process.

## 2. Core Components

### 2.1 Flashcard Types
- **Word Flashcards**: Based on saved words in the user's collection
- **Sentence Flashcards**: Based on saved sentences in the user's collection
- **Grammar Pattern Flashcards**: Based on grammar patterns encountered in analyzed sentences

### 2.2 Spaced Repetition Algorithm
We will implement the SuperMemo SM-2 algorithm, which is widely used in spaced repetition systems:

- Each card has an **ease factor** (EF) starting at 2.5
- After each review, the user rates their recall from 0-5
- Based on the rating, the ease factor is adjusted
- The next review interval is calculated using the ease factor
- Intervals increase exponentially for well-remembered items

### 2.3 Review Process
1. User is presented with a flashcard (front side)
2. User attempts to recall the information
3. User reveals the answer (back side)
4. User self-rates their recall performance (0-5)
5. System calculates the next review date
6. System presents the next due card

## 3. Database Schema Design

### 3.1 Flashcards Collection
```javascript
flashcards: {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["flashcardId", "userId", "contentType", "contentId", "dateCreated", "nextReviewDate", "reviewHistory"],
      properties: {
        flashcardId: {
          bsonType: "int"
        },
        userId: {
          bsonType: "int"
        },
        contentType: {
          bsonType: "string",
          description: "Type of content: 'word', 'sentence', or 'grammar'"
        },
        contentId: {
          bsonType: "int",
          description: "ID of the word, sentence, or grammar pattern"
        },
        dateCreated: {
          bsonType: "date"
        },
        nextReviewDate: {
          bsonType: "date",
          description: "When this card should next be reviewed"
        },
        interval: {
          bsonType: "int",
          description: "Current interval in days between reviews"
        },
        easeFactor: {
          bsonType: "double",
          description: "Ease factor for the SM-2 algorithm (default: 2.5)"
        },
        reviewHistory: {
          bsonType: "array",
          items: {
            bsonType: "object",
            required: ["date", "rating", "timeTaken"],
            properties: {
              date: {
                bsonType: "date"
              },
              rating: {
                bsonType: "int",
                description: "User's self-rating of recall (0-5)"
              },
              timeTaken: {
                bsonType: "int",
                description: "Time in milliseconds to complete the review"
              },
              interval: {
                bsonType: "int",
                description: "Interval set after this review"
              }
            }
          }
        },
        suspended: {
          bsonType: ["bool", "null"],
          description: "Whether the card is temporarily suspended from reviews"
        },
        customFront: {
          bsonType: ["string", "null"],
          description: "Custom front side content (overrides default)"
        },
        customBack: {
          bsonType: ["string", "null"],
          description: "Custom back side content (overrides default)"
        },
        tags: {
          bsonType: ["array", "null"],
          items: {
            bsonType: "string"
          }
        },
        repetitionNumber: {
          bsonType: "int",
          description: "Number of successful reviews of this card"
        },
        lapses: {
          bsonType: "int",
          description: "Number of times the card was rated < 3"
        },
        reviewState: {
          bsonType: "string",
          enum: ["new", "learning", "review", "relearning"],
          description: "Current state in spaced repetition system"
        },
        createdBy: {
          bsonType: "string",
          description: "Application component that created this card"
        }
      }
    }
  },
  indexes: [
    {
      key: { userId: 1, nextReviewDate: 1 },
      name: "user_review_index"
    },
    {
      key: { userId: 1, contentType: 1, contentId: 1 },
      unique: true,
      name: "unique_content_index"
    }
  ]
}
```

### 3.2 Flashcard Decks Collection
```javascript
flashcard_decks: {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["deckId", "userId", "name", "dateCreated"],
      properties: {
        deckId: {
          bsonType: "int"
        },
        userId: {
          bsonType: "int"
        },
        name: {
          bsonType: "string"
        },
        description: {
          bsonType: ["string", "null"]
        },
        dateCreated: {
          bsonType: "date"
        },
        lastReviewed: {
          bsonType: ["date", "null"]
        },
        settings: {
          bsonType: ["object", "null"],
          properties: {
            newCardsPerDay: {
              bsonType: "int",
              description: "Maximum new cards to show per day"
            },
            reviewsPerDay: {
              bsonType: "int",
              description: "Maximum reviews to show per day"
            },
            learningSteps: {
              bsonType: "array",
              items: {
                bsonType: "int",
                description: "Minutes between learning steps"
              }
            }
          }
        }
      }
    }
  },
  indexes: [
    {
      key: { userId: 1 },
      name: "user_index"
    }
  ]
}
```

### 3.3 Deck Membership Collection
```javascript
deck_cards: {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      required: ["deckId", "flashcardId"],
      properties: {
        deckId: {
          bsonType: "int"
        },
        flashcardId: {
          bsonType: "int"
        },
        dateAdded: {
          bsonType: "date"
        }
      }
    }
  },
  indexes: [
    {
      key: { deckId: 1, flashcardId: 1 },
      unique: true
    }
  ]
}
```

## 4. API Endpoints

### 4.1 Flashcard Management
- `GET /api/flashcards` - Get all flashcards for the current user
- `POST /api/flashcards` - Create a new flashcard
- `GET /api/flashcards/:flashcardId` - Get a specific flashcard
- `PUT /api/flashcards/:flashcardId` - Update a flashcard
- `DELETE /api/flashcards/:flashcardId` - Delete a flashcard
- `POST /api/flashcards/bulk-create` - Create multiple flashcards at once

### 4.2 Deck Management
- `GET /api/decks` - Get all decks for the current user
- `POST /api/decks` - Create a new deck
- `GET /api/decks/:deckId` - Get a specific deck
- `PUT /api/decks/:deckId` - Update a deck
- `DELETE /api/decks/:deckId` - Delete a deck
- `GET /api/decks/:deckId/cards` - Get all cards in a deck
- `POST /api/decks/:deckId/cards` - Add cards to a deck
- `DELETE /api/decks/:deckId/cards/:flashcardId` - Remove a card from a deck

### 4.3 Review Process
- `GET /api/review` - Get next cards due for review
- `POST /api/review/:flashcardId` - Submit a review for a card
- `GET /api/stats` - Get review statistics

## 5. Frontend Components

### 5.1 Flashcard Creation
- Automatic creation when saving words/sentences
- Manual creation interface
- Bulk import option

### 5.2 Deck Management
- Create/edit/delete decks
- Add/remove cards from decks
- Set deck options (new cards per day, etc.)

### 5.3 Review Interface
- Card display with front/back sides
- Self-rating buttons (0-5)
- Progress indicators
- Audio playback for pronunciation

### 5.4 Statistics Dashboard
- Review history
- Performance metrics
- Retention rate visualization
- Learning progress charts

## 6. Algorithm Implementation

### 6.1 SM-2 Algorithm
```
if (rating >= 3) {
  if (repetitionNumber === 0) {
    interval = 1;
  } else if (repetitionNumber === 1) {
    interval = 6;
  } else {
    interval = Math.round(interval * easeFactor);
  }
  repetitionNumber++;
} else {
  repetitionNumber = 0;
  interval = 1;
}

if (rating < 3) {
  easeFactor = Math.max(1.3, easeFactor - 0.2);
} else {
  easeFactor = easeFactor + (0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
}

nextReviewDate = today + interval days
```

## 7. User Experience Considerations

### 7.1 Gamification Elements
- Streaks for daily reviews
- Achievement badges
- Level-up system based on cards mastered
- Optional competitive leaderboards

### 7.2 Learning Optimizations
- Prioritize difficult cards
- Detect leeches (cards that are repeatedly forgotten)
- Optimize review times based on user performance patterns
- Support for different card templates (recognition, recall, etc.)

### 7.3 Accessibility Features
- Keyboard shortcuts
- High contrast mode
- Adjustable font sizes
- Screen reader compatibility

## 8. Tier-Based Features

### 8.1 Free Tier
- Limited to 100 active flashcards
- Basic spaced repetition
- Single default deck

### 8.2 Basic Tier
- Up to 1,000 active flashcards
- Multiple custom decks
- Basic statistics

### 8.3 Plus Tier
- Unlimited flashcards
- Advanced statistics and analytics
- Custom card templates
- Priority review scheduling
- Export/import functionality

## 9. Implementation Phases

### Phase 1: Core Functionality
- Database schema implementation
- Basic API endpoints
- Simple review interface
- Default flashcard creation from saved words/sentences

### Phase 2: Enhanced Features
- Custom decks
- Statistics dashboard
- Improved algorithm with learning steps
- Mobile-optimized review interface

### Phase 3: Advanced Features
- Gamification elements
- Advanced analytics
- Offline review capability
- Synchronization across devices

## 10. Technical Considerations

### 10.1 Performance Optimization
- Batch processing for due card calculations
- Caching frequently accessed deck information
- Efficient indexing for review queries

### 10.2 Scalability
- Sharding strategy for large flashcard collections
- Distributed processing for review calculations
- Rate limiting for API endpoints

### 10.3 Data Integrity
- Transaction handling for review submissions
- Backup and recovery procedures
- Conflict resolution for simultaneous edits

## 11. Integration with Existing Features

### 11.1 Word Saving
- Automatic flashcard creation when saving words
- Option to choose destination deck

### 11.2 Sentence Saving
- Automatic flashcard creation when saving sentences
- Options for creating multiple cards from one sentence

### 11.3 Audio Generation
- Integrate existing TTS functionality with flashcard review
- Cache audio for offline review

## 12. Testing Strategy

### 12.1 Unit Testing
- Algorithm correctness
- Database operations
- API endpoint functionality

### 12.2 Integration Testing
- End-to-end review process
- Synchronization between components
- Performance under load

### 12.3 User Testing
- Usability studies
- Retention effectiveness
- User satisfaction metrics

## 13. Monitoring and Analytics

### 13.1 System Metrics
- API response times
- Database query performance
- Error rates and types

### 13.2 Learning Metrics
- User retention rates
- Average review performance
- Learning curve analysis

## 14. Future Enhancements

### 14.1 Machine Learning
- Personalized difficulty prediction
- Optimal review time prediction
- Content recommendation based on performance

### 14.2 Social Features
- Shared decks
- Collaborative learning
- Mentor/student relationships

### 14.3 Content Expansion
- Grammar pattern flashcards
- Pronunciation-focused cards
- Cultural context cards 