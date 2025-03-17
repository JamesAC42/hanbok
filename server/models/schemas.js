const collections = {
  users: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["email", "userId", "name", "googleId", "tier", "remainingAudioGenerations"],
        properties: {
          userId: {
            bsonType: "int"
          },
          name: {
            bsonType: "string"
          },
          email: {
            bsonType: "string",
            pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
          },
          googleId: {
            bsonType: "string"
          },
          tier: {
            bsonType: "int",
            description: "User tier: 0 for free, 1 for basic, 2 for plus"
          },
          remainingAudioGenerations: {
            bsonType: ["int", "null"],
            description: "Remaining audio generations available for the user"
          },
          remainingImageExtracts: {
            bsonType: ["int", "null"],
            description: "Remaining image extracts available for the user"
          },
          feedbackAudioCreditRedeemed: {
            bsonType: ["bool", "null"],
            description: "Whether user has redeemed their feedback audio credit bonus"
          },
          maxSavedSentences: {
            bsonType: ["int", "null"],
            description: "Maximum number of sentences user can save (for tier 0)"
          },
          maxSavedWords: {
            bsonType: ["int", "null"],
            description: "Maximum number of words user can save (for tier 0)"
          },
          dateCreated: {
            bsonType: "date"
          },
          purchases: {
            bsonType: ["object", "null"],
            properties: {
              basicUpgrade: {
                bsonType: ["object", "null"],
                properties: {
                  purchaseDate: { bsonType: "date" },
                  sessionId: { bsonType: "string" }
                }
              },
              audioPacks: {
                bsonType: ["array", "null"],
                items: {
                  bsonType: "object",
                  properties: {
                    purchaseDate: { bsonType: "date" },
                    sessionId: { bsonType: "string" },
                    amount: { bsonType: "int" }
                  }
                }
              }
            }
          },
          subscription: {
            bsonType: ["object", "null"],
            properties: {
              status: { bsonType: "string" },
              startDate: { bsonType: "date" },
              endDate: { bsonType: ["date", "null"] },
              stripeSubscriptionId: { bsonType: "string" },
              customerId: { bsonType: "string" }
            },
            required: ["status", "startDate"]
          }
        }
      }
    }
  },
  sentences: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["sentenceId", "text", "analysis", "dateCreated", "originalLanguage", "translationLanguage"],
        properties: {
          sentenceId: {
            bsonType: "int"
          },
          userId: {
            bsonType: ["int", "null"]
          },
          text: {
            bsonType: "string"
          },
          analysis: {
            bsonType: "object"
          },
          voice1: {
            bsonType: ["string", "null"],
            description: "S3 presigned URL for voice 1 audio"
          },
          voice2: {
            bsonType: ["string", "null"],
            description: "S3 presigned URL for voice 2 audio"
          },
          dateCreated: {
            bsonType: "date"
          },
          originalLanguage: {
            bsonType: "string",
            description: "Language code for the original text (e.g. 'ko', 'en')"
          },
          translationLanguage: {
            bsonType: "string",
            description: "Language code for the translation (e.g. 'en', 'ko')"
          }
        }
      }
    }
  },
  savedSentences: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["userId", "sentenceId", "dateSaved"],
        properties: {
          userId: {
            bsonType: "int"
          },
          sentenceId: {
            bsonType: "int"
          },
          dateSaved: {
            bsonType: "date"
          }
        }
      }
    },
    indexes: [
      {
        key: { userId: 1, sentenceId: 1 },
        unique: true
      }
    ]
  },
  words: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["wordId", "userId", "originalLanguage", "originalWord", "translationLanguage", "translatedWord", "dateSaved"],
        properties: {
          wordId: {
            bsonType: "int"
          },
          userId: {
            bsonType: "int"
          },
          originalLanguage: {
            bsonType: "string"
          },
          originalWord: {
            bsonType: "string"
          },
          translationLanguage: {
            bsonType: "string"
          },
          translatedWord: {
            bsonType: "string"
          },
          reading: {
            bsonType: ["string", "null"]
          },
          dateSaved: {
            bsonType: "date"
          }
        }
      }
    },
    indexes: [
      {
        key: { userId: 1, originalLanguage: 1, originalWord: 1 },
        unique: true
      }
    ]
  },
  word_audio: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["word", "language", "audioUrl", "dateGenerated"],
        properties: {
          word: {
            bsonType: "string"
          },
          language: {
            bsonType: "string"
          },
          audioUrl: {
            bsonType: "string"
          },
          hiraganaReading: {
            bsonType: ["string", "null"]
          },
          dateGenerated: {
            bsonType: "date"
          }
        }
      }
    },
    indexes: [
      {
        key: { language: 1, word: 1, hiraganaReading: 1 },
        unique: true
      }
    ]
  },
  feedback: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["feedbackId", "userId", "text", "dateCreated"],
        properties: {
          feedbackId: {
            bsonType: "int"
          },
          userId: {
            bsonType: "int"
          },
          text: {
            bsonType: "string",
            maxLength: 2000
          },
          parentId: {
            bsonType: ["int", "null"],
            description: "ID of parent feedback for replies, null for top-level comments"
          },
          dateCreated: {
            bsonType: "date"
          },
          isDeleted: {
            bsonType: ["bool", "null"],
            description: "Whether the feedback has been soft deleted"
          }
        }
      }
    },
    indexes: [
      {
        key: { dateCreated: -1 },
        name: "date_index",
        unique: false
      },
      {
        key: { parentId: 1 },
        name: "parent_index",
        unique: false
      },
      {
        key: { feedbackId: 1 },
        name: "feedbackId_index",
        unique: true
      }
    ]
  },
  feature_usage: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["userId", "feature", "count", "lastUsed"],
        properties: {
          userId: {
            bsonType: "int",
            description: "User ID who used the feature"
          },
          feature: {
            bsonType: "string",
            description: "Name of the feature being tracked (e.g., 'image_extraction')"
          },
          count: {
            bsonType: "int",
            description: "Number of times the feature has been used"
          },
          lastUsed: {
            bsonType: "date",
            description: "Timestamp of the last usage"
          },
          firstUsed: {
            bsonType: "date",
            description: "Timestamp of the first usage"
          }
        }
      }
    },
    indexes: [
      {
        key: { userId: 1, feature: 1 },
        unique: true
      }
    ]
  },
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
  },
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
          language: {
            bsonType: "string",
            description: "The language code for the deck (e.g., 'ko', 'ja')"
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
      },
      {
        key: { userId: 1, language: 1 },
        name: "user_language_index"
      }
    ]
  },
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
};

