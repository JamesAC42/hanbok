'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from '@/components/Dashboard';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from '@/styles/pages/tutor.module.scss';
import Link from 'next/link';
import Image from 'next/image';

export default function TutorPage() {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [currentConversation, setCurrentConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [isLoadingConversations, setIsLoadingConversations] = useState(true);
  const [targetLanguage, setTargetLanguage] = useState('ko');
  const [linkedSentence, setLinkedSentence] = useState(null);
  const [conversationCount, setConversationCount] = useState(null);
  const messagesEndRef = useRef(null);
  
  // Use the existing language context
  const { t, supportedLanguages, getIcon } = useLanguage();

  // Example questions for popular languages
  const exampleQuestions = {
    ko: "How do I use the particle 이/가?",
    ja: "What's the difference between は and が?",
    es: "When do I use ser vs estar?",
    fr: "How do subjunctive verbs work?"
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Authentication check
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace('/login');
    }
    document.title = t('tutor.pageTitle');
  }, [isAuthenticated, loading, router, t]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversations on component mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Handle URL parameters for loading specific conversations and sentences
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const conversationId = urlParams.get('conversation');
    const sentenceId = urlParams.get('sentenceId');
    
    if (conversationId && conversations.length > 0) {
      loadConversation(parseInt(conversationId));
    } else if (sentenceId) {
      loadSentencePreview(sentenceId);
    }
  }, [conversations]);

  const loadSentencePreview = async (sentenceId) => {
    try {
      // Fetch sentence data
      const sentenceResponse = await fetch(`/api/sentences/${sentenceId}`, {
        credentials: 'include'
      });
      
      if (sentenceResponse.ok) {
        const sentenceData = await sentenceResponse.json();
        setLinkedSentence(sentenceData.sentence);
      }

      // Fetch conversation count for this sentence
      const countResponse = await fetch(`/api/sentences/${sentenceId}/conversations/count`, {
        credentials: 'include'
      });
      
      if (countResponse.ok) {
        const countData = await countResponse.json();
        setConversationCount(countData);
      }
    } catch (error) {
      //console.error('Error loading sentence preview:', error);
    }
  };

  const loadConversations = async () => {
    try {
      setIsLoadingConversations(true);
      const response = await fetch('/api/conversations', {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setConversations(data.conversations);
      } else {
        //console.error('Failed to load conversations');
      } 
    } catch (error) {
      //console.error('Error loading conversations:', error);
    } finally {
      setIsLoadingConversations(false);
    }
  };

  const loadConversation = async (conversationId) => {
    try {
      setIsLoading(true);
      const response = await fetch(`/api/conversations/${conversationId}`, {
        credentials: 'include'
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentConversation(data.conversation);
        setMessages(data.conversation.messages);
        setSidebarCollapsed(true);
      } else {
        //console.error('Failed to load conversation');
      }
    } catch (error) {
      //console.error('Error loading conversation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const createNewConversation = async (initialMessage, sentenceId = null) => {
    try {
      setIsLoading(true);
      
      // Add user message to UI immediately
      const userMessage = {
        role: 'user',
        content: initialMessage,
        timestamp: new Date()
      };
      setMessages([userMessage]);
      setInputValue('');

      // Create conversation without AI response first
      const createResponse = await fetch('/api/conversations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          initialMessage,
          sentenceId: sentenceId ? parseInt(sentenceId) : null,
          targetLanguage,
          responseLanguage: 'en',
          model: 'openai',
          skipAiResponse: true // Add flag to skip AI response in creation
        })
      });
      
      if (!createResponse.ok) {
        const error = await createResponse.json();
        throw new Error(error.message || 'Failed to create conversation');
      }

      const conversationData = await createResponse.json();
      setCurrentConversation(conversationData.conversation);

      // Now stream the AI response
      const streamResponse = await fetch(`/api/conversations/${conversationData.conversation.conversationId}/messages/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include',
        body: JSON.stringify({
          role: 'user',
          content: initialMessage,
          targetLanguage,
          responseLanguage: 'en',
          model: 'openai',
          isFirstMessage: true // Flag to handle first message specially
        })
      });

      if (!streamResponse.ok) {
        const errorData = await streamResponse.json();
        throw new Error(errorData.error || 'Failed to get AI response');
      }

      // Handle streaming response (same logic as sendMessage)
      const reader = streamResponse.body.getReader();
      const decoder = new TextDecoder();
      let aiMessageId = null;
      let currentAiMessage = null;
      let accumulatedContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.trim() && line.startsWith('data: ')) {
              try {
                if (line.slice(6).trim() === '[DONE]') {
                  await loadConversations();
                  // Update conversation count if sentence is linked
                  if (sentenceId) {
                    loadSentencePreview(sentenceId);
                  }
                  return;
                }
                
                const data = JSON.parse(line.slice(6));
                
                if (data.error) {
                  throw new Error(data.error);
                }

                switch (data.type) {
                  case 'connected':
                    break;
                    
                  case 'userMessage':
                    // User message already added to UI
                    break;
                    
                  case 'aiStart':
                    aiMessageId = data.messageId;
                    currentAiMessage = {
                      role: 'assistant',
                      content: '',
                      timestamp: new Date(),
                      messageId: aiMessageId,
                      isStreaming: true
                    };
                    setMessages(prev => [...prev, currentAiMessage]);
                    break;
                    
                  case 'aiChunk':
                    if (data.messageId === aiMessageId) {
                      accumulatedContent = data.content;
                      setMessages(prev => prev.map(msg => 
                        msg.messageId === aiMessageId 
                          ? { ...msg, content: accumulatedContent }
                          : msg
                      ));
                    }
                    break;
                    
                  case 'aiComplete':
                    if (data.messageId === aiMessageId) {
                      setMessages(prev => prev.map(msg => 
                        msg.messageId === aiMessageId 
                          ? { 
                              ...msg, 
                              content: data.content,
                              timestamp: new Date(data.timestamp),
                              isStreaming: false
                            }
                          : msg
                      ));
                    }
                    setIsLoading(false);
                    await loadConversations();
                    // Update conversation count if sentence is linked
                    if (sentenceId) {
                      loadSentencePreview(sentenceId);
                    }
                    break;
                }
              } catch (parseError) {
                //console.error('Error parsing SSE data:', parseError);
              }
            }
          }
        }
      } catch (streamError) {
        //console.error('Error reading stream:', streamError);
        throw streamError;
      }
      
    } catch (error) {
      //console.error('Error creating conversation:', error);
      alert(error.message || t('tutor.errors.createFailed'));
      setMessages([]);
      setIsLoading(false);
    }
  };

  const sendMessage = async (content) => {
    // Get sentence ID from URL if available
    const urlParams = new URLSearchParams(window.location.search);
    const sentenceId = urlParams.get('sentenceId');
    
    // Check if user can create new conversations when sentence is linked
    if (!currentConversation && sentenceId && conversationCount && !conversationCount.canCreateMore) {
      alert(t('tutor.sentencePreview.limitReached')
        .replace('{count}', conversationCount.count)
        .replace('{maxAllowed}', conversationCount.maxAllowed));
      return;
    }
    
    if (!currentConversation) {
      // Create new conversation
      await createNewConversation(content, sentenceId);
      return;
    }

    try {
      setIsLoading(true);
      
      // Add user message to UI immediately
      const userMessage = {
        role: 'user',
        content,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, userMessage]);
      setInputValue('');

      // Send to streaming API
      const response = await fetch(`/api/conversations/${currentConversation.conversationId}/messages/stream`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'text/event-stream',
          'Cache-Control': 'no-cache'
        },
        credentials: 'include',
        body: JSON.stringify({
          role: 'user',
          content,
          targetLanguage,
          responseLanguage: 'en',
          model: 'openai' // Use OpenAI for streaming
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let aiMessageId = null;
      let currentAiMessage = null;
      let accumulatedContent = '';

      try {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.trim() && line.startsWith('data: ')) {
              try {
                // Check for done signal
                if (line.slice(6).trim() === '[DONE]') {
                  return;
                }
                
                const data = JSON.parse(line.slice(6));
                
                if (data.error) {
                  throw new Error(data.error);
                }

                switch (data.type) {
                  case 'connected':
                    break;
                    
                  case 'userMessage':
                    // User message confirmed by server (already added to UI)
                    break;
                    
                  case 'aiStart':
                    // AI response started - create placeholder message
                    aiMessageId = data.messageId;
                    currentAiMessage = {
                      role: 'assistant',
                      content: '',
                      timestamp: new Date(),
                      messageId: aiMessageId,
                      isStreaming: true
                    };
                    setMessages(prev => [...prev, currentAiMessage]);
                    break;
                    
                  case 'aiChunk':
                    // Update the AI message with new content
                    if (data.messageId === aiMessageId) {
                      accumulatedContent = data.content;
                      setMessages(prev => prev.map(msg => 
                        msg.messageId === aiMessageId 
                          ? { ...msg, content: accumulatedContent }
                          : msg
                      ));
                    }
                    break;
                    
                  case 'aiComplete':
                    // AI response completed
                    if (data.messageId === aiMessageId) {
                      setMessages(prev => prev.map(msg => 
                        msg.messageId === aiMessageId 
                          ? { 
                              ...msg, 
                              content: data.content,
                              timestamp: new Date(data.timestamp),
                              isStreaming: false
                            }
                          : msg
                      ));
                    }
                    setIsLoading(false);
                    await loadConversations(); // Refresh to update lastUpdated
                    break;
                }
              } catch (parseError) {
                console.error('Error parsing SSE data:', parseError);
              }
            }
          }
        }
      } catch (streamError) {
        console.error('Error reading stream:', streamError);
        throw streamError;
      }

    } catch (error) {
      //console.error('Error sending message:', error);
      alert(error.message || t('tutor.errors.sendFailed'));
      // Remove the user message we optimistically added
      setMessages(prev => prev.slice(0, -1));
      setIsLoading(false);
    }
  };

  const deleteConversation = async (conversationId) => {
    if (!confirm(t('tutor.deleteConfirm'))) {
      return;
    }

    try {
      const response = await fetch(`/api/conversations/${conversationId}`, {
        method: 'DELETE',
        credentials: 'include'
      });
      
      if (response.ok) {
        await loadConversations();
        if (currentConversation?.conversationId === conversationId) {
          setCurrentConversation(null);
          setMessages([]);
        }
      } else {
        const error = await response.json();
        alert(error.message || t('tutor.deleteFailed'));
      }
    } catch (error) {
      //console.error('Error deleting conversation:', error);
              alert(t('tutor.deleteFailed'));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim() && !isLoading) {
      sendMessage(inputValue.trim());
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Don't render while main auth is loading
  if (loading || !isAuthenticated) return null;

  return (
    <Dashboard>
      <div className={styles.tutorContainer}>
        {/* Sidebar */}
        <div className={`${styles.sidebar} ${sidebarCollapsed ? styles.collapsed : ''}`}>
          <div className={styles.sidebarHeader}>
            <h3>{t('tutor.chatHistory')}</h3>
            <button 
              className={styles.toggleButton}
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              title={t('tutor.collapseSidebar')}
            >
              ← 
            </button>
          </div>
          
          <button 
            className={styles.newChatButton}
            onClick={() => {
              setCurrentConversation(null);
              setMessages([]);
              setSidebarCollapsed(true);
            }}
          >
            {t('tutor.newChat')}
          </button>
          
          <div className={styles.conversationsList}>
            {isLoadingConversations ? (
              <div className={styles.loadingConversations}>
                {t('tutor.loadingConversations')}
              </div>
            ) : conversations.length > 0 ? (
              conversations.map(conversation => (
                <div
                  key={conversation.conversationId}
                  className={`${styles.conversationItem} ${
                    currentConversation?.conversationId === conversation.conversationId ? styles.active : ''
                  }`}
                  onClick={() => loadConversation(conversation.conversationId)}
                >
                  <div className={styles.conversationTitle}>
                    {conversation.title}
                  </div>
                  <div className={styles.conversationMeta}>
                    <span>{formatDate(conversation.lastUpdated)}</span>
                    <button
                      className={styles.deleteButton}
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteConversation(conversation.conversationId);
                      }}
                      title={t('tutor.deleteConversation')}
                    >
                      🗑️
                    </button>
                  </div>
                  {conversation.sentence && (
                    <div className={styles.conversationSentence}>
                      {t('tutor.linkedTo')} "{conversation.sentence.text.substring(0, 50)}..."
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className={styles.noConversations}>
                {t('tutor.noConversations')}
              </div>
            )}
          </div>
        </div>

        {/* Main Content */}
        <div className={styles.mainContent}>
          {sidebarCollapsed && (
            <button 
              className={styles.collapsedToggle}
              onClick={() => setSidebarCollapsed(false)}
              title={t('tutor.showSidebar')}
            >
              →
            </button>
          )}
          
          {/* Sentence Preview Banner */}
          {linkedSentence && !currentConversation && (
            <div className={styles.sentencePreview}>
              <div className={styles.sentencePreviewHeader}>
                <h3>{t('tutor.sentencePreview.title')}</h3>
                {conversationCount && (
                  <span className={styles.conversationStats}>
                    {conversationCount.count}/{conversationCount.maxAllowed === Infinity ? '∞' : conversationCount.maxAllowed} {t('tutor.sentencePreview.conversationsUsed')}
                  </span>
                )}
              </div>
              <div className={styles.sentenceText}>
                "{linkedSentence.text}"
              </div>
              {linkedSentence.analysis?.translation && (
                <div className={styles.sentenceTranslation}>
                  "{linkedSentence.analysis.translation}"
                </div>
              )}
              {conversationCount && !conversationCount.canCreateMore && (
                <div className={styles.limitWarning}>
                  {t('tutor.sentencePreview.limitWarning')}
                </div>
              )}
            </div>
          )}
          
          {currentConversation ? (
            <>
              <div className={styles.chatHeader}>
                <h1>{currentConversation.title}</h1>
              </div>
              
              {/* Sentence Context Banner for Active Conversations */}
              {currentConversation.sentence && (
                <div className={styles.activeSentenceContext}>
                  <div className={styles.activeSentenceHeader}>
                    <span className={styles.contextLabel}>{t('tutor.activeSentence.discussing')}</span>
                    <Link 
                      href={`/sentence/${currentConversation.sentenceId}`}
                      className={styles.viewAnalysisLink}
                    >
                      {t('tutor.activeSentence.viewAnalysis')}
                    </Link>
                  </div>
                  <div className={styles.activeSentenceText}>
                    "{currentConversation.sentence.text}"
                  </div>
                  {currentConversation.sentence.analysis?.translation && (
                    <div className={styles.activeSentenceTranslation}>
                      "{currentConversation.sentence.analysis.translation}"
                    </div>
                  )}
                </div>
              )}
              
              <div className={styles.chatMessages}>
                {messages.map((message, index) => (
                  <div key={index} className={`${styles.messageWrapper} ${styles[message.role]}`}>
                    {message.role === 'assistant' && (
                      <div className={styles.tutorBubble}>
                        <Image 
                          src="/images/speakers/female.png"
                          alt={t('tutor.messages.aiTutor')} 
                          width={633}
                          height={784}
                        />
                      </div>
                    )}
                    <div className={`${styles.message} ${styles[message.role]} ${message.isStreaming ? styles.streaming : ''}`}>
                      {message.role === 'assistant' ? (
                        <MarkdownRenderer content={message.content} />
                      ) : (
                        <div>{message.content}</div>
                      )}
                      {message.isStreaming && (
                        <div className={styles.streamingIndicator}>
                          <span>{t('tutor.messages.writing')}</span>
                          <div className={styles.loadingDots}>
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        </div>
                      )}
                      <div className={styles.messageTimestamp}>
                        {formatDate(message.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
                
                {isLoading && !messages.some(msg => msg.isStreaming) && (
                  <div className={`${styles.messageWrapper} ${styles.assistant}`}>
                    <div className={styles.tutorBubble}>
                      <Image 
                        src="/images/speakers/female.png"
                        alt={t('tutor.messages.aiTutor')} 
                        width={633}
                        height={784}
                      />
                    </div>
                    
                    <div className={styles.loadingMessage}>
                      <span>{t('tutor.messages.aiThinking')}</span>
                      <div className={styles.loadingDots}>
                        <span></span>
                        <span></span>
                        <span></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </>
          ) : (
            <div className={styles.emptyState}>
              <div className={styles.tutorIntro}>
                <div className={styles.tutorCharacter}>
                  <Image 
                    src="/images/speakers/female.png"
                    alt={t('tutor.messages.aiTutor')} 
                    width={633}
                    height={784}
                    className={styles.tutorCharacter}
                  />
                </div>
                <div className={styles.tutorIntroText}>
                  <h2>{t('tutor.intro.title')}</h2>
                  <div className={styles.languageSwitcher}>
                    <label className={styles.languageLabel}>
                      {t('tutor.intro.chooseLanguage')}
                    </label>
                    <select 
                      value={targetLanguage}
                      onChange={(e) => setTargetLanguage(e.target.value)}
                      className={styles.languageSelect}
                    >
                      {Object.entries(supportedLanguages).map(([code, name]) => (
                        <option key={code} value={code}>
                          {name.charAt(0).toUpperCase() + name.slice(1)}
                        </option>
                      ))}
                    </select>
                  </div>
                  <p>
                    {t('tutor.intro.description')}
                  </p>
                  
                  {/* Language Switcher */}
                  

                  <div className={styles.exampleQuestions}>
                    <strong>{t('tutor.intro.tryAsking')}</strong>
                    <ul className={styles.exampleList}>
                      {Object.entries(exampleQuestions).map(([lang, question]) => (
                        <li key={lang} className={styles.exampleItem}>
                          <span className={styles.exampleIcon}>
                            {getIcon(lang)}
                          </span>
                          <span>"{question}"</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
              {/* 
              Tier Limitations (for reference):
              - Free: 1 message per conversation, 1 conversation per sentence
              - Basic: 200 messages per conversation, 1 conversation per sentence  
              - Plus: 200 messages per conversation, unlimited conversations per sentence
              */}
            </div>
          )}
          
          <div className={styles.chatInput}>
            <form onSubmit={handleSubmit} className={styles.inputContainer}>
              <textarea
                className={styles.messageInput}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={
                  currentConversation 
                    ? t('tutor.messages.typePlaceholder')
                    : t('tutor.messages.startPlaceholder')
                }
                disabled={isLoading}
                rows={1}
              />
              <button 
                type="submit" 
                className={styles.sendButton}
                disabled={!inputValue.trim() || isLoading}
              >
                {t('tutor.messages.send')}
              </button>
            </form>
          </div>
        </div>
      </div>
    </Dashboard>
  );
}