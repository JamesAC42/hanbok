const { getDb } = require('../database');

/**
 * Delete a specific conversation by conversationId
 */
async function deleteSpecificConversation(conversationId) {
    try {
        const db = getDb();
        
        console.log(`Deleting conversation with ID: ${conversationId}`);
        
        // Delete the conversation
        const conversationResult = await db.collection('conversations').deleteOne({ 
            conversationId: conversationId 
        });
        
        // Delete associated messages
        const messagesResult = await db.collection('conversation_messages').deleteMany({ 
            conversationId: conversationId 
        });
        
        console.log(`Deleted ${conversationResult.deletedCount} conversation(s)`);
        console.log(`Deleted ${messagesResult.deletedCount} message(s)`);
        
        return { 
            success: true, 
            conversationsDeleted: conversationResult.deletedCount,
            messagesDeleted: messagesResult.deletedCount
        };
        
    } catch (error) {
        console.error('Error deleting specific conversation:', error);
        return { success: false, error: error.message };
    }
}

module.exports = {
    deleteSpecificConversation
}; 