require('dotenv').config();
const { MongoClient } = require('mongodb');

const mongoUrl = `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DB}?authSource=admin`;

async function cleanupEmptyAnalysis() {
    let client;
    
    try {
        client = await MongoClient.connect(mongoUrl, {
            useNewUrlParser: true,
            useUnifiedTopology: true
        });
        
        const db = client.db(process.env.MONGODB_DB);
        const sentencesCollection = db.collection('sentences');
        
        // Temporarily remove schema validation
        console.log('Removing schema validation...');
        await db.command({
            collMod: "sentences",
            validator: {}
        });

        // Find and delete sentences with empty or null analysis
        const result = await sentencesCollection.deleteMany({
            $or: [
                { analysis: null },
                { analysis: {} },
                { analysis: { $exists: false } }
            ]
        });

        console.log(`Deleted ${result.deletedCount} sentences with empty analysis`);

        // Add back schema validation
        console.log('Restoring schema validation...');
        await db.command({
            collMod: "sentences",
            validator: {
                $jsonSchema: {
                    bsonType: "object",
                    required: ["sentenceId", "text", "analysis", "dateCreated", "originalLanguage", "translationLanguage"],
                    properties: {
                        sentenceId: { bsonType: "int" },
                        userId: { bsonType: ["int", "null"] },
                        text: { bsonType: "string" },
                        analysis: { bsonType: "object" },
                        voice1: { 
                            bsonType: ["string", "null"],
                            description: "S3 presigned URL for voice 1 audio"
                        },
                        voice2: { 
                            bsonType: ["string", "null"],
                            description: "S3 presigned URL for voice 2 audio"
                        },
                        originalLanguage: { bsonType: "string" },
                        translationLanguage: { bsonType: "string" },
                        dateCreated: { bsonType: "date" }
                    }
                }
            }
        });

        console.log('Cleanup completed successfully');
        
    } catch (error) {
        console.error('Cleanup failed:', error);
        process.exit(1);
    } finally {
        if (client) {
            await client.close();
        }
    }
}

// Run cleanup
cleanupEmptyAnalysis().catch(console.error); 