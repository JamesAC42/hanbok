import { useState } from 'react';
import { useRouter } from 'next/navigation';

export const useConversations = () => {
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();

  const createConversation = async (initialMessage, sentenceId = null, options = {}) => {
    try {
      setIsCreating(true);
      const response = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          initialMessage,
          sentenceId,
          targetLanguage: options.targetLanguage || 'ko',
          responseLanguage: options.responseLanguage || 'en',
          model: options.model || 'anthropic'
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          success: true,
          conversation: data.conversation
        };
      } else {
        const error = await response.json();
        return {
          success: false,
          error: error.message || 'Failed to create conversation'
        };
      }
    } catch (error) {
      console.error('Error creating conversation:', error);
      return {
        success: false,
        error: 'Failed to create conversation'
      };
    } finally {
      setIsCreating(false);
    }
  };

  const createConversationFromSentence = async (sentence, question = null) => {
    const initialMessage = question || `Can you help me understand this sentence: "${sentence.text}"`;
    const result = await createConversation(initialMessage, sentence.sentenceId);
    
    if (result.success) {
      // Navigate to tutor page with the new conversation
      router.push(`/tutor?conversation=${result.conversation.conversationId}`);
    }
    
    return result;
  };

  const askAboutWord = async (word, context = null) => {
    const initialMessage = context 
      ? `Can you explain the word "${word}" in this context: "${context}"`
      : `Can you explain the word "${word}" and how to use it?`;
    
    const result = await createConversation(initialMessage);
    
    if (result.success) {
      router.push(`/tutor?conversation=${result.conversation.conversationId}`);
    }
    
    return result;
  };

  const askAboutGrammar = async (grammarPoint, examples = []) => {
    let initialMessage = `Can you explain the grammar pattern "${grammarPoint}"?`;
    
    if (examples.length > 0) {
      initialMessage += ` Here are some examples: ${examples.join(', ')}`;
    }
    
    const result = await createConversation(initialMessage);
    
    if (result.success) {
      router.push(`/tutor?conversation=${result.conversation.conversationId}`);
    }
    
    return result;
  };

  return {
    createConversation,
    createConversationFromSentence,
    askAboutWord,
    askAboutGrammar,
    isCreating
  };
};

export default useConversations; 