// Extension configuration
const API_BASE_URL = 'https://hanbokstudy.com'; // Use localhost:5666 for development
const LOCAL_API_BASE_URL = 'http://localhost:5666';

// Initialize extension
chrome.runtime.onInstalled.addListener(() => {
  console.log('Kankoku Language Assistant installed');
  
  // Create context menu for sentence analysis
  chrome.contextMenus.create({
    id: 'analyzeSentence',
    title: 'Analyze with Kankoku',
    contexts: ['selection']
  });
  
  // Create context menu for adding words to deck
  chrome.contextMenus.create({
    id: 'addToDeck',
    title: 'Add to Vocabulary Deck',
    contexts: ['selection']
  });
  
  // Create context menu for generating audio
  chrome.contextMenus.create({
    id: 'generateAudio',
    title: 'Generate Native Audio',
    contexts: ['selection']
  });
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  const selectedText = info.selectionText?.trim();
  if (!selectedText) return;
  
  switch (info.menuItemId) {
    case 'analyzeSentence':
      await analyzeSentence(selectedText, tab);
      break;
    case 'addToDeck':
      await addWordToDeck(selectedText, tab);
      break;
    case 'generateAudio':
      await generateAudio(selectedText, tab);
      break;
  }
});

// API helper functions
async function getApiUrl() {
  const result = await chrome.storage.sync.get(['useLocalApi']);
  return result.useLocalApi ? LOCAL_API_BASE_URL : API_BASE_URL;
}

async function makeApiRequest(endpoint, options = {}) {
  const baseUrl = await getApiUrl();
  const url = `${baseUrl}${endpoint}`;
  
  try {
    const response = await fetch(url, {
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    });
    
    if (!response.ok) {
      throw new Error(`API request failed: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error('API request error:', error);
    throw error;
  }
}

// Check authentication status
async function checkAuth() {
  try {
    const data = await makeApiRequest('/api/session');
    return data.isAuthenticated;
  } catch (error) {
    console.error('Auth check failed:', error);
    return false;
  }
}

// Get user's vocabulary words
async function getUserVocabulary() {
  try {
    if (!(await checkAuth())) {
      return [];
    }
    
    const data = await makeApiRequest('/api/words');
    return data.words || [];
  } catch (error) {
    console.error('Failed to fetch vocabulary:', error);
    return [];
  }
}

// Analyze selected sentence
async function analyzeSentence(text, tab) {
  try {
    const settings = await chrome.storage.sync.get(['sourceLanguage', 'targetLanguage']);
    const sourceLanguage = settings.sourceLanguage || 'ko';
    const targetLanguage = settings.targetLanguage || 'en';
    
    const response = await makeApiRequest('/api/submit', {
      method: 'POST',
      body: JSON.stringify({
        text: text,
        originalLanguage: sourceLanguage,
        translationLanguage: targetLanguage
      })
    });
    
    if (response.message?.isValid) {
      // Send result to content script for display
      chrome.tabs.sendMessage(tab.id, {
        type: 'SHOW_ANALYSIS',
        data: {
          analysis: response.message.analysis,
          sentenceId: response.sentenceId,
          originalLanguage: sourceLanguage,
          translationLanguage: targetLanguage
        }
      });
    } else {
      chrome.tabs.sendMessage(tab.id, {
        type: 'SHOW_ERROR',
        message: 'Failed to analyze sentence'
      });
    }
  } catch (error) {
    console.error('Sentence analysis failed:', error);
    chrome.tabs.sendMessage(tab.id, {
      type: 'SHOW_ERROR',
      message: 'Failed to analyze sentence'
    });
  }
}

// Add word to vocabulary deck
async function addWordToDeck(text, tab) {
  try {
    if (!(await checkAuth())) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'SHOW_ERROR',
        message: 'Please log in to add words to your deck'
      });
      return;
    }
    
    const settings = await chrome.storage.sync.get(['sourceLanguage']);
    const language = settings.sourceLanguage || 'ko';
    
    const response = await makeApiRequest('/api/words', {
      method: 'POST',
      body: JSON.stringify({
        word: text,
        language: language
      })
    });
    
    if (response.success) {
      chrome.tabs.sendMessage(tab.id, {
        type: 'SHOW_SUCCESS',
        message: `Added "${text}" to your vocabulary deck`
      });
      
      // Refresh vocabulary highlighting
      chrome.tabs.sendMessage(tab.id, {
        type: 'REFRESH_HIGHLIGHTING'
      });
    } else {
      chrome.tabs.sendMessage(tab.id, {
        type: 'SHOW_ERROR',
        message: 'Failed to add word to deck'
      });
    }
  } catch (error) {
    console.error('Failed to add word:', error);
    chrome.tabs.sendMessage(tab.id, {
      type: 'SHOW_ERROR',
      message: 'Failed to add word to deck'
    });
  }
}

// Generate native audio for text
async function generateAudio(text, tab) {
  try {
    const settings = await chrome.storage.sync.get(['sourceLanguage']);
    const language = settings.sourceLanguage || 'ko';
    
    // First analyze the sentence to get sentence ID
    const analysisResponse = await makeApiRequest('/api/submit', {
      method: 'POST',
      body: JSON.stringify({
        text: text,
        originalLanguage: language,
        translationLanguage: 'en'
      })
    });
    
    if (!analysisResponse.message?.isValid) {
      throw new Error('Failed to analyze text for audio generation');
    }
    
    const sentenceId = analysisResponse.sentenceId;
    
    // Generate audio for the sentence
    const audioResponse = await makeApiRequest(`/api/sentences/${sentenceId}/generate-audio`, {
      method: 'POST'
    });
    
    if (audioResponse.success) {
      // Get audio URL
      const audioUrlResponse = await makeApiRequest(`/api/audio-url/${sentenceId}`);
      
      if (audioUrlResponse.success) {
        chrome.tabs.sendMessage(tab.id, {
          type: 'PLAY_AUDIO',
          audioUrl: audioUrlResponse.audioUrl
        });
      }
    } else {
      throw new Error('Failed to generate audio');
    }
  } catch (error) {
    console.error('Audio generation failed:', error);
    chrome.tabs.sendMessage(tab.id, {
      type: 'SHOW_ERROR',
      message: 'Failed to generate audio'
    });
  }
}

// Handle messages from content script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'GET_VOCABULARY':
      getUserVocabulary().then(sendResponse);
      return true; // Keep message channel open for async response
      
    case 'CHECK_AUTH':
      checkAuth().then(sendResponse);
      return true;
      
    case 'ANALYZE_TEXT':
      analyzeSentence(message.text, sender.tab).then(() => sendResponse({ success: true }));
      return true;
      
    case 'ADD_WORD':
      addWordToDeck(message.word, sender.tab).then(() => sendResponse({ success: true }));
      return true;
      
    case 'GENERATE_AUDIO':
      generateAudio(message.text, sender.tab).then(() => sendResponse({ success: true }));
      return true;
  }
}); 