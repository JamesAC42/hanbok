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
        required: ["sentenceId", "text", "analysis", "dateCreated"],
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
  }
};

// Apply schema validation and indexes to collections
async function setupCollections(db) {
  for (const [collectionName, schema] of Object.entries(collections)) {
    try {
      // Create collection with validator
      await db.createCollection(collectionName, {
        validator: schema.validator
      });

      // Create indexes if specified
      if (schema.indexes) {
        for (const index of schema.indexes) {
          await db.collection(collectionName).createIndex(index.key, {
            unique: index.unique
          });
        }
      }
    } catch (error) {
      if (error.code !== 48) { // Collection already exists
        console.error(`Error creating ${collectionName}:`, error);
      } else {
        // Update existing collection with new validation
        await db.command({
          collMod: collectionName,
          validator: schema.validator
        });
      }
    }
  }
}

module.exports = { setupCollections }; 