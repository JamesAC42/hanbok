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