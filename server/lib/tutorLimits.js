/**
 * Tier limitations for Tutor conversations:
 * Free: 5 conversations/month, 1 conversation per sentence, and 5 messages per conversation
 * Basic: 50 conversations/month, 2 conversations per sentence, and 15 messages per conversation
 * Plus: 200 conversations/month, unlimited conversations per sentence, and 50 messages per conversation
 */
const TIER_LIMITS = {
  0: { maxUserMessages: 5, maxConversationsPerSentence: 1, monthlyConversations: 5 }, // Free
  1: { maxUserMessages: 15, maxConversationsPerSentence: 2, monthlyConversations: 50 }, // Basic
  2: { maxUserMessages: 50, maxConversationsPerSentence: Infinity, monthlyConversations: 200 } // Plus
};

module.exports = { TIER_LIMITS };
