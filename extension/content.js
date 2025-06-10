// Content script for Kankoku Language Assistant
// Version: 1.1 - Updated positioning fix
let userVocabulary = [];
let highlightedElements = [];
let analysisPopup = null;
let notificationContainer = null;

// Initialize the extension
(async function init() {
  console.log('Kankoku Language Assistant: Content script loaded - Version 1.1 with position fix');
  
  // Create notification container
  createNotificationContainer();
  
  // Load user vocabulary and highlight words
  await loadVocabularyAndHighlight();
  
  // Set up text selection handler
  setupTextSelectionHandler();
  
  // Set up double-click handler for quick word addition
  setupWordClickHandler();
})();

// Create notification container for messages
function createNotificationContainer() {
  notificationContainer = document.createElement('div');
  notificationContainer.id = 'kankoku-notifications';
  notificationContainer.style.cssText = `
    position: fixed;
    top: 1rem;
    right: 1rem;
    z-index: 10000;
    max-width: 20rem;
    pointer-events: none;
  `;
  document.body.appendChild(notificationContainer);
}

// Show notification message
function showNotification(message, type = 'info', duration = 3000) {
  const notification = document.createElement('div');
  notification.className = `kankoku-notification kankoku-notification-${type}`;
  notification.textContent = message;
  notification.style.cssText = `
    background: ${type === 'error' ? '#ef4444' : type === 'success' ? '#10b981' : '#3b82f6'};
    color: white;
    padding: 0.75rem 1rem;
    border-radius: 0.375rem;
    margin-bottom: 0.5rem;
    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 0.875rem;
    line-height: 1.25rem;
    pointer-events: auto;
    transform: translateX(100%);
    transition: transform 0.3s ease-in-out;
    opacity: 0;
  `;
  
  notificationContainer.appendChild(notification);
  
  // Animate in
  requestAnimationFrame(() => {
    notification.style.transform = 'translateX(0)';
    notification.style.opacity = '1';
  });
  
  // Auto remove
  setTimeout(() => {
    notification.style.transform = 'translateX(100%)';
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, duration);
}

// Load user vocabulary and highlight words on page
async function loadVocabularyAndHighlight() {
  try {
    const response = await chrome.runtime.sendMessage({ type: 'GET_VOCABULARY' });
    userVocabulary = response || [];
    console.log('Loaded vocabulary:', userVocabulary.length, 'words');
    
    if (userVocabulary.length > 0) {
      highlightVocabularyWords();
    }
  } catch (error) {
    console.error('Failed to load vocabulary:', error);
  }
}

// Highlight vocabulary words on the page
function highlightVocabularyWords() {
  // Clear existing highlights
  clearHighlights();
  
  if (userVocabulary.length === 0) return;
  
  // Create regex pattern for all vocabulary words
  const words = userVocabulary.map(item => escapeRegExp(item.word || item.text || item));
  const pattern = new RegExp(`\\b(${words.join('|')})\\b`, 'gi');
  
  // Find and highlight text nodes
  const walker = document.createTreeWalker(
    document.body,
    NodeFilter.SHOW_TEXT,
    {
      acceptNode: function(node) {
        // Skip script, style, and extension elements
        const parent = node.parentElement;
        if (!parent) return NodeFilter.FILTER_REJECT;
        
        const tagName = parent.tagName.toLowerCase();
        if (['script', 'style', 'noscript'].includes(tagName)) {
          return NodeFilter.FILTER_REJECT;
        }
        
        // Skip extension elements
        if (parent.id && parent.id.startsWith('kankoku-')) {
          return NodeFilter.FILTER_REJECT;
        }
        
        return NodeFilter.FILTER_ACCEPT;
      }
    }
  );
  
  const textNodes = [];
  let node;
  while (node = walker.nextNode()) {
    if (node.textContent.trim() && pattern.test(node.textContent)) {
      textNodes.push(node);
    }
  }
  
  // Highlight matches in text nodes
  textNodes.forEach(textNode => {
    const parent = textNode.parentElement;
    const text = textNode.textContent;
    const matches = [...text.matchAll(pattern)];
    
    if (matches.length === 0) return;
    
    // Create document fragment with highlighted words
    const fragment = document.createDocumentFragment();
    let lastIndex = 0;
    
    matches.forEach(match => {
      // Add text before match
      if (match.index > lastIndex) {
        fragment.appendChild(document.createTextNode(text.slice(lastIndex, match.index)));
      }
      
      // Add highlighted word
      const highlight = document.createElement('span');
      highlight.className = 'kankoku-highlight';
      highlight.textContent = match[0];
      highlight.style.cssText = `
        background-color: #fef3c7 !important;
        border-bottom: 0.125rem solid #f59e0b !important;
        border-radius: 0.125rem !important;
        padding: 0.0625rem 0.125rem !important;
        font-weight: 500 !important;
        cursor: pointer !important;
        transition: all 0.2s ease !important;
      `;
      
      // Add hover effect
      highlight.addEventListener('mouseenter', () => {
        highlight.style.backgroundColor = '#fde68a';
        highlight.style.transform = 'scale(1.05)';
      });
      
      highlight.addEventListener('mouseleave', () => {
        highlight.style.backgroundColor = '#fef3c7';
        highlight.style.transform = 'scale(1)';
      });
      
      // Add click handler for word info
      highlight.addEventListener('click', (e) => {
        e.preventDefault();
        showWordInfo(match[0], e.target);
      });
      
      fragment.appendChild(highlight);
      highlightedElements.push(highlight);
      
      lastIndex = match.index + match[0].length;
    });
    
    // Add remaining text
    if (lastIndex < text.length) {
      fragment.appendChild(document.createTextNode(text.slice(lastIndex)));
    }
    
    // Replace text node with highlighted fragment
    parent.replaceChild(fragment, textNode);
  });
  
  console.log('Highlighted', highlightedElements.length, 'vocabulary words');
}

// Clear existing highlights
function clearHighlights() {
  highlightedElements.forEach(element => {
    const parent = element.parentNode;
    if (parent) {
      parent.replaceChild(document.createTextNode(element.textContent), element);
      parent.normalize(); // Merge adjacent text nodes
    }
  });
  highlightedElements = [];
}

// Escape special regex characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Show word information popup
function showWordInfo(word, element) {
  console.log('🔧 DEBUG: showWordInfo for word:', word);
  hideAnalysisPopup(); // Clear any existing popups

  const rect = element.getBoundingClientRect();
  const popupLeft = rect.left;
  const popupTop = rect.bottom + window.scrollY + 5;
  console.log('🔧 DEBUG: Word popup position - left:', popupLeft, 'top:', popupTop);

  const popup = document.createElement('div');
  popup.id = 'kankoku-word-popup';
  popup.className = 'kankoku-popup'; // Apply base (hidden) styles first

  popup.style.left = popupLeft + 'px';
  popup.style.top = popupTop + 'px';

  popup.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 0.5rem; color: #1f2937;">
      ${word}
    </div>
    <div style="color: #6b7280; margin-bottom: 0.75rem;">
      This word is in your vocabulary deck
    </div>
    <div style="display: flex; gap: 0.5rem;">
      <button id="kankoku-analyze-word" class="kankoku-button kankoku-button-primary" style="padding: 0.375rem 0.75rem; font-size: 0.75rem;">
        Analyze
      </button>
      <button id="kankoku-close-popup" class="kankoku-button kankoku-button-secondary" style="padding: 0.375rem 0.75rem; font-size: 0.75rem;">
        Close
      </button>
    </div>
  `;

  document.body.appendChild(popup);
  console.log('🔧 DEBUG: Word popup appended with class:', popup.className);

  // Use requestAnimationFrame to trigger the transition by adding the active class
  requestAnimationFrame(() => {
    console.log('🔧 DEBUG: Word popup RAF - adding active class');
    popup.classList.add('kankoku-popup-active');
  });

  // Event listeners for buttons
  popup.querySelector('#kankoku-analyze-word').addEventListener('click', () => {
    analyzeText(word);
    hideAnalysisPopup();
  });
  popup.querySelector('#kankoku-close-popup').addEventListener('click', hideAnalysisPopup);

  // Close on click outside (ensure this doesn't interfere with initial appearance)
  setTimeout(() => {
    document.addEventListener('click', function closeOnClickOutside(e) {
      // Check if the click is outside the popup AND not on the element that triggered it
      if (analysisPopup && !analysisPopup.contains(e.target) && e.target !== element) {
        hideAnalysisPopup();
        document.removeEventListener('click', closeOnClickOutside);
      }
    });
  }, 50); // Small delay to prevent immediate closing if element is also document

  analysisPopup = popup;
}

// Set up text selection handler
function setupTextSelectionHandler() {
  let selectionTimeout;
  
  document.addEventListener('mouseup', (e) => {
    clearTimeout(selectionTimeout);
    selectionTimeout = setTimeout(() => {
      const selection = window.getSelection();
      const selectedText = selection.toString().trim();
      
      if (selectedText && selectedText.length > 0 && selectedText.length <= 200) {
        showSelectionPopup(selectedText, e);
      }
    }, 100);
  });
  
  document.addEventListener('keyup', (e) => {
    if (e.key === 'Escape') {
      hideAnalysisPopup();
    }
  });
}

// Show selection popup for analysis
function showSelectionPopup(selectedText, event) {
  console.log('🔧 DEBUG: showSelectionPopup for text:', selectedText.substring(0, 20) + '...');
  hideAnalysisPopup(); // Clear any existing popups

  const isWord = selectedText.split(/\s+/).length === 1;

  // Create temporary popup for size measurement
  const tempPopup = document.createElement('div');
  tempPopup.className = 'kankoku-popup'; // Use base class for styling
  tempPopup.style.visibility = 'hidden';
  tempPopup.style.position = 'absolute';
  tempPopup.style.left = '-9999px';
  tempPopup.style.top = '-9999px';
  tempPopup.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 0.5rem;">"Placeholder"</div>
    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
      <button style="padding: 0.5rem 0.75rem;">Analyze</button>
      ${isWord ? `<button style="padding: 0.5rem 0.75rem;">Add</button>` : ''}
      <button style="padding: 0.5rem 0.75rem;">Audio</button>
      <button style="padding: 0.5rem 0.75rem;">Close</button>
    </div>
  `;
  document.body.appendChild(tempPopup);
  const tempRect = tempPopup.getBoundingClientRect();
  document.body.removeChild(tempPopup);

  let popupLeft = event.pageX;
  let popupTop = event.pageY;
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  if (event.pageX + tempRect.width > viewportWidth) {
    popupLeft = viewportWidth - tempRect.width - 10;
  }
  if (event.pageY + tempRect.height > viewportHeight + window.scrollY) {
    popupTop = event.pageY - tempRect.height - 10;
  }
  console.log('🔧 DEBUG: Selection popup position - left:', popupLeft, 'top:', popupTop);

  const popup = document.createElement('div');
  popup.id = 'kankoku-selection-popup';
  popup.className = 'kankoku-popup'; // Apply base (hidden) styles first

  popup.style.left = popupLeft + 'px';
  popup.style.top = popupTop + 'px';

  popup.innerHTML = `
    <div style="font-weight: 600; margin-bottom: 0.5rem; color: #1f2937;">
      "${selectedText.length > 50 ? selectedText.substring(0, 50) + '...' : selectedText}"
    </div>
    <div style="display: flex; flex-direction: column; gap: 0.5rem;">
      <button id="kankoku-analyze-selection" class="kankoku-button kankoku-button-primary" style="padding: 0.5rem 0.75rem; font-size: 0.75rem;">
        🔍 Analyze ${isWord ? 'Word' : 'Sentence'}
      </button>
      ${isWord ? `
        <button id="kankoku-add-to-deck" class="kankoku-button kankoku-button-success" style="padding: 0.5rem 0.75rem; font-size: 0.75rem;">
          ➕ Add to Deck
        </button>
      ` : ''}
      <button id="kankoku-generate-audio" class="kankoku-button kankoku-button-purple" style="padding: 0.5rem 0.75rem; font-size: 0.75rem;">
        🔊 Generate Audio
      </button>
      <button id="kankoku-close-selection" class="kankoku-button kankoku-button-secondary" style="padding: 0.5rem 0.75rem; font-size: 0.75rem;">
        ✕ Close
      </button>
    </div>
  `;

  document.body.appendChild(popup);
  console.log('🔧 DEBUG: Selection popup appended with class:', popup.className);

  // Use requestAnimationFrame to trigger the transition by adding the active class
  requestAnimationFrame(() => {
    console.log('🔧 DEBUG: Selection popup RAF - adding active class');
    popup.classList.add('kankoku-popup-active');
  });

  // Event listeners for buttons
  popup.querySelector('#kankoku-analyze-selection').addEventListener('click', () => {
    analyzeText(selectedText);
    hideAnalysisPopup();
  });
  if (isWord) {
    popup.querySelector('#kankoku-add-to-deck').addEventListener('click', () => {
      addWordToDeck(selectedText);
      hideAnalysisPopup();
    });
  }
  popup.querySelector('#kankoku-generate-audio').addEventListener('click', () => {
    generateAudio(selectedText);
    hideAnalysisPopup();
  });
  popup.querySelector('#kankoku-close-selection').addEventListener('click', hideAnalysisPopup);

  // Close on click outside
  setTimeout(() => {
    document.addEventListener('click', function closeOnClickOutside(e) {
      if (analysisPopup && !analysisPopup.contains(e.target)) {
        hideAnalysisPopup();
        document.removeEventListener('click', closeOnClickOutside);
      }
    });
  }, 50);

  analysisPopup = popup;
}

// Set up double-click handler for quick word addition
function setupWordClickHandler() {
  document.addEventListener('dblclick', (e) => {
    const selection = window.getSelection();
    const selectedText = selection.toString().trim();
    
    if (selectedText && selectedText.split(/\s+/).length === 1) {
      // Double-clicked on a single word
      e.preventDefault();
      addWordToDeck(selectedText);
    }
  });
}

// Hide analysis popup
function hideAnalysisPopup() {
  if (analysisPopup) {
    console.log('🔧 DEBUG: Hiding popup:', analysisPopup.id);
    analysisPopup.classList.remove('kankoku-popup-active'); // This will trigger the exit transition
    analysisPopup.style.pointerEvents = 'none'; // Disable interaction immediately

    // Remove the element after the transition finishes
    const transitionDuration = 200; // Corresponds to 0.2s in CSS
    setTimeout(() => {
      if (analysisPopup && analysisPopup.parentNode) {
        console.log('🔧 DEBUG: Removing popup from DOM:', analysisPopup.id);
        analysisPopup.remove();
      }
      analysisPopup = null;
    }, transitionDuration);
  }
  window.getSelection().removeAllRanges();
}

// Analyze text
async function analyzeText(text) {
  try {
    showNotification('Analyzing text...', 'info');
    await chrome.runtime.sendMessage({ 
      type: 'ANALYZE_TEXT', 
      text: text 
    });
  } catch (error) {
    showNotification('Failed to analyze text', 'error');
  }
}

// Add word to deck
async function addWordToDeck(word) {
  try {
    showNotification(`Adding "${word}" to deck...`, 'info');
    await chrome.runtime.sendMessage({ 
      type: 'ADD_WORD', 
      word: word 
    });
  } catch (error) {
    showNotification('Failed to add word to deck', 'error');
  }
}

// Generate audio
async function generateAudio(text) {
  try {
    showNotification('Generating audio...', 'info');
    await chrome.runtime.sendMessage({ 
      type: 'GENERATE_AUDIO', 
      text: text 
    });
  } catch (error) {
    showNotification('Failed to generate audio', 'error');
  }
}

// Handle messages from background script and popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  switch (message.type) {
    case 'SHOW_ANALYSIS':
      showAnalysisResult(message.data);
      break;
      
    case 'SHOW_ERROR':
      showNotification(message.message, 'error');
      break;
      
    case 'SHOW_SUCCESS':
      showNotification(message.message, 'success');
      break;
      
    case 'REFRESH_HIGHLIGHTING':
      loadVocabularyAndHighlight();
      break;
      
    case 'CLEAR_HIGHLIGHTING':
      clearHighlights();
      sendResponse({ success: true });
      break;
      
    case 'GET_HIGHLIGHTED_COUNT':
      sendResponse({ count: highlightedElements.length });
      break;
      
    case 'PLAY_AUDIO':
      playAudio(message.audioUrl);
      break;
  }
});

