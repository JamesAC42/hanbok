const { getDb } = require('../database');

/**
 * Fix all counters by setting them to the correct values based on existing data
 */
async function fixCounters() {
    try {
        const db = getDb();
        
        console.log('Starting counter fix...');
        
        // Get the highest existing values for each counter
        const collections = [
            { name: 'users', field: 'userId', counter: 'userId' },
            { name: 'sentences', field: 'sentenceId', counter: 'sentenceId' },
            { name: 'feedback', field: 'feedbackId', counter: 'feedbackId' },
            { name: 'conversations', field: 'conversationId', counter: 'conversationId' },
            { name: 'conversation_messages', field: 'messageId', counter: 'messageId' }
        ];
        
        const results = {};
        
        for (const collection of collections) {
            try {
                // Find the highest existing value
                const highest = await db.collection(collection.name)
                    .findOne({}, { 
                        sort: { [collection.field]: -1 }, 
                        projection: { [collection.field]: 1 } 
                    });
                
                const maxValue = highest ? highest[collection.field] : 0;
                
                // Update the counter
                await db.collection('counters').updateOne(
                    { _id: collection.counter },
                    { $set: { seq: maxValue } },
                    { upsert: true }
                );
                
                results[collection.counter] = maxValue;
                console.log(`Fixed ${collection.counter}: set to ${maxValue}`);
                
            } catch (error) {
                console.error(`Error fixing counter ${collection.counter}:`, error);
                results[collection.counter] = { error: error.message };
            }
        }
        
        console.log('Counter fix completed!');
        return { success: true, results };
        
    } catch (error) {
        console.error('Error during counter fix:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    fixCounters
}; 