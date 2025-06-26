const { getDb } = require('../database');

/**
 * Clean up conflicting conversation data
 */
async function cleanupConflictingData() {
    try {
        const db = getDb();
        
        console.log('Starting cleanup of conflicting data...');
        
        // Find all conversations with duplicate conversationIds
        const duplicates = await db.collection('conversations').aggregate([
            {
                $group: {
                    _id: "$conversationId",
                    count: { $sum: 1 },
                    docs: { $push: "$$ROOT" }
                }
            },
            {
                $match: {
                    count: { $gt: 1 }
                }
            }
        ]).toArray();
        
        console.log(`Found ${duplicates.length} duplicate conversation ID groups`);
        
        for (const duplicate of duplicates) {
            const conversationId = duplicate._id;
            const docs = duplicate.docs;
            
            console.log(`Processing conversationId ${conversationId} with ${docs.length} duplicates`);
            
            // Keep only the first document, delete the rest
            for (let i = 1; i < docs.length; i++) {
                const docToDelete = docs[i];
                console.log(`Deleting duplicate conversation ${docToDelete._id}`);
                
                // Delete the conversation
                await db.collection('conversations').deleteOne({ _id: docToDelete._id });
                
                // Delete associated messages
                await db.collection('conversation_messages').deleteMany({ 
                    conversationId: docToDelete.conversationId 
                });
            }
        }
        
        // Also clean up any orphaned messages
        const conversations = await db.collection('conversations').find({}, { projection: { conversationId: 1 } }).toArray();
        const validConversationIds = conversations.map(c => c.conversationId);
        
        const orphanedMessages = await db.collection('conversation_messages').deleteMany({
            conversationId: { $nin: validConversationIds }
        });
        
        console.log(`Deleted ${orphanedMessages.deletedCount} orphaned messages`);
        console.log('Cleanup completed!');
        
        return { 
            success: true, 
            duplicatesFound: duplicates.length,
            orphanedMessagesDeleted: orphanedMessages.deletedCount
        };
        
    } catch (error) {
        console.error('Error during cleanup:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    cleanupConflictingData
}; 