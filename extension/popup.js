// Toolbar popup for the Hanbok extension.
const { LANGUAGES, SITE_URLS, DEFAULT_SETTINGS } = self.HANBOK;
const SETTING_KEYS = Object.keys(DEFAULT_SETTINGS);

function $(id) {
  return document.getElementById(id);
}

function fillLanguageSelect(select) {
  for (const [code, name] of Object.entries(LANGUAGES)) {
    select.appendChild(new Option(name, code));
  }
}

async function getActiveTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// Resolves to null when the page has no content script (chrome:// pages,
// the Web Store, hanbokstudy.com itself).
async function sendToTab(message) {
  const tab = await getActiveTab();
  if (!tab?.id) return null;
  try {
    return await chrome.tabs.sendMessage(tab.id, message);
  } catch {
    return null;
  }
}

async function loadSettings() {
  const stored = await chrome.storage.sync.get(SETTING_KEYS);
  const settings = { ...DEFAULT_SETTINGS, ...stored };
  $('sourceLanguage').value = settings.sourceLanguage;
  $('targetLanguage').value = settings.targetLanguage;
  $('highlightEnabled').checked = settings.highlightEnabled;
  $('selectionButtonEnabled').checked = settings.selectionButtonEnabled;
  $('useLocalApi').checked = settings.useLocalApi;
}

async function saveSettings() {
  await chrome.storage.sync.set({
    sourceLanguage: $('sourceLanguage').value,
    targetLanguage: $('targetLanguage').value,
    highlightEnabled: $('highlightEnabled').checked,
    selectionButtonEnabled: $('selectionButtonEnabled').checked,
    useLocalApi: $('useLocalApi').checked
  });
  // Content scripts pick the change up from storage; refresh our view.
  setTimeout(refreshStatus, 300);
}

function setStatus(state, text) {
  document.querySelector('.status-dot').className = `status-dot ${state}`;
  $('statusText').textContent = text;
}

async function refreshStatus() {
  const session = await chrome.runtime.sendMessage({ type: 'GET_SESSION' });
  $('authSection').classList.toggle('hidden', !!session?.loggedIn);
  $('statsSection').classList.toggle('hidden', !session?.loggedIn);
  if (!session?.loggedIn) {
    setStatus('disconnected', 'Not logged in');
    return;
  }
  setStatus('connected', session.name || 'Logged in');

  const vocabulary = await chrome.runtime.sendMessage({ type: 'GET_VOCABULARY' });
  $('vocabularyCount').textContent = vocabulary?.words?.length ?? 0;

  const page = await sendToTab({ type: 'GET_HIGHLIGHTED_COUNT' });
  $('highlightedWords').textContent = page ? page.count : '–';
}

async function refreshHighlights() {
  const button = $('refreshHighlights');
  button.disabled = true;
  button.textContent = 'Refreshing…';
  await chrome.runtime.sendMessage({ type: 'GET_VOCABULARY', force: true });
  const page = await sendToTab({ type: 'REFRESH_HIGHLIGHTING' });
  await refreshStatus();
  button.textContent = page ? 'Refreshed' : 'Not available on this page';
  setTimeout(() => {
    button.textContent = 'Refresh highlights';
    button.disabled = false;
  }, 1500);
}

async function openSite(path = '') {
  const { useLocalApi } = await chrome.storage.sync.get('useLocalApi');
  chrome.tabs.create({ url: `${useLocalApi ? SITE_URLS.local : SITE_URLS.production}${path}` });
  window.close();
}

document.addEventListener('DOMContentLoaded', async () => {
  fillLanguageSelect($('sourceLanguage'));
  fillLanguageSelect($('targetLanguage'));
  $('versionInfo').textContent = `v${chrome.runtime.getManifest().version}`;

  await loadSettings();
  for (const key of SETTING_KEYS) $(key).addEventListener('change', saveSettings);

  $('loginBtn').addEventListener('click', () => openSite('/login'));
  $('websiteLink').addEventListener('click', (e) => {
    e.preventDefault();
    openSite();
  });
  $('refreshHighlights').addEventListener('click', refreshHighlights);

  await refreshStatus();
});
