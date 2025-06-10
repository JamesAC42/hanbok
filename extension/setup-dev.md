# Quick Development Setup

This guide helps you quickly set up the Kankoku Chrome extension for development and testing.

## Prerequisites

- Chrome browser (version 88+)
- Active Kankoku account (create at [hanbokstudy.com](https://hanbokstudy.com))
- Access to the Kankoku API (localhost:5666 for development)

## Quick Start

### 1. Load Extension in Chrome

1. Open Chrome and navigate to `chrome://extensions/`
2. Enable "Developer mode" (toggle in top-right corner)
3. Click "Load unpacked" button
4. Select the `extension` folder from this project

### 2. Configure for Development

1. Click the extension icon in Chrome toolbar
2. Check "Use Local Development Server" if testing with localhost
3. Set your learning language (Korean recommended for testing)
4. Set your native language (English recommended)

### 3. Test Basic Functionality

1. **Login Test**:
   - Click "Open Kankoku Website" button in extension popup
   - Log in to your account
   - Return to extension popup and verify "Connected" status

2. **Vocabulary Test**:
   - Add some vocabulary words to your deck on the website
   - Visit a webpage with content in your learning language
   - Verify words are highlighted with yellow background

3. **Analysis Test**:
   - Select any sentence in your learning language
   - Right-click and choose "Analyze with Kankoku"
   - Verify analysis popup appears with word breakdown

## Development Workflow

### Making Changes

1. **Content Script Changes** (`content.js`, `content.css`):
   - Reload the webpage to see changes
   - Or use the extension popup "Refresh Highlights" button

2. **Background Script Changes** (`background.js`):
   - Go to `chrome://extensions/`
   - Click the refresh button on the extension card

3. **Popup Changes** (`popup.html`, `popup.js`, `popup.css`):
   - Close and reopen the extension popup
   - Or reload the extension entirely

### Debugging

1. **Background Script**:
   - Go to `chrome://extensions/`
   - Click "service worker" link under your extension
   - Use the DevTools console

2. **Content Script**:
   - Open DevTools on any webpage
   - Check the Console tab for logs
   - Look for "Kankoku Language Assistant" messages

3. **Popup**:
   - Right-click the extension popup
   - Select "Inspect" to open DevTools

### Test Data

For consistent testing, use these test words in your deck:

**Korean**: 안녕, 감사, 학교, 친구, 음식
**Japanese**: こんにちは, ありがとう, 学校, 友達, 食べ物
**Chinese**: 你好, 谢谢, 学校, 朋友, 食物
**Russian**: привет, спасибо, школа, друг, еда

## Common Development Issues

### Extension Not Loading
- Check manifest.json syntax with a JSON validator
- Verify all file paths exist and are correctly referenced
- Check Chrome DevTools console for syntax errors

### API Requests Failing
- Ensure the local server is running on localhost:5666
- Check CORS configuration allows extension origin
- Verify API endpoints are accessible

### Highlighting Not Working
- Check that vocabulary exists in user's deck
- Verify correct language is selected in extension settings
- Look for JavaScript errors in browser console

### Changes Not Appearing
- Make sure to reload extension after background script changes
- Clear cache with Ctrl+Shift+R on test pages
- Check if content script is properly injected

## Useful Commands

```bash
# Check extension files
ls -la extension/

# Validate manifest.json
cat extension/manifest.json | python -m json.tool

# Create production build
zip -r kankoku-extension.zip extension/ -x "*.md" "setup-dev.md"
```

## Production Checklist

Before releasing:

- [ ] Test on multiple websites and languages
- [ ] Verify all API endpoints work in production
- [ ] Test with and without authentication
- [ ] Check accessibility features
- [ ] Validate manifest.json
- [ ] Test icon visibility at all sizes
- [ ] Verify permissions are minimal and necessary
- [ ] Test error handling for network failures

## Next Steps

1. Follow the main README for comprehensive testing procedures
2. Set up the main Kankoku application for full integration testing
3. Consider setting up automated testing with Chrome extension testing frameworks 