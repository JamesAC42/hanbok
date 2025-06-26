const { getDb } = require('../database');

/**
 * Migrate the conversationId index to support soft deletes
 * This function drops the old unique index and creates a new partial index
 * that only applies to non-deleted conversations
 */
async function migrateConversationIndex() {
    try {
        const db = getDb();
        
        console.log('Starting conversation index migration...');
        
        // Check if the old index exists
        const indexes = await db.collection('conversations').indexes();
        const hasOldIndex = indexes.some(index => 
            index.name === 'conversationId_1' && !index.partialFilterExpression
        );
        
        if (hasOldIndex) {
            console.log('Dropping old conversationId index...');
            try {
                await db.collection('conversations').dropIndex('conversationId_1');
                console.log('Old index dropped successfully');
            } catch (error) {
                if (error.code !== 27) { // Index not found error
                    throw error;
                }
                console.log('Old index already dropped or not found');
            }
        }
        
        // Ensure all existing conversations have isDeleted field
        console.log('Setting isDeleted field for existing conversations...');
        await db.collection('conversations').updateMany(
            { isDeleted: { $exists: false } },
            { $set: { isDeleted: false } }
        );
        
        // Create new partial index
        console.log('Creating new partial index for conversationId...');
        await db.collection('conversations').createIndex(
            { conversationId: 1 },
            { 
                unique: true,
                partialFilterExpression: { isDeleted: false },
                name: 'conversationId_1_partial'
            }
        );
        
        console.log('New partial index created successfully');
        console.log('Conversation index migration completed!');
        
        return { success: true, message: 'Index migration completed successfully' };
        
    } catch (error) {
        console.error('Error during conversation index migration:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    migrateConversationIndex
}; 