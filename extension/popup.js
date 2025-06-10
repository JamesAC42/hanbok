// Popup JavaScript for Kankoku Language Assistant
let isAuthenticated = false;
let vocabularyCount = 0;

// Initialize popup
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Popup loaded');
  
  // Load settings and check authentication
  await loadSettings();
  await checkAuthStatus();
  await updateStats();
  
  // Set up event listeners
  setupEventListeners();
});

// Load saved settings
async function loadSettings() {
  try {
    const settings = await chrome.storage.sync.get([
      'sourceLanguage',
      'targetLanguage',
      'useLocalApi'
    ]);
    
    // Set language selects
    const sourceSelect = document.getElementById('sourceLanguage');
    const targetSelect = document.getElementById('targetLanguage');
    const localApiToggle = document.getElementById('useLocalApi');
    
    if (sourceSelect) {
      sourceSelect.value = settings.sourceLanguage || 'ko';
    }
    
    if (targetSelect) {
      targetSelect.value = settings.targetLanguage || 'en';
    }
    
    if (localApiToggle) {
      localApiToggle.checked = settings.useLocalApi || false;
    }
  } catch (error) {
    console.error('Failed to load settings:', error);
  }
}

// Save settings
async function saveSettings() {
  try {
    const sourceLanguage = document.getElementById('sourceLanguage').value;
    const targetLanguage = document.getElementById('targetLanguage').value;
    const useLocalApi = document.getElementById('useLocalApi').checked;
    
    await chrome.storage.sync.set({
      sourceLanguage,
      targetLanguage,
      useLocalApi
    });
    
    console.log('Settings saved');
    
    // Refresh highlighting with new settings
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      chrome.tabs.sendMessage(tab.id, { type: 'REFRESH_HIGHLIGHTING' });
    }
  } catch (error) {
    console.error('Failed to save settings:', error);
  }
}

// Check authentication status
async function checkAuthStatus() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'CHECK_AUTH' });
    isAuthenticated = response || false;
    
    updateAuthUI();
  } catch (error) {
    console.error('Failed to check auth status:', error);
    isAuthenticated = false;
    updateAuthUI();
  }
}

// Update authentication UI
function updateAuthUI() {
  const statusDot = document.querySelector('.status-dot');
  const statusText = document.querySelector('.status-text');
  const authSection = document.getElementById('authSection');
  const settingsSection = document.getElementById('settingsSection');
  const statsSection = document.getElementById('statsSection');
  
  if (isAuthenticated) {
    statusDot.className = 'status-dot connected';
    statusText.textContent = 'Connected';
    authSection.classList.add('hidden');
    settingsSection.classList.remove('hidden');
    statsSection.classList.remove('hidden');
  } else {
    statusDot.className = 'status-dot disconnected';
    statusText.textContent = 'Not logged in';
    authSection.classList.remove('hidden');
    settingsSection.classList.remove('hidden'); // Allow settings even when not logged in
    statsSection.classList.add('hidden');
  }
}

// Update statistics
async function updateStats() {
  try {
    // Get vocabulary count
    const vocabulary = await chrome.runtime.sendMessage({ type: 'GET_VOCABULARY' });
    vocabularyCount = vocabulary ? vocabulary.length : 0;
    
    // Update vocabulary count display
    const vocabularyCountElement = document.getElementById('vocabularyCount');
    if (vocabularyCountElement) {
      vocabularyCountElement.textContent = vocabularyCount;
    }
    
    // Get highlighted words count from current tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      try {
        const response = await chrome.tabs.sendMessage(tab.id, { type: 'GET_HIGHLIGHTED_COUNT' });
        const highlightedCount = response?.count || 0;
        
        const highlightedWordsElement = document.getElementById('highlightedWords');
        if (highlightedWordsElement) {
          highlightedWordsElement.textContent = highlightedCount;
        }
      } catch (error) {
        // Tab might not have content script loaded
        console.log('Could not get highlighted count from tab');
      }
    }
  } catch (error) {
    console.error('Failed to update stats:', error);
  }
}