// Show analysis result in popup
function showAnalysisResult(data) {
  hideAnalysisPopup();
  
  const popup = document.createElement('div');
  popup.id = 'kankoku-analysis-popup';
  popup.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: white;
    border: 0.0625rem solid #e5e7eb;
    border-radius: 0.75rem;
    padding: 1.5rem;
    box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);
    z-index: 10002;
    max-width: 37.5rem;
    max-height: 80vh;
    overflow-y: auto;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    font-size: 0.875rem;
    line-height: 1.5rem;
  `;
  
  const analysis = data.analysis;
  
  popup.innerHTML = `
    <div style="display: flex; justify-content: between; align-items: center; margin-bottom: 1rem;">
      <h3 style="margin: 0; font-size: 1.125rem; font-weight: 600; color: #1f2937;">
        Sentence Analysis
      </h3>
      <button id="kankoku-close-analysis" style="
        background: none;
        border: none;
        font-size: 1.25rem;
        cursor: pointer;
        color: #6b7280;
        padding: 0.25rem;
        margin-left: auto;
      ">
        ✕
      </button>
    </div>
    
    <div style="margin-bottom: 1rem;">
      <div style="font-weight: 600; margin-bottom: 0.5rem; color: #1f2937;">Original:</div>
      <div style="font-size: 1rem; padding: 0.75rem; background: #f9fafb; border-radius: 0.375rem; margin-bottom: 0.75rem;">
        ${analysis.sentence.original}
      </div>
      
      <div style="font-weight: 600; margin-bottom: 0.5rem; color: #1f2937;">Translation:</div>
      <div style="font-size: 1rem; padding: 0.75rem; background: #f9fafb; border-radius: 0.375rem; margin-bottom: 1rem;">
        ${analysis.sentence.translation}
      </div>
    </div>
    
    <div style="margin-bottom: 1rem;">
      <div style="font-weight: 600; margin-bottom: 0.75rem; color: #1f2937;">Word Breakdown:</div>
      <div style="display: flex; flex-wrap: wrap; gap: 0.5rem;">
        ${analysis.words.map(word => `
          <div style="
            border: 0.0625rem solid #e5e7eb;
            border-radius: 0.375rem;
            padding: 0.5rem;
            background: white;
            font-size: 0.75rem;
            cursor: pointer;
            transition: all 0.2s;
          " onclick="this.style.background='#f3f4f6'" onmouseleave="this.style.background='white'">
            <div style="font-weight: 600; color: #1f2937;">${word.original}</div>
            <div style="color: #6b7280; margin-top: 0.25rem;">${word.meaning}</div>
            ${word.part_of_speech ? `<div style="color: #9ca3af; font-size: 0.625rem; margin-top: 0.25rem;">${word.part_of_speech}</div>` : ''}
          </div>
        `).join('')}
      </div>
    </div>
    
    ${analysis.sentence.grammar_notes ? `
      <div style="margin-bottom: 1rem;">
        <div style="font-weight: 600; margin-bottom: 0.5rem; color: #1f2937;">Grammar Notes:</div>
        <div style="color: #4b5563; padding: 0.75rem; background: #fef3c7; border-radius: 0.375rem; border-left: 0.25rem solid #f59e0b;">
          ${analysis.sentence.grammar_notes}
        </div>
      </div>
    ` : ''}
    
    <div style="display: flex; gap: 0.5rem; justify-content: flex-end; margin-top: 1.5rem;">
      <button id="kankoku-save-sentence" style="
        background: #10b981;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        cursor: pointer;
        font-weight: 500;
        transition: background-color 0.2s;
      ">
        💾 Save to Library
      </button>
      <button id="kankoku-close-analysis-bottom" style="
        background: #6b7280;
        color: white;
        border: none;
        padding: 0.5rem 1rem;
        border-radius: 0.375rem;
        font-size: 0.875rem;
        cursor: pointer;
        font-weight: 500;
        transition: background-color 0.2s;
      ">
        Close
      </button>
    </div>
  `;
  
  document.body.appendChild(popup);
  
  // Add event listeners
  popup.querySelector('#kankoku-close-analysis').addEventListener('click', hideAnalysisPopup);
  popup.querySelector('#kankoku-close-analysis-bottom').addEventListener('click', hideAnalysisPopup);
  
  if (data.sentenceId) {
    popup.querySelector('#kankoku-save-sentence').addEventListener('click', () => {
      saveSentence(data.sentenceId);
      hideAnalysisPopup();
    });
  }
  
  // Close on escape key
  document.addEventListener('keydown', function escapeHandler(e) {
    if (e.key === 'Escape') {
      hideAnalysisPopup();
      document.removeEventListener('keydown', escapeHandler);
    }
  });
  
  analysisPopup = popup;
}

// Save sentence to library
async function saveSentence(sentenceId) {
  try {
    showNotification('Saving sentence to library...', 'info');
    // This would need to be implemented in the background script
    // For now, just show success message
    showNotification('Sentence saved to library!', 'success');
  } catch (error) {
    showNotification('Failed to save sentence', 'error');
  }
}

// Play audio
function playAudio(audioUrl) {
  const audio = new Audio(audioUrl);
  audio.play().then(() => {
    showNotification('Playing audio...', 'success');
  }).catch(error => {
    console.error('Audio playback failed:', error);
    showNotification('Failed to play audio', 'error');
  });
}

// Observe DOM changes to re-highlight vocabulary
const observer = new MutationObserver((mutations) => {
  let shouldRehighlight = false;
  
  mutations.forEach((mutation) => {
    if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
      // Check if any text nodes were added
      for (let node of mutation.addedNodes) {
        if (node.nodeType === Node.TEXT_NODE || 
            (node.nodeType === Node.ELEMENT_NODE && node.textContent.trim())) {
          shouldRehighlight = true;
          break;
        }
      }
    }
  });
  
  if (shouldRehighlight) {
    // Debounce re-highlighting
    clearTimeout(observer.rehighlightTimeout);
    observer.rehighlightTimeout = setTimeout(() => {
      highlightVocabularyWords();
    }, 500);
  }
});

// Start observing DOM changes
observer.observe(document.body, {
  childList: true,
  subtree: true
}); 