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
            bsonType: "int",
            description: "Remaining audio generations available for the user"
          },
          maxSavedSentences: {
            bsonType: "int",
            description: "Maximum number of sentences user can save (for tier 0)"
          },
          maxSavedWords: {
            bsonType: "int",
            description: "Maximum number of words user can save (for tier 0)"
          },
          dateCreated: {
            bsonType: "date"
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
    index: {
      key: { userId: 1, sentenceId: 1 },
      unique: true
    }
  },
  words: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["wordId", "userId", "korean", "english", "dateSaved"],
        properties: {
          wordId: {
            bsonType: "int"
          },
          userId: {
            bsonType: "int"
          },
          korean: {
            bsonType: "string"
          },
          english: {
            bsonType: "string"
          },
          dateSaved: {
            bsonType: "date"
          }
        }
      }
    },
    index: {
      key: { userId: 1, korean: 1 },
      unique: true
    }
  }
};

// Apply schema validation to collections
async function setupCollections(db) {
  for (const [collectionName, schema] of Object.entries(collections)) {
    try {
      await db.createCollection(collectionName, schema);
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