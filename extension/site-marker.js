// Runs on hanbokstudy.com only. Lets the site know the extension is
// installed so it can stop suggesting it.
document.documentElement.dataset.hanbokExtension = chrome.runtime.getManifest().version;
window.dispatchEvent(new CustomEvent('hanbok-extension-ready'));
