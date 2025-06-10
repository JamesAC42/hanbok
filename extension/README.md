# Kankoku Language Assistant - Chrome Extension

A Chrome extension that enhances your language learning experience by integrating with the Kankoku language learning platform. This extension provides real-time vocabulary highlighting, sentence analysis, and native audio generation directly on any webpage.

## 🚀 Features

### 1. **Vocabulary Highlighting**
- Automatically highlights your vocabulary words from your Kankoku deck on any website
- Customizable highlighting with hover effects and click interactions
- Real-time highlighting that adapts to dynamic content

### 2. **Sentence Analysis**
- Right-click on selected text to analyze sentences with AI-powered grammar breakdown
- Detailed word-by-word analysis with meanings and parts of speech
- Grammar notes and contextual explanations
- Support for Korean, Japanese, Chinese, and Russian

### 3. **Quick Word Addition**
- Double-click any word to quickly add it to your vocabulary deck
- Right-click context menu for adding selected words
- Instant feedback and deck synchronization

### 4. **Native Audio Generation**
- Generate high-quality native pronunciation for any selected text
- Automatic text-to-speech using ElevenLabs integration
- Audio playback controls with visual feedback

### 5. **Smart UI Integration**
- Non-intrusive popup interfaces that don't interfere with website functionality
- Responsive design that works on all screen sizes
- Accessibility features including keyboard navigation and high contrast support

## 📁 File Structure

```
extension/
├── manifest.json          # Extension configuration and permissions
├── background.js          # Service worker for API communication
├── content.js            # Content script for webpage interaction
├── content.css           # Styles for content script elements
├── popup.html            # Extension popup interface
├── popup.css             # Popup styling
├── popup.js              # Popup functionality
├── icons/                # Extension icons (16, 32, 48, 128px)
│   └── README.md         # Icon requirements documentation
└── README.md             # This file
```

## 🛠 Installation

### For Development:

1. **Clone the repository** (if not already done):
   ```bash
   git clone <repository-url>
   cd kankoku/extension
   ```

2. **Open Chrome Extensions page**:
   - Navigate to `chrome://extensions/`
   - Enable "Developer mode" (toggle in top right)

3. **Load the extension**:
   - Click "Load unpacked"
   - Select the `extension` folder from this project

4. **Configure the extension**:
   - Click the extension icon in the toolbar
   - Set your preferred learning and native languages
   - Toggle "Use Local Development Server" if testing locally

### For Production:

1. **Package the extension**:
   ```bash
   # Create a ZIP file of the extension folder
   zip -r kankoku-extension.zip extension/
   ```

2. **Upload to Chrome Web Store**:
   - Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole/)
   - Upload the ZIP file and fill out store listing details

## ⚙️ Configuration

### Language Settings
- **Learning Language**: The language you're studying (Korean, Japanese, Chinese, Russian)
- **Native Language**: Your native language for translations (English, Spanish, French, German, Portuguese)

### API Configuration
- **Production**: Uses `https://hanbokstudy.com` API endpoints
- **Development**: Can be configured to use `http://localhost:5666` for local testing

### Authentication
- Extension automatically detects authentication status with the Kankoku platform
- Login through the extension popup or directly on the website
- Vocabulary and analysis features require authentication

## 🧪 Testing

### Manual Testing

1. **Vocabulary Highlighting**:
   - Log in to Kankoku and add some vocabulary words to your deck
   - Visit any website with text in your learning language
   - Verify that your vocabulary words are highlighted with yellow background
   - Test hover effects and click interactions

2. **Sentence Analysis**:
   - Select any sentence in your learning language
   - Right-click and choose "Analyze with Kankoku"
   - Verify the analysis popup appears with correct breakdown
   - Test the save functionality

3. **Word Addition**:
   - Double-click on any word in your learning language
   - Verify notification appears confirming addition to deck
   - Check that highlighting updates immediately

4. **Audio Generation**:
   - Select text and right-click "Generate Native Audio"
   - Verify audio plays correctly
   - Test with different text lengths and languages

5. **Popup Interface**:
   - Click extension icon to open popup
   - Test all settings changes
   - Verify statistics update correctly
   - Test quick action buttons

### Automated Testing

The extension can be tested using Chrome's built-in extension testing tools:

```javascript
// Example test script for console
chrome.runtime.sendMessage({type: 'GET_VOCABULARY'}, (response) => {
  console.log('Vocabulary count:', response?.length || 0);
});
```

### Test Websites

Good websites for testing the extension:
- **Korean**: naver.com, joins.com, koreatimes.co.kr
- **Japanese**: nhk.or.jp, asahi.com, mainichi.jp
- **Chinese**: xinhuanet.com, people.com.cn
- **Russian**: rbc.ru, lenta.ru, ria.ru

## 🔧 Development

### Key Components

1. **Background Script (`background.js`)**:
   - Handles API communication with Kankoku servers
   - Manages authentication state
   - Processes context menu interactions

2. **Content Script (`content.js`)**:
   - Injects vocabulary highlighting into webpages
   - Handles text selection and user interactions
   - Manages popup interfaces for analysis

3. **Popup Interface (`popup.html/js/css`)**:
   - Extension settings and configuration
   - User statistics and progress tracking
   - Quick actions and status indicators

### API Integration

The extension integrates with the following Kankoku API endpoints:

- `GET /api/session` - Check authentication status
- `GET /api/words` - Fetch user vocabulary
- `POST /api/submit` - Analyze sentences
- `POST /api/words` - Add words to deck
- `POST /api/sentences/:id/generate-audio` - Generate audio
- `GET /api/audio-url/:id` - Get audio file URLs

### Message Passing

The extension uses Chrome's message passing for communication:

```javascript
// Background to Content
chrome.tabs.sendMessage(tabId, {
  type: 'SHOW_ANALYSIS',
  data: analysisResult
});

// Content to Background
chrome.runtime.sendMessage({
  type: 'ANALYZE_TEXT',
  text: selectedText
});
```

## 🐛 Troubleshooting

### Common Issues

1. **Extension not loading**:
   - Check console for errors in `chrome://extensions/`
   - Verify all files are present and properly formatted
   - Try reloading the extension

2. **Highlighting not working**:
   - Ensure you're logged in to Kankoku
   - Check that you have vocabulary words in your deck
   - Verify the correct language is selected in settings

3. **Analysis popup not appearing**:
   - Check internet connection
   - Verify API endpoints are accessible
   - Look for error messages in browser console

4. **Audio not playing**:
   - Check browser audio permissions
   - Verify site allows autoplay audio
   - Test with different browsers

### Debug Mode

Enable debug logging by opening browser console and setting:

```javascript
localStorage.setItem('kankoku-debug', 'true');
```

## 🔒 Privacy & Security

- Extension only accesses content on websites you visit (required for highlighting)
- No data is stored locally except user preferences
- All API communication uses HTTPS encryption
- Authentication tokens are handled securely through Chrome's storage API

## 📋 Requirements

- Chrome browser version 88+ (Manifest V3 support)
- Active internet connection for API features
- Kankoku account for full functionality (highlighting works without login)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly across different websites and languages
5. Submit a pull request with detailed description

## 📄 License

This extension is part of the Kankoku language learning platform. See the main project license for details.

## 🆘 Support

For issues or questions:
- Open an issue in the main repository
- Contact support through the Kankoku website
- Check the troubleshooting section above

---

**Happy language learning! 🌟** 