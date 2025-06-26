const { getDb } = require('../../database');
const { generateTutorResponse } = require('../../llm/tutorResponse');
const { generateTutorResponseStream } = require('../../llm/tutorResponseStream');

/**
 * Tier limitations for conversations:
 * - Tier 0 (Free): 1 user message per conversation, 1 conversation per sentence
 * - Tier 1 (Basic): 200 user messages per conversation, 1 conversation per sentence
 * - Tier 2 (Plus): 200 user messages per conversation, unlimited conversations per sentence
 */

const TIER_LIMITS = {
  0: { maxUserMessages: 1, maxConversationsPerSentence: 1 }, // Free
  1: { maxUserMessages: 50, maxConversationsPerSentence: 1 }, // Basic
  2: { maxUserMessages: 200, maxConversationsPerSentence: Infinity } // Plus
};

// Helper function to get next sequence value
async function getNextSequence(name) {
  const db = getDb();
  
  // First, ensure the counter exists and has a reasonable value
  const existing = await db.collection('counters').findOne({ _id: name });
  if (!existing) {
    // If counter doesn't exist, initialize it based on existing data
    const collections = {
      'conversationId': 'conversations',
      'messageId': 'conversation_messages'
    };
    
    const collectionName = collections[name];
    if (collectionName) {
      const highest = await db.collection(collectionName)
        .findOne({}, { 
          sort: { [name]: -1 }, 
          projection: { [name]: 1 } 
        });
      
      const maxValue = highest ? highest[name] : 0;
      const startValue = maxValue + 10; // Add buffer
      
      await db.collection('counters').updateOne(
        { _id: name },
        { $set: { _id: name, seq: startValue } },
        { upsert: true }
      );
    } else {
      // Fallback for other counters
      await db.collection('counters').updateOne(
        { _id: name },
        { $setOnInsert: { _id: name, seq: 0 } },
        { upsert: true }
      );
    }
  }
  
  // Debug: Check if counter exists before updating
  const existingCounter = await db.collection('counters').findOne({ _id: name });
  console.log(`Counter ${name} before update:`, existingCounter);
  
  // Now get the next sequence value
  const result = await db.collection('counters').findOneAndUpdate(
    { _id: name },
    { $inc: { seq: 1 } },
    { returnDocument: 'after' }
  );
  
  console.log(`findOneAndUpdate result for ${name}:`, result);
  
  if (!result || !result.value || typeof result.value.seq !== 'number') {
    console.error(`Failed to get sequence for ${name}, result:`, result);
    
    // Try to manually create and return a sequence
    const manualSeq = await db.collection('counters').findOne({ _id: name });
    if (manualSeq && typeof manualSeq.seq === 'number') {
      const nextSeq = manualSeq.seq + 1;
      await db.collection('counters').updateOne(
        { _id: name },
        { $set: { seq: nextSeq } }
      );
      console.log(`Manual sequence generation for ${name}: ${nextSeq}`);
      return nextSeq;
    }
    
    throw new Error(`Failed to generate sequence for ${name}`);
  }
  
  return result.value.seq;
}

// Helper function to generate conversation title from first message
function generateConversationTitle(firstMessage) {
  const maxLength = 50;
  if (firstMessage.length <= maxLength) {
    return firstMessage;
  }
  return firstMessage.substring(0, maxLength - 3) + '...';
}

// Get conversation count for a specific sentence and user
async function getConversationCount(req, res) {
  try {
    const { sentenceId } = req.params;
    const userId = req.session.user.userId;
    const db = getDb();

    // Get user tier to determine limits
    const user = await db.collection('users').findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const tierLimits = TIER_LIMITS[user.tier];

    // Count existing conversations for this sentence and user
    const conversationCount = await db.collection('conversations')
      .countDocuments({ 
        userId, 
        sentenceId: parseInt(sentenceId), 
        isDeleted: { $ne: true } 
      });

    // Check if user can create more conversations
    const canCreateMore = conversationCount < tierLimits.maxConversationsPerSentence;

    res.json({
      success: true,
      count: conversationCount,
      maxAllowed: tierLimits.maxConversationsPerSentence,
      canCreateMore,
      tier: user.tier
    });

  } catch (error) {
    console.error('Error getting conversation count:', error);
    res.status(500).json({ success: false, message: 'Failed to get conversation count' });
  }
}

