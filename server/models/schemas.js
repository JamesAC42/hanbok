const collections = {
  users: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["email", "userId", "name", "tier", "remainingAudioGenerations"],
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
            bsonType: ["string", "null"],
            description: "Google ID for OAuth users, null for email/password users"
          },
          password: {
            bsonType: ["string", "null"],
            description: "Hashed password for email/password users, null for OAuth users"
          },
          verified: {
            bsonType: ["bool", "null"],
            description: "Whether email address has been verified for email/password users"
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
          remainingSentenceAnalyses: {
            bsonType: ["int", "null"],
            description: "Remaining purchased sentence analyses available for the user"
          },
          feedbackAudioCreditRedeemed: {
            bsonType: ["bool", "null"],
            description: "Whether user has redeemed their feedback audio credit bonus"
          },
          hasUsedFreeTrial: {
            bsonType: ["bool", "null"],
            description: "Whether user has already used their 7-day free trial"
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
          voice1SlowKey: {
            bsonType: ["string", "null"],
            description: "S3 presigned URL for slowed voice 1 audio"
          },
          voice2SlowKey: {
            bsonType: ["string", "null"],
            description: "S3 presigned URL for slowed voice 2 audio"
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
          },
          isLyric: {
            bsonType: ["bool", "null"],
            description: "Whether the sentence is part of a song."
          },
          extendedTextId: {
            bsonType: ["int", "null"],
            description: "ID of the extended text this sentence is associated with, if any."
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
  savedExtendedTexts: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["userId", "textId", "dateSaved"],
        properties: {
          userId: {
            bsonType: "int",
            description: "User who saved the extended text"
          },
          textId: {
            bsonType: "int",
            description: "Identifier of the extended text"
          },
          dateSaved: {
            bsonType: "date",
            description: "When the extended text was saved"
          }
        }
      }
    },
    indexes: [
      {
        key: { userId: 1, textId: 1 },
        unique: true,
        name: "unique_saved_extended_text"
      },
      {
        key: { dateSaved: -1 },
        name: "saved_extended_text_date"
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
          intervalDays: {
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
                intervalDays: {
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
  },
  study_progress: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["userId", "deckId", "date", "newCardsStudied", "reviewsCompleted"],
        properties: {
          userId: {
            bsonType: "int",
            description: "User ID who studied cards"
          },
          deckId: {
            bsonType: "int",
            description: "Deck ID being studied"
          },
          date: {
            bsonType: "date",
            description: "Date of study activity (truncated to day)"
          },
          newCardsStudied: {
            bsonType: "int",
            description: "Number of new cards studied today"
          },
          reviewsCompleted: {
            bsonType: "int",
            description: "Number of reviews completed today"
          },
          timeSpent: {
            bsonType: ["int", "null"],
            description: "Optional tracking of time spent studying in seconds"
          },
          lastUpdated: {
            bsonType: "date",
            description: "Timestamp of the last update to this record"
          }
        }
      }
    },
    indexes: [
      {
        key: { userId: 1, deckId: 1, date: 1 },
        unique: true,
        name: "unique_daily_progress"
      },
      {
        key: { date: -1 },
        name: "date_index"
      }
    ]
  },
  study_streaks: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["userId", "deckId", "currentStreak", "maxStreak", "lastStudyDate"],
        properties: {
          userId: {
            bsonType: "int",
            description: "User ID who is tracking streaks"
          },
          deckId: {
            bsonType: "int",
            description: "Deck ID being tracked"
          },
          currentStreak: {
            bsonType: "int",
            description: "Current streak in days"
          },
          maxStreak: {
            bsonType: "int",
            description: "Maximum streak achieved in days"
          },
          currentStreakStartDate: {
            bsonType: "date",
            description: "Date when the current streak started"
          },
          maxStreakStartDate: {
            bsonType: ["date", "null"],
            description: "Date when the maximum streak started"
          },
          maxStreakEndDate: {
            bsonType: ["date", "null"],
            description: "Date when the maximum streak ended"
          },
          lastStudyDate: {
            bsonType: "date",
            description: "Last date the user studied this deck"
          },
          studyDates: {
            bsonType: "array",
            description: "Array of dates when user studied",
            items: {
              bsonType: "date"
            }
          }
        }
      }
    },
    indexes: [
      {
        key: { userId: 1, deckId: 1 },
        unique: true,
        name: "unique_user_deck_streak"
      },
      {
        key: { currentStreak: -1 },
        name: "current_streak_index"
      }
    ]
  },
  lyrics: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["title", "genre", "lyricsText", "dateCreated", "published", "lyricId"],
        properties: {
          _id: {
            bsonType: "objectId",
            description: "Unique identifier for the lyrics"
          },
          lyricId: {
            bsonType: "string",
            description: "URL-friendly ID formed from artist and title"
          },
          title: {
            bsonType: "string",
            description: "Title of the song"
          },
          artist: {
            bsonType: ["string", "null"],
            description: "Name of the artist/band/anime"
          },
          anime: {
            bsonType: ["string", "null"],
            description: "Name of the anime"
          },
          genre: {
            bsonType: "string",
            description: "Genre of the song"
          },
          youtubeUrl: {
            bsonType: ["string", "null"],
            description: "URL to the YouTube video of the song"
          },
          published: {
            bsonType: "bool",
            description: "Whether the lyrics are publicly visible to users"
          },
          isNew: {
            bsonType: "bool",
            description: "Whether the lyrics are new"
          },
          dateCreated: {
            bsonType: "date",
            description: "Date when the lyrics were added"
          },
          lyricsText: {
            bsonType: "string",
            description: "Full lyrics text of the song"
          },
          language: {
            bsonType: "string",
            description: "Main language of the lyrics (e.g., 'ko', 'ja')"
          }
        }
      }
    },
    indexes: [
      {
        key: { _id: 1 },
        unique: true
      },
      {
        key: { published: 1 }
      },
      {
        key: { language: 1 }
      }
    ]
  },
  lyrics_analysis: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["lyricId", "analysisData", "language", "dateCreated"],
        properties: {
          _id: {
            bsonType: "objectId",
            description: "Unique identifier for the lyrics analysis"
          },
          lyricId: {
            bsonType: "string",
            description: "ID of the lyrics item this analysis is for"
          },
          language: {
            bsonType: "string",
            description: "Language code for the analysis (e.g., 'en' for English)"
          },
          dateCreated: {
            bsonType: "date",
            description: "Date when the analysis was created"
          },
          analysisData: {
            bsonType: "string",
            description: "JSON string of the analysis data, structured as a list of objects mapping line(s) to sentence analysis ID"
          },
          translationText: {
            bsonType: ["string", "null"],
            description: "Full translation of the entire lyrics text"
          }
        }
      }
    },
    indexes: [
      {
        key: { analysisId: 1 },
        unique: true
      },
      {
        key: { lyricId: 1, language: 1 },
        unique: true
      }
    ]
  },
  lyric_suggestions: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["suggestionId", "songName", "artist", "userId", "dateCreated", "upvotes"],
        properties: {
          suggestionId: {
            bsonType: "int",
            description: "Unique identifier for the song suggestion"
          },
          songName: {
            bsonType: "string",
            description: "Name of the suggested song"
          },
          artist: {
            bsonType: "string",
            description: "Name of the artist/band"
          },
          userId: {
            bsonType: "int",
            description: "ID of the user who suggested the song"
          },
          dateCreated: {
            bsonType: "date",
            description: "Date when the suggestion was created"
          },
          upvotes: {
            bsonType: "int",
            description: "Number of upvotes for this suggestion"
          },
          genre: {
            bsonType: ["string", "null"],
            description: "Genre of the song (optional)"
          },
          youtubeUrl: {
            bsonType: ["string", "null"],
            description: "URL to the YouTube video of the song (optional)"
          },
          language: {
            bsonType: ["string", "null"],
            description: "Main language of the lyrics (optional)"
          },
          status: {
            bsonType: ["string", "null"],
            enum: ["pending", "approved", "rejected", "completed"],
            description: "Status of the suggestion"
          }
        }
      }
    },
    indexes: [
      {
        key: { suggestionId: 1 },
        unique: true
      },
      {
        key: { upvotes: -1 }
      },
      {
        key: { userId: 1 }
      },
      {
        key: { status: 1 }
      }
    ]
  },
  lyric_suggestion_upvotes: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["userId", "suggestionId", "dateUpvoted"],
        properties: {
          userId: {
            bsonType: "int",
            description: "ID of the user who upvoted"
          },
          suggestionId: {
            bsonType: "int",
            description: "ID of the suggestion that was upvoted"
          },
          dateUpvoted: {
            bsonType: "date",
            description: "Date when the upvote was created"
          }
        }
      }
    },
    indexes: [
      {
        key: { userId: 1, suggestionId: 1 },
        unique: true
      },
      {
        key: { suggestionId: 1 }
      }
    ]
  },
  lyric_views: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["lyricId", "viewCount", "lastViewed"],
        properties: {
          lyricId: {
            bsonType: "string",
            description: "ID of the lyrics item this view count is for"
          },
          viewCount: {
            bsonType: "int",
            description: "Number of times the lyric has been viewed"
          },
          lastViewed: {
            bsonType: "date",
            description: "Date when the lyric was last viewed"
          }
        }
      }
    },
    indexes: [
      {
        key: { lyricId: 1 },
        unique: true
      }
    ]
  },
  rate_limits: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["identifier", "identifierType", "totalSentences", "weekSentences", "weekStartDate", "lastUpdated"],
        properties: {
          identifier: {
            bsonType: "string",
            description: "User ID or IP address as a string"
          },
          identifierType: {
            bsonType: "string",
            enum: ["userId", "ipAddress"],
            description: "Type of identifier: 'userId' for logged in users, 'ipAddress' for anonymous users"
          },
          totalSentences: {
            bsonType: "int",
            description: "Total number of sentences generated by this user/IP"
          },
          weekSentences: {
            bsonType: "int",
            description: "Number of sentences generated in the current week (since last Sunday)"
          },
          weekStartDate: {
            bsonType: "date",
            description: "Date of the Sunday that started the current week"
          },
          monthlyConversations: {
            bsonType: ["int", "null"],
            description: "Number of conversations started in the current month"
          },
          monthStartDate: {
            bsonType: ["date", "null"],
            description: "Date of the first day of the current month"
          },
          totalConversations: {
            bsonType: ["int", "null"],
            description: "Total number of conversations started by this user/IP"
          },
          lastConversationCreated: {
            bsonType: ["date", "null"],
            description: "Timestamp of the last conversation creation"
          },
          weekExtendedTextAnalyses: {
            bsonType: ["int", "null"],
            description: "Number of extended analyses completed in the current week"
          },
          totalExtendedTextAnalyses: {
            bsonType: ["int", "null"],
            description: "Total number of extended analyses completed"
          },
          lastUpdated: {
            bsonType: "date",
            description: "Timestamp of the last update to this record"
          }
        }
      }
    },
    indexes: [
      {
        key: { identifier: 1 },
        unique: true
      },
      {
        key: { identifierType: 1 }
      },
      {
        key: { weekStartDate: 1 }
      },
      {
        key: { monthStartDate: 1 }
      }
    ]
  },
  conversations: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["conversationId", "userId", "title", "dateCreated", "lastUpdated", "messageCount"],
        properties: {
          conversationId: {
            bsonType: "int",
            description: "Unique identifier for the conversation"
          },
          userId: {
            bsonType: "int",
            description: "ID of the user who owns this conversation"
          },
          title: {
            bsonType: "string",
            description: "Title/name of the conversation, auto-generated or user-set"
          },
          sentenceId: {
            bsonType: ["int", "null"],
            description: "Optional ID of the sentence this conversation is linked to"
          },
          dateCreated: {
            bsonType: "date",
            description: "When the conversation was created"
          },
          lastUpdated: {
            bsonType: "date",
            description: "When the conversation was last updated"
          },
          messageCount: {
            bsonType: "int",
            description: "Total number of messages in this conversation"
          },
          userMessageCount: {
            bsonType: "int",
            description: "Number of user messages (for tier limits)"
          },
          isDeleted: {
            bsonType: ["bool", "null"],
            description: "Whether the conversation has been soft deleted"
          }
        }
      }
    },
    indexes: [
      {
        key: { conversationId: 1 },
        unique: true,
        partialFilterExpression: { isDeleted: false }
      },
      {
        key: { userId: 1, lastUpdated: -1 },
        name: "user_conversations_index"
      },
      {
        key: { sentenceId: 1 },
        name: "sentence_conversations_index"
      },
      {
        key: { userId: 1, sentenceId: 1 },
        name: "user_sentence_index"
      }
    ]
  },
  conversation_messages: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["messageId", "conversationId", "role", "content", "timestamp"],
        properties: {
          messageId: {
            bsonType: "int",
            description: "Unique identifier for the message"
          },
          conversationId: {
            bsonType: "int",
            description: "ID of the conversation this message belongs to"
          },
          role: {
            bsonType: "string",
            enum: ["user", "assistant", "system"],
            description: "Role of the message sender"
          },
          content: {
            bsonType: "string",
            description: "Content of the message"
          },
          timestamp: {
            bsonType: "date",
            description: "When the message was created"
          },
          metadata: {
            bsonType: ["object", "null"],
            description: "Optional metadata for the message (tokens used, etc.)"
          }
        }
      }
    },
    indexes: [
      {
        key: { messageId: 1 },
        unique: true
      },
      {
        key: { conversationId: 1, timestamp: 1 },
        name: "conversation_messages_index"
      }
    ]
  },
  user_favorite_lyrics: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["userId", "lyricId", "dateFavorited"],
        properties: {
          userId: {
            bsonType: "int",
            description: "ID of the user who favorited the lyric"
          },
          lyricId: {
            bsonType: "string",
            description: "ID of the favorited lyric"
          },
          dateFavorited: {
            bsonType: "date",
            description: "Date when the lyric was favorited"
          }
        }
      }
    },
    indexes: [
      {
        key: { userId: 1, lyricId: 1 },
        unique: true,
        name: "unique_user_favorite"
      },
      {
        key: { userId: 1, dateFavorited: -1 },
        name: "user_favorites_by_date"
      },
      {
        key: { lyricId: 1 },
        name: "lyric_favorites_index"
      }
    ]
  },
  lyric_comments: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["commentId", "lyricId", "userId", "content", "dateCreated", "upvotes", "downvotes"],
        properties: {
          commentId: {
            bsonType: "int",
            description: "Unique identifier for the comment"
          },
          lyricId: {
            bsonType: "string",
            description: "ID of the lyric this comment is for"
          },
          userId: {
            bsonType: "int",
            description: "ID of the user who made the comment"
          },
          content: {
            bsonType: "string",
            maxLength: 1000,
            description: "Content of the comment (max 1000 characters)"
          },
          dateCreated: {
            bsonType: "date",
            description: "Date when the comment was created"
          },
          upvotes: {
            bsonType: "int",
            description: "Number of upvotes for this comment"
          },
          downvotes: {
            bsonType: "int",
            description: "Number of downvotes for this comment"
          },
          isDeleted: {
            bsonType: ["bool", "null"],
            description: "Whether the comment has been soft deleted"
          }
        }
      }
    },
    indexes: [
      {
        key: { commentId: 1 },
        unique: true
      },
      {
        key: { lyricId: 1, dateCreated: -1 },
        name: "lyric_comments_by_date"
      },
      {
        key: { userId: 1 },
        name: "user_comments_index"
      }
    ]
  },
  lyric_comment_votes: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["userId", "commentId", "voteType", "dateVoted"],
        properties: {
          userId: {
            bsonType: "int",
            description: "ID of the user who voted"
          },
          commentId: {
            bsonType: "int",
            description: "ID of the comment that was voted on"
          },
          voteType: {
            bsonType: "string",
            enum: ["upvote", "downvote"],
            description: "Type of vote: 'upvote' or 'downvote'"
          },
          dateVoted: {
            bsonType: "date",
            description: "Date when the vote was cast"
          }
        }
      }
    },
    indexes: [
      {
        key: { userId: 1, commentId: 1 },
        unique: true,
        name: "unique_user_comment_vote"
      },
      {
        key: { commentId: 1 },
        name: "comment_votes_index"
      }
    ]
  },
  extended_texts: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["textId", "userId", "text", "sentenceCount", "sentenceGroupId", "overallAnalysis", "dateCreated", "originalLanguage", "translationLanguage"],
        properties: {
          textId: {
            bsonType: "int",
            description: "Unique identifier for the extended text"
          },
          userId: {
            bsonType: "int",
            description: "User ID who submitted this text"
          },
          text: {
            bsonType: "string",
            description: "Full text submitted by user (multiple sentences)"
          },
          sentenceCount: {
            bsonType: "int",
            description: "Number of sentences in the text"
          },
          sentenceGroupId: {
            bsonType: "int",
            description: "Identifier for the bundled set of sentences in this extended text"
          },
          overallAnalysis: {
            bsonType: "object",
            description: "Analysis of the text as a whole",
            properties: {
              summary: {
                bsonType: ["string", "null"],
                description: "Summary of the entire text"
              },
              themes: {
                bsonType: ["array", "null"],
                items: {
                  bsonType: "string"
                },
                description: "Main themes in the text"
              },
              tone: {
                bsonType: ["string", "null"],
                description: "Overall tone/mood of the text"
              },
              structure: {
                bsonType: ["string", "null"],
                description: "How the text is structured"
              },
              keyGrammarPatterns: {
                bsonType: ["array", "null"],
                items: {
                  bsonType: "object",
                  properties: {
                    pattern: {
                      bsonType: "string"
                    },
                    description: {
                      bsonType: "string"
                    },
                    examples: {
                      bsonType: "array",
                      items: {
                        bsonType: "string"
                      }
                    }
                  }
                },
                description: "Key grammar patterns across the text"
              },
              culturalContext: {
                bsonType: ["string", "null"],
                description: "Cultural context for the entire text"
              }
            }
          },
          dateCreated: {
            bsonType: "date",
            description: "Date when the text was created"
          },
          originalLanguage: {
            bsonType: "string",
            description: "Language code for the original text (e.g. 'ko', 'ja')"
          },
          translationLanguage: {
            bsonType: "string",
            description: "Language code for the translation (e.g. 'en')"
          },
          title: {
            bsonType: ["string", "null"],
            description: "Optional user-provided title for the text"
          }
        }
      }
    },
    indexes: [
      {
        key: { textId: 1 },
        unique: true,
        name: "textId_index"
      },
      {
        key: { userId: 1, dateCreated: -1 },
        name: "user_texts_by_date"
      }
    ]
  },
  extended_text_sentence_groups: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["textId", "userId", "sentences", "dateCreated", "originalLanguage", "translationLanguage"],
        properties: {
          textId: {
            bsonType: "int",
            description: "Identifier of the extended text this sentence group belongs to"
          },
          userId: {
            bsonType: "int",
            description: "User ID who owns this extended text"
          },
          originalLanguage: {
            bsonType: "string",
            description: "Language code for the original text"
          },
          translationLanguage: {
            bsonType: "string",
            description: "Language code for the translation"
          },
          sentences: {
            bsonType: "array",
            description: "Ordered list of sentences associated with the extended text",
            items: {
              bsonType: "object",
              required: ["sentenceId", "order"],
              properties: {
                sentenceId: {
                  bsonType: "int",
                  description: "Reference to the sentenceId in the sentences collection"
                },
                order: {
                  bsonType: "int",
                  description: "Zero-based order of the sentence within the extended text"
                }
              }
            }
          },
          dateCreated: {
            bsonType: "date",
            description: "Date when this sentence group was created"
          }
        }
      }
    },
    indexes: [
      {
        key: { textId: 1 },
        unique: true,
        name: "extended_text_sentence_group_textId"
      },
      {
        key: { userId: 1, dateCreated: -1 },
        name: "extended_text_sentence_group_user"
      }
    ]
  },
  extended_text_jobs: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["jobId", "textId", "userId", "text", "sentences", "sentenceCount", "originalLanguage", "translationLanguage", "status", "processedSentences", "createdAt", "updatedAt"],
        properties: {
          jobId: {
            bsonType: "int",
            description: "Unique identifier for the extended text job"
          },
          textId: {
            bsonType: "int",
            description: "Reserved text ID that will be used once processing completes"
          },
          userId: {
            bsonType: "int",
            description: "User ID who submitted this job"
          },
          text: {
            bsonType: "string",
            description: "Full text to analyze"
          },
          sentences: {
            bsonType: "array",
            description: "Sentences extracted from the text",
            items: {
              bsonType: "string"
            }
          },
          sentenceCount: {
            bsonType: "int",
            description: "Number of sentences to analyze"
          },
          originalLanguage: {
            bsonType: "string",
            description: "Language code for the original text"
          },
          translationLanguage: {
            bsonType: "string",
            description: "Language code for the translation output"
          },
          title: {
            bsonType: ["string", "null"],
            description: "Optional title provided by the user"
          },
          status: {
            bsonType: "string",
            description: "Job status: pending, processing, completed, or failed"
          },
          processedSentences: {
            bsonType: "int",
            description: "Number of sentences processed so far"
          },
          error: {
            bsonType: ["string", "null"],
            description: "Error message if the job failed"
          },
          createdAt: {
            bsonType: "date",
            description: "Job creation timestamp"
          },
          updatedAt: {
            bsonType: "date",
            description: "Timestamp of the last update"
          },
          requiresRateLimitUpdate: {
            bsonType: ["bool", "null"],
            description: "Whether the job should update rate limits once completed"
          },
          weeklyQuota: {
            bsonType: ["object", "null"],
            description: "Cached weekly quota information after completion"
          },
          resultTextId: {
            bsonType: ["int", "null"],
            description: "Final textId once job has completed"
          }
        }
      }
    },
    indexes: [
      {
        key: { jobId: 1 },
        unique: true,
        name: "extended_text_jobId"
      },
      {
        key: { userId: 1, createdAt: -1 },
        name: "extended_text_jobs_user"
      },
      {
        key: { status: 1, updatedAt: -1 },
        name: "extended_text_jobs_status"
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
