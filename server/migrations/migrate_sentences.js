require('dotenv').config();
const { MongoClient } = require('mongodb');

const mongoUrl = `mongodb://${process.env.MONGODB_USER}:${process.env.MONGODB_PASSWORD}@${process.env.MONGODB_HOST}:${process.env.MONGODB_PORT}/${process.env.MONGODB_DB}?authSource=admin`;

async function updateAnalysisStructure(analysis) {
  if (!analysis) return analysis;

  // Skip if analysis is an empty object
  if (Object.keys(analysis).length === 0) return analysis;

  // Create a deep copy of the original analysis
  const newAnalysis = JSON.parse(JSON.stringify(analysis));

  console.log('Updating analysis structure for:', JSON.stringify(newAnalysis, null, 2));

  // Update sentence structure
  if (newAnalysis.sentence) {
    console.log('Updating sentence structure:', JSON.stringify(newAnalysis.sentence, null, 2));
    // Only transform if the old fields exist
    if ('korean' in newAnalysis.sentence && 'english' in newAnalysis.sentence) {
      const { korean, english, ...rest } = newAnalysis.sentence;
      newAnalysis.sentence = {
        original: korean,
        translation: english,
        ...rest
      };
    }
  }

  // Update components structure
  if (newAnalysis.components) {
    console.log('Updating components structure');
    newAnalysis.components = newAnalysis.components.map(component => {
      console.log('Processing component:', JSON.stringify(component, null, 2));
      // Add type_translated field if it doesn't exist
      if (component.type && !component.type_translated) {
        component.type_translated = component.type;
      }
      
      if (component.meaning && 'english' in component.meaning) {
        const { english, ...restMeaning } = component.meaning;
        component.meaning = {
          description: english,
          ...restMeaning
        };
      }
      return component;
    });
  }

  // Update grammar_points structure
  if (newAnalysis.grammar_points) {
    console.log('Updating grammar points structure');
    newAnalysis.grammar_points = newAnalysis.grammar_points.map(point => {
      console.log('Processing grammar point:', JSON.stringify(point, null, 2));
      // Update examples structure if it exists
      if (point.examples) {
        point.examples = point.examples.map(example => {
          if ('korean' in example && 'english' in example) {
            const { korean, english, ...rest } = example;
            return {
              original: korean,
              translation: english,
              ...rest
            };
          }
          return example;
        });
      }
      return {
        ...point,
        level: 1 // Set all levels to 1
      };
    });
  }

  console.log('Finished updating analysis structure:', JSON.stringify(newAnalysis, null, 2));
  return newAnalysis;
}

async function migrateSentences() {
  let client;
  let hasLoggedFirstValidAnalysis = false;
  
  try {
    client = await MongoClient.connect(mongoUrl, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });
    
    const db = client.db(process.env.MONGODB_DB);
    const sentencesCollection = db.collection('sentences');
    
    // First, temporarily remove schema validation
    console.log('Removing schema validation...');
    await db.command({
      collMod: "sentences",
      validator: {}
    });

    // Get all existing sentences
    const sentences = await sentencesCollection.find({}).toArray();
    
    console.log(`Found ${sentences.length} sentences to migrate`);
    
    // Perform migration in batches
    const batchSize = 100;
    for (let i = 0; i < sentences.length; i += batchSize) {
      const batch = sentences.slice(i, i + batchSize);
      const operationPromises = batch.map(async sentence => {
        // Skip if no analysis object or empty analysis
        if (!sentence.analysis || Object.keys(sentence.analysis).length === 0) {
          console.log(`Skipping sentence ${sentence.sentenceId} - no analysis object or empty analysis`);
          return null;
        }

        const updatedAnalysis = await updateAnalysisStructure(sentence.analysis);
        
        // Log the first non-empty analysis we find
        if (!hasLoggedFirstValidAnalysis && Object.keys(sentence.analysis).length > 0) {
          console.log('First valid sentence analysis before:', JSON.stringify(sentence.analysis, null, 2));
          console.log('First valid sentence analysis after:', JSON.stringify(updatedAnalysis, null, 2));
          console.log('Analysis changed?', JSON.stringify(sentence.analysis) !== JSON.stringify(updatedAnalysis));
          hasLoggedFirstValidAnalysis = true;
        }
        
        // Only create update operation if analysis was actually modified
        const analysisChanged = JSON.stringify(sentence.analysis) !== JSON.stringify(updatedAnalysis);
        if (!analysisChanged) {
          console.log(`Skipping sentence ${sentence.sentenceId} - no changes needed`);
          return null;
        }
        
        return {
          updateOne: {
            filter: { _id: sentence._id },
            update: {
              $set: {
                originalLanguage: 'ko',
                translationLanguage: 'en',
                analysis: updatedAnalysis
              }
            }
          }
        };
      });
      
      // Wait for all promises to resolve
      const operations = (await Promise.all(operationPromises)).filter(op => op !== null);
      
      // Add error handling for the bulkWrite operation
      try {
        if (operations.length > 0) {
          await sentencesCollection.bulkWrite(operations);
          console.log(`Migrated ${Math.min(i + batchSize, sentences.length)} / ${sentences.length} sentences`);
        }
      } catch (error) {
        console.error('Error in batch:', error);
        console.error('First failed operation:', operations[0]);
        console.error('First failed operation analysis:', operations[0]?.update?.$set?.analysis);
        throw error;
      }
    }
    
    // Now add back the schema validation with updated schema
    console.log('Adding new schema validation...');
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
    
    console.log('Migration completed successfully');
    
  } catch (error) {
    console.error('Migration failed:', error);
    process.exit(1);
  } finally {
    if (client) {
      await client.close();
    }
  }
}

// Run migration
migrateSentences().catch(console.error); 