// Create a new conversation
async function createConversation(req, res) {
  try {
    const { sentenceId, initialMessage, targetLanguage = 'ko', responseLanguage = 'en', model = 'openai', skipAiResponse = false } = req.body;
    const userId = req.session.user.userId;
    const db = getDb();

    // Get user tier
    const user = await db.collection('users').findOne({ userId });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const tierLimits = TIER_LIMITS[user.tier];

    // Check if sentence-based conversation is allowed for this tier
    let sentence = null;
    if (sentenceId) {
      // Verify sentence exists
      sentence = await db.collection('sentences').findOne({ sentenceId });
      if (!sentence) {
        return res.status(404).json({ success: false, message: 'Sentence not found' });
      }

      // Check conversation limits per sentence for this tier
      const existingConversations = await db.collection('conversations')
        .countDocuments({ userId, sentenceId, isDeleted: { $ne: true } });
      
      if (existingConversations >= tierLimits.maxConversationsPerSentence) {
        return res.status(403).json({ 
          success: false, 
          message: `Your tier allows maximum ${tierLimits.maxConversationsPerSentence} conversation(s) per sentence. Upgrade to Plus for unlimited conversations.` 
        });
      }
    }

    // Generate IDs
    const conversationId = await getNextSequence('conversationId');
    const userMessageId = await getNextSequence('messageId');
    
    const now = new Date();
    const title = generateConversationTitle(initialMessage);

    // Create conversation
    const conversation = {
      conversationId,
      userId,
      title,
      sentenceId: sentenceId || null,
      dateCreated: now,
      lastUpdated: now,
      messageCount: 1,
      userMessageCount: 1,
      isDeleted: false
    };

    // Create initial user message
    const userMessage = {
      messageId: userMessageId,
      conversationId,
      role: 'user',
      content: initialMessage,
      timestamp: now
    };

    // Insert conversation and initial message
    await db.collection('conversations').insertOne(conversation);
    await db.collection('conversation_messages').insertOne(userMessage);

    // Generate AI response for the initial message (unless skipped)
    let aiResponse = null;
    if (!skipAiResponse) {
      try {
        // Prepare context if sentence is linked
        let context = null;
        if (sentence) {
          context = {
            sentenceId,
            sentence: {
              text: sentence.text,
              translation: sentence.analysis?.translation || 'N/A',
              analysis: sentence.analysis // Include full analysis data
            }
          };
        }

        // Generate AI response
        const aiContent = await generateTutorResponse(
          initialMessage,
          targetLanguage,
          responseLanguage,
          context,
          model,
          [] // No conversation history for first message
        );

        // Create AI response message
        const aiMessageId = await getNextSequence('messageId');
        const aiTimestamp = new Date();
        
        aiResponse = {
          messageId: aiMessageId,
          conversationId,
          role: 'assistant',
          content: aiContent,
          timestamp: aiTimestamp
        };

        // Insert AI response and update conversation stats
        await db.collection('conversation_messages').insertOne(aiResponse);
        await db.collection('conversations').updateOne(
          { conversationId },
          { 
            $set: { 
              lastUpdated: aiTimestamp,
              messageCount: 2 // User message + AI response
            }
          }
        );

      } catch (aiError) {
        console.error('Error generating initial AI response:', aiError);
        // Don't fail the conversation creation if AI generation fails
      }
    }

    const response = {
      success: true,
      conversation: {
        conversationId,
        title,
        sentenceId,
        dateCreated: now,
        lastUpdated: aiResponse ? aiResponse.timestamp : now,
        messageCount: aiResponse ? 2 : 1,
        userMessageCount: 1
      }
    };

    // Include AI response if generated
    if (aiResponse) {
      response.initialMessages = [
        {
          messageId: userMessageId,
          role: 'user',
          content: initialMessage,
          timestamp: now
        },
        {
          messageId: aiResponse.messageId,
          role: 'assistant',
          content: aiResponse.content,
          timestamp: aiResponse.timestamp
        }
      ];
    }

    res.json(response);

  } catch (error) {
    console.error('Error creating conversation:', error);
    res.status(500).json({ success: false, message: 'Failed to create conversation' });
  }
}