// Set up event listeners
function setupEventListeners() {
  // Language settings
  const sourceSelect = document.getElementById('sourceLanguage');
  const targetSelect = document.getElementById('targetLanguage');
  const localApiToggle = document.getElementById('useLocalApi');
  
  if (sourceSelect) {
    sourceSelect.addEventListener('change', saveSettings);
  }
  
  if (targetSelect) {
    targetSelect.addEventListener('change', saveSettings);
  }
  
  if (localApiToggle) {
    localApiToggle.addEventListener('change', saveSettings);
  }
  
  // Login button
  const loginBtn = document.getElementById('loginBtn');
  if (loginBtn) {
    loginBtn.addEventListener('click', openWebsite);
  }
  
  // Action buttons
  const refreshBtn = document.getElementById('refreshHighlights');
  if (refreshBtn) {
    refreshBtn.addEventListener('click', refreshHighlights);
  }
  
  const clearBtn = document.getElementById('clearHighlights');
  if (clearBtn) {
    clearBtn.addEventListener('click', clearHighlights);
  }
  
  // Footer links
  const websiteLink = document.getElementById('websiteLink');
  if (websiteLink) {
    websiteLink.addEventListener('click', openWebsite);
  }
  
  const helpLink = document.getElementById('helpLink');
  if (helpLink) {
    helpLink.addEventListener('click', openHelp);
  }
}

// Open website
async function openWebsite(e) {
  e.preventDefault();
  
  try {
    const settings = await chrome.storage.sync.get(['useLocalApi']);
    const baseUrl = settings.useLocalApi ? 'http://localhost:3000' : 'https://hanbokstudy.com';
    
    chrome.tabs.create({ url: baseUrl });
    window.close();
  } catch (error) {
    console.error('Failed to open website:', error);
  }
}

// Open help
function openHelp(e) {
  e.preventDefault();
  
  // For now, just open the main website
  chrome.tabs.create({ url: 'https://hanbokstudy.com' });
  window.close();
}

// Refresh highlights
async function refreshHighlights() {
  try {
    const refreshBtn = document.getElementById('refreshHighlights');
    const originalText = refreshBtn.innerHTML;
    
    // Show loading state
    refreshBtn.innerHTML = '<span class="btn-icon">⏳</span>Refreshing...';
    refreshBtn.disabled = true;
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await chrome.tabs.sendMessage(tab.id, { type: 'REFRESH_HIGHLIGHTING' });
      
      // Update stats
      await updateStats();
      
      // Show success briefly
      refreshBtn.innerHTML = '<span class="btn-icon">✅</span>Refreshed!';
      
      setTimeout(() => {
        refreshBtn.innerHTML = originalText;
        refreshBtn.disabled = false;
      }, 1500);
    }
  } catch (error) {
    console.error('Failed to refresh highlights:', error);
    
    const refreshBtn = document.getElementById('refreshHighlights');
    refreshBtn.innerHTML = '<span class="btn-icon">❌</span>Failed';
    refreshBtn.disabled = false;
    
    setTimeout(() => {
      refreshBtn.innerHTML = '<span class="btn-icon">🔄</span>Refresh Highlights';
    }, 1500);
  }
}

// Clear highlights
async function clearHighlights() {
  try {
    const clearBtn = document.getElementById('clearHighlights');
    const originalText = clearBtn.innerHTML;
    
    // Show loading state
    clearBtn.innerHTML = '<span class="btn-icon">⏳</span>Clearing...';
    clearBtn.disabled = true;
    
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tab) {
      await chrome.tabs.sendMessage(tab.id, { type: 'CLEAR_HIGHLIGHTING' });
      
      // Update stats
      await updateStats();
      
      // Show success briefly
      clearBtn.innerHTML = '<span class="btn-icon">✅</span>Cleared!';
      
      setTimeout(() => {
        clearBtn.innerHTML = originalText;
        clearBtn.disabled = false;
      }, 1500);
    }
  } catch (error) {
    console.error('Failed to clear highlights:', error);
    
    const clearBtn = document.getElementById('clearHighlights');
    clearBtn.innerHTML = '<span class="btn-icon">❌</span>Failed';
    clearBtn.disabled = false;
    
    setTimeout(() => {
      clearBtn.innerHTML = '<span class="btn-icon">🧹</span>Clear Highlights';
    }, 1500);
  }
}

// Handle messages from content script
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'UPDATE_STATS':
      updateStats();
      break;
      
    case 'AUTH_STATUS_CHANGED':
      checkAuthStatus();
      break;
  }
});

// Periodically update stats when popup is open
setInterval(async () => {
  if (document.visibilityState === 'visible') {
    await updateStats();
  }
}, 5000); 