// Apply schema validation and indexes to collections
async function setupCollections(db) {
  for (const [collectionName, schema] of Object.entries(collections)) {
    try {
      // Create collection with validator
      try {
        await db.createCollection(collectionName, {
          validator: schema.validator
        });
      } catch (collError) {
        if (collError.code !== 48) { // Collection already exists
          console.error(`Error creating collection ${collectionName}:`, collError);
        } else {
          // Update existing collection with new validation
          await db.command({
            collMod: collectionName,
            validator: schema.validator
          });
        }
      }

      // Create indexes if specified
      if (schema.indexes) {
        for (const index of schema.indexes) {
          try {
            const options = {};
            
            // Only add unique option if it's explicitly true or false
            if (typeof index.unique === 'boolean') {
              options.unique = index.unique;
            }
            
            // Add name if specified
            if (index.name) {
              options.name = index.name;
            }
            
            await db.collection(collectionName).createIndex(index.key, options);
          } catch (indexError) {
            // Skip errors for indexes that already exist
            if (indexError.code !== 85 && indexError.code !== 11000) {
              console.error(`Error creating index on ${collectionName}:`, indexError);
            }
          }
        }
      }
    } catch (error) {
      console.error(`Error setting up collection ${collectionName}:`, error);
    }
  }
}

module.exports = { setupCollections }; 