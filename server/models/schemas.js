const collections = {
  users: {
    validator: {
      $jsonSchema: {
        bsonType: "object",
        required: ["email", "userId", "name", "googleId"],
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