// Add message to existing conversation
async function addMessage(req, res) {
  try {
    const { conversationId } = req.params;
    const { role, content, targetLanguage = 'ko', responseLanguage = 'en', model = 'openai' } = req.body;
    const userId = req.session.user.userId;
    const db = getDb();

    // Validate role
    if (!['user', 'assistant'].includes(role)) {
      return res.status(400).json({ success: false, message: 'Invalid message role' });
    }

    // Get conversation and verify ownership
    const conversation = await db.collection('conversations')
      .findOne({ conversationId: parseInt(conversationId), userId, isDeleted: { $ne: true } });
    
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Check tier limits for user messages
    if (role === 'user') {
      const user = await db.collection('users').findOne({ userId });
      const tierLimits = TIER_LIMITS[user.tier];
      
      if (conversation.userMessageCount >= tierLimits.maxUserMessages) {
        return res.status(403).json({ 
          success: false, 
          message: `Your tier allows maximum ${tierLimits.maxUserMessages} user message(s) per conversation. Upgrade for more messages.` 
        });
      }
    }

    // Generate message ID
    const userMessageId = await getNextSequence('messageId');
    const now = new Date();

    // Create user message
    const userMessage = {
      messageId: userMessageId,
      conversationId: parseInt(conversationId),
      role,
      content,
      timestamp: now
    };

    // Update conversation stats for user message
    const updateFields = {
      lastUpdated: now,
      messageCount: conversation.messageCount + 1
    };

    if (role === 'user') {
      updateFields.userMessageCount = conversation.userMessageCount + 1;
    }

    // Insert user message and update conversation
    await db.collection('conversation_messages').insertOne(userMessage);
    await db.collection('conversations').updateOne(
      { conversationId: parseInt(conversationId) },
      { $set: updateFields }
    );

    // Generate AI response if user message
    let aiResponse = null;
    if (role === 'user') {
      try {
        // Get conversation history for context
        const conversationHistory = await db.collection('conversation_messages')
          .find({ conversationId: parseInt(conversationId) })
          .sort({ timestamp: 1 })
          .toArray();

        // Get sentence context if conversation is linked to a sentence
        let context = null;
        if (conversation.sentenceId) {
          const sentence = await db.collection('sentences')
            .findOne({ sentenceId: conversation.sentenceId });
          
          if (sentence) {
            context = {
              sentenceId: conversation.sentenceId,
              sentence: {
                text: sentence.text,
                translation: sentence.analysis?.translation || 'N/A',
                analysis: sentence.analysis // Include full analysis data
              }
            };
          }
        }

        // Generate AI response
        const aiContent = await generateTutorResponse(
          content,
          targetLanguage,
          responseLanguage,
          context,
          model,
          conversationHistory.slice(0, -1) // Exclude the message we just added
        );

        // Create AI response message
        const aiMessageId = await getNextSequence('messageId');
        const aiTimestamp = new Date();
        
        aiResponse = {
          messageId: aiMessageId,
          conversationId: parseInt(conversationId),
          role: 'assistant',
          content: aiContent,
          timestamp: aiTimestamp
        };

        // Insert AI response and update conversation stats
        await db.collection('conversation_messages').insertOne(aiResponse);
        await db.collection('conversations').updateOne(
          { conversationId: parseInt(conversationId) },
          { 
            $set: { 
              lastUpdated: aiTimestamp,
              messageCount: conversation.messageCount + 2 // +2 for user message and AI response
            }
          }
        );

      } catch (aiError) {
        console.error('Error generating AI response:', aiError);
        // Don't fail the request if AI generation fails
        // The user message was still saved successfully
      }
    }

    const response = {
      success: true,
      message: {
        messageId: userMessageId,
        role,
        content,
        timestamp: now
      }
    };

    // Include AI response if generated
    if (aiResponse) {
      response.aiResponse = {
        messageId: aiResponse.messageId,
        role: aiResponse.role,
        content: aiResponse.content,
        timestamp: aiResponse.timestamp
      };
    }

    res.json(response);

  } catch (error) {
    console.error('Error adding message:', error);
    res.status(500).json({ success: false, message: 'Failed to add message' });
  }
}

