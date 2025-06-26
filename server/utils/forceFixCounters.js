const { getDb } = require('../database');

/**
 * Force fix all counters by setting them higher than any existing data
 */
async function forceFixCounters() {
    try {
        const db = getDb();
        
        console.log('Starting force counter fix...');
        
        // Get the highest existing values for each counter, including deleted records
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
                // Find the highest existing value (including deleted records)
                const highest = await db.collection(collection.name)
                    .findOne({}, { 
                        sort: { [collection.field]: -1 }, 
                        projection: { [collection.field]: 1 } 
                    });
                
                const maxValue = highest ? highest[collection.field] : 0;
                const newCounterValue = maxValue + 10; // Add buffer to avoid conflicts
                
                // Update the counter to be higher than any existing value
                await db.collection('counters').updateOne(
                    { _id: collection.counter },
                    { $set: { seq: newCounterValue } },
                    { upsert: true }
                );
                
                results[collection.counter] = {
                    previousMax: maxValue,
                    newCounter: newCounterValue
                };
                console.log(`Force fixed ${collection.counter}: max existing ${maxValue}, set counter to ${newCounterValue}`);
                
            } catch (error) {
                console.error(`Error force fixing counter ${collection.counter}:`, error);
                results[collection.counter] = { error: error.message };
            }
        }
        
        console.log('Force counter fix completed!');
        return { success: true, results };
        
    } catch (error) {
        console.error('Error during force counter fix:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    forceFixCounters
}; 