// Get user's conversations (paginated, without full message history)
async function getConversations(req, res) {
  try {
    const userId = req.session.user.userId;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;
    const db = getDb();

    // Get conversations with basic info
    const conversations = await db.collection('conversations')
      .find(
        { userId, isDeleted: { $ne: true } },
        { 
          projection: { 
            conversationId: 1, 
            title: 1, 
            sentenceId: 1, 
            dateCreated: 1, 
            lastUpdated: 1, 
            messageCount: 1,
            userMessageCount: 1
          } 
        }
      )
      .sort({ lastUpdated: -1 })
      .skip(skip)
      .limit(limit)
      .toArray();

    // Get total count for pagination
    const total = await db.collection('conversations')
      .countDocuments({ userId, isDeleted: { $ne: true } });

    // If conversations are linked to sentences, get sentence info
    const conversationsWithSentenceInfo = await Promise.all(
      conversations.map(async (conv) => {
        if (conv.sentenceId) {
          const sentence = await db.collection('sentences')
            .findOne(
              { sentenceId: conv.sentenceId },
              { projection: { text: 1, originalLanguage: 1, translationLanguage: 1 } }
            );
          return { ...conv, sentence };
        }
        return conv;
      })
    );

    res.json({
      success: true,
      conversations: conversationsWithSentenceInfo,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error getting conversations:', error);
    res.status(500).json({ success: false, message: 'Failed to get conversations' });
  }
}

// Get full conversation with all messages
async function getConversation(req, res) {
  try {
    const { conversationId } = req.params;
    const userId = req.session.user.userId;
    const db = getDb();

    // Get conversation and verify ownership
    const conversation = await db.collection('conversations')
      .findOne({ conversationId: parseInt(conversationId), userId, isDeleted: { $ne: true } });
    
    if (!conversation) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    // Get all messages for this conversation
    const messages = await db.collection('conversation_messages')
      .find({ conversationId: parseInt(conversationId) })
      .sort({ timestamp: 1 })
      .toArray();

    // Get sentence info if linked
    let sentence = null;
    if (conversation.sentenceId) {
      sentence = await db.collection('sentences')
        .findOne({ sentenceId: conversation.sentenceId });
    }

    res.json({
      success: true,
      conversation: {
        ...conversation,
        sentence,
        messages
      }
    });

  } catch (error) {
    console.error('Error getting conversation:', error);
    res.status(500).json({ success: false, message: 'Failed to get conversation' });
  }
}

// Delete conversation (soft delete)
async function deleteConversation(req, res) {
  try {
    const { conversationId } = req.params;
    const userId = req.session.user.userId;
    const db = getDb();

    // Verify ownership and update
    const result = await db.collection('conversations').updateOne(
      { conversationId: parseInt(conversationId), userId },
      { $set: { isDeleted: true, lastUpdated: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    res.json({ success: true, message: 'Conversation deleted successfully' });

  } catch (error) {
    console.error('Error deleting conversation:', error);
    res.status(500).json({ success: false, message: 'Failed to delete conversation' });
  }
}

// Update conversation title
async function updateConversationTitle(req, res) {
  try {
    const { conversationId } = req.params;
    const { title } = req.body;
    const userId = req.session.user.userId;
    const db = getDb();

    if (!title || title.trim().length === 0) {
      return res.status(400).json({ success: false, message: 'Title is required' });
    }

    // Verify ownership and update
    const result = await db.collection('conversations').updateOne(
      { conversationId: parseInt(conversationId), userId, isDeleted: { $ne: true } },
      { $set: { title: title.trim(), lastUpdated: new Date() } }
    );

    if (result.matchedCount === 0) {
      return res.status(404).json({ success: false, message: 'Conversation not found' });
    }

    res.json({ success: true, message: 'Conversation title updated successfully' });

  } catch (error) {
    console.error('Error updating conversation title:', error);
    res.status(500).json({ success: false, message: 'Failed to update conversation title' });
  }
}

// Stream message response (for real-time AI responses)
async function addMessageStream(req, res) {
  try {
    const { conversationId } = req.params;
    const { role, content, targetLanguage = 'ko', responseLanguage = 'en', model = 'openai', isFirstMessage = false } = req.body;
    const userId = req.session.user.userId;
    const db = getDb();

    // Set up SSE headers
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache, no-transform');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Headers', 'Cache-Control');
    res.setHeader('X-Accel-Buffering', 'no'); // Disable nginx buffering
    res.flushHeaders();
    
    // Initialize SSE comment to avoid retry delays
    res.write(':\n');
    
    // Send initial connection confirmation
    res.write(`data: ${JSON.stringify({ type: 'connected' })}\n\n`);

    // Validate role
    if (!['user', 'assistant'].includes(role)) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Invalid message role' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // Get conversation and verify ownership
    const conversation = await db.collection('conversations')
      .findOne({ conversationId: parseInt(conversationId), userId, isDeleted: { $ne: true } });
    
    if (!conversation) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: 'Conversation not found' })}\n\n`);
      res.write('data: [DONE]\n\n');
      res.end();
      return;
    }

    // Check tier limits for user messages
    if (role === 'user') {
      const user = await db.collection('users').findOne({ userId });
      const tierLimits = TIER_LIMITS[user.tier];
      
      if (conversation.userMessageCount >= tierLimits.maxUserMessages) {
        res.write(`data: ${JSON.stringify({ 
          type: 'error',
          error: `Your tier allows maximum ${tierLimits.maxUserMessages} user message(s) per conversation. Upgrade for more messages.` 
        })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
        return;
      }
    }

    let userMessageId;
    let now = new Date();

    // Only create user message if it's not the first message (first message already created during conversation creation)
    if (!isFirstMessage) {
      // Generate message ID
      userMessageId = await getNextSequence('messageId');

      // Create user message
      const userMessage = {
        messageId: userMessageId,
        conversationId: parseInt(conversationId),
        role,
        content,
        timestamp: now
      };

      // Update conversation stats for user message
      const updateFields = {
        lastUpdated: now,
        messageCount: conversation.messageCount + 1
      };

      if (role === 'user') {
        updateFields.userMessageCount = conversation.userMessageCount + 1;
      }

      // Insert user message and update conversation
      await db.collection('conversation_messages').insertOne(userMessage);
      await db.collection('conversations').updateOne(
        { conversationId: parseInt(conversationId) },
        { $set: updateFields }
      );

      // Send user message confirmation
      res.write(`data: ${JSON.stringify({
        type: 'userMessage',
        message: {
          messageId: userMessageId,
          role,
          content,
          timestamp: now
        }
      })}\n\n`);
      res.write(':keep-alive\n\n');
    } else {
      // For first message, just send confirmation without creating new message
      res.write(`data: ${JSON.stringify({
        type: 'userMessage',
        message: {
          messageId: 'existing',
          role,
          content,
          timestamp: now
        }
      })}\n\n`);
      res.write(':keep-alive\n\n');
    }

    // Generate AI response if user message
    if (role === 'user') {
      try {
        // Get conversation history for context
        const conversationHistory = await db.collection('conversation_messages')
          .find({ conversationId: parseInt(conversationId) })
          .sort({ timestamp: 1 })
          .toArray();

        // Prepare conversation history for AI (exclude current user message if it was just added)
        let historyForAI;
        if (isFirstMessage) {
          // For first message, use all existing history (should be just the initial user message)
          historyForAI = conversationHistory;
        } else {
          // For subsequent messages, exclude the user message we just added
          historyForAI = conversationHistory.slice(0, -1);
        }

        console.log('Conversation history for AI:', historyForAI.length, 'messages');
        console.log('History contents:', historyForAI.map(m => ({ role: m.role, content: m.content.substring(0, 50) + '...' })));

        // Get sentence context if conversation is linked to a sentence
        let context = null;
        if (conversation.sentenceId) {
          const sentence = await db.collection('sentences')
            .findOne({ sentenceId: conversation.sentenceId });
          
          if (sentence) {
            context = {
              sentenceId: conversation.sentenceId,
              sentence: {
                text: sentence.text,
                translation: sentence.analysis?.translation || 'N/A',
                analysis: sentence.analysis // Include full analysis data
              }
            };
          }
        }

        // Generate AI message ID
        const aiMessageId = await getNextSequence('messageId');
        let aiContent = '';
        
        // Send AI response start notification
        res.write(`data: ${JSON.stringify({
          type: 'aiStart',
          messageId: aiMessageId
        })}\n\n`);
        res.write(':keep-alive\n\n');

        // Stream the AI response
        await generateTutorResponseStream(
          content,
          targetLanguage,
          responseLanguage,
          context,
          model,
          historyForAI, // Use the prepared history
          // onChunk callback
          (chunk) => {
            console.log('Chunk received in controller:', chunk.length, 'chars');
            aiContent += chunk;
            res.write(`data: ${JSON.stringify({
              type: 'aiChunk',
              messageId: aiMessageId,
              chunk: chunk,
              content: aiContent
            })}\n\n`);
            res.write(':keep-alive\n\n'); // Send keep-alive comment
            console.log('Chunk sent to client');
          },
          // onComplete callback
          async (fullResponse) => {
            const aiTimestamp = new Date();
            
            const aiResponse = {
              messageId: aiMessageId,
              conversationId: parseInt(conversationId),
              role: 'assistant',
              content: fullResponse,
              timestamp: aiTimestamp
            };

            // Insert AI response and update conversation stats
            await db.collection('conversation_messages').insertOne(aiResponse);
            await db.collection('conversations').updateOne(
              { conversationId: parseInt(conversationId) },
              { 
                $set: { 
                  lastUpdated: aiTimestamp,
                  messageCount: conversation.messageCount + 2 // +2 for user message and AI response
                }
              }
            );

            // Send completion notification
            res.write(`data: ${JSON.stringify({
              type: 'aiComplete',
              messageId: aiMessageId,
              content: fullResponse,
              timestamp: aiTimestamp
            })}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
          },
          // onError callback
          (error) => {
            console.error('Error generating AI response:', error);
            res.write(`data: ${JSON.stringify({
              type: 'error',
              error: 'Failed to generate AI response'
            })}\n\n`);
            res.write('data: [DONE]\n\n');
            res.end();
          }
        );

      } catch (aiError) {
        console.error('Error in streaming AI response:', aiError);
        res.write(`data: ${JSON.stringify({
          type: 'error',
          error: 'Failed to generate AI response'
        })}\n\n`);
        res.write('data: [DONE]\n\n');
        res.end();
      }
    } else {
      // For non-user messages, just end the stream
      res.end();
    }

  } catch (error) {
    console.error('Error in addMessageStream:', error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      error: 'Failed to add message'
    })}\n\n`);
    res.write('data: [DONE]\n\n');
    res.end();
  }
}

module.exports = {
  createConversation,
  addMessage,
  addMessageStream,
  getConversations,
  getConversation,
  getConversationCount,
  deleteConversation,
  updateConversationTitle,
  TIER_LIMITS
}; 