// Content script for the Hanbok extension.
// Page text is only ever written with textContent, and all of the
// extension's own UI lives in a shadow root so the page's CSS can't
// restyle it (and ours can't leak into the page).
(function () {
  if (window.top !== window || window.__hanbokLoaded) return;
  window.__hanbokLoaded = true;

  const { DEFAULT_SETTINGS } = self.HANBOK;
  const { buildVocabularyPattern, looksLikeLanguage, findVocabularyWord } = self.HANBOK_HIGHLIGHT;

  const HIGHLIGHT_CLASS = 'hanbok-highlight';
  const SKIP_TAGS = new Set(['SCRIPT', 'STYLE', 'NOSCRIPT', 'TEXTAREA', 'INPUT', 'SELECT', 'OPTION', 'CODE', 'PRE', 'SVG', 'MATH']);
  const MAX_SELECTION = 300;
  const BLOCK_SELECTOR = 'p, li, td, th, dd, dt, blockquote, figcaption, h1, h2, h3, h4, h5, h6, article, section, div';

  let settings = { ...DEFAULT_SETTINGS };
  let vocabulary = []; // [{ word, meaning }]
  let savedWords = new Map(); // word -> { word, meaning }
  let pattern = null;
  let highlightCount = 0;

  // ---------------------------------------------------------------------
  // Shadow UI

  const host = document.createElement('hanbok-extension-root');
  host.style.cssText = 'all: initial; position: fixed; inset: 0; pointer-events: none; z-index: 2147483647;';
  const shadow = host.attachShadow({ mode: 'closed' });
  const style = document.createElement('style');
  style.textContent = self.HANBOK_UI_CSS;
  shadow.appendChild(style);
  const toastStack = el('div', { className: 'toasts' });
  shadow.appendChild(toastStack);
  let floating = null; // selection button or word card
  let modal = null;

  function mountHost() {
    if (!host.isConnected) document.documentElement.appendChild(host);
  }

  // The site's two fonts. @font-face has to be declared against the
  // document rather than inside the shadow root, because Chrome resolves
  // font faces document-wide. The family names are prefixed so they can't
  // collide with the page's own fonts, and a page whose
  // Content-Security-Policy blocks the files just falls back to its
  // system sans.
  function loadFonts() {
    const url = (file) => chrome.runtime.getURL(`fonts/${file}`);
    const style = document.createElement('style');
    style.textContent = `
      @font-face {
        font-family: 'Hanbok Lilita';
        src: url('${url('LilitaOne-Regular.ttf')}') format('truetype');
        font-weight: 400;
        font-display: swap;
      }
      @font-face {
        font-family: 'Hanbok Montserrat';
        src: url('${url('Montserrat-Variable.ttf')}') format('truetype-variations');
        font-weight: 100 900;
        font-display: swap;
      }`;
    document.documentElement.appendChild(style);
  }

  // Small DOM helper: el('div', { className: 'x', onclick }, [children])
  function el(tag, props = {}, children = []) {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(props)) {
      if (value === undefined || value === null) continue;
      if (key.startsWith('on')) node.addEventListener(key.slice(2), value);
      else if (key === 'className' || key === 'textContent' || key === 'title' || key === 'type' || key === 'disabled') node[key] = value;
      else node.setAttribute(key, value);
    }
    for (const child of [].concat(children)) {
      if (child === null || child === undefined || child === false) continue;
      node.appendChild(typeof child === 'string' ? document.createTextNode(child) : child);
    }
    return node;
  }

  // `action` is an optional { label, path } link to the Hanbok site.
  // Kkachi, the magpie from the site. Poses: head-3, speak, think,
  // celebrate (see extension/images/mascot).
  function mascot(pose, size, { motion = '', alt = 'Kkachi the magpie' } = {}) {
    return el('img', {
      className: `mascot ${motion}`.trim(),
      src: chrome.runtime.getURL(`images/mascot/magpie-${pose}.webp`),
      width: String(size),
      height: String(size),
      alt,
      draggable: 'false'
    });
  }

  function toast(message, type = 'info', action = null) {
    mountHost();
    const node = el('div', { className: `toast toast-${type}`, role: 'status' }, [
      type === 'success' ? mascot('celebrate', 28, { alt: '' }) : null,
      el('div', {}, [message])
    ]);
    if (action) {
      const link = el('a', { className: 'toast-action', target: '_blank', rel: 'noopener', textContent: action.label });
      siteUrl().then((url) => link.setAttribute('href', `${url}${action.path}`));
      node.lastChild.appendChild(link);
    }
    toastStack.appendChild(node);
    const duration = action ? 6000 : 3000;
    setTimeout(() => node.classList.add('toast-out'), duration);
    setTimeout(() => node.remove(), duration + 300);
  }

  function siteUrl() {
    return send({ type: 'GET_SITE_URL' }).then((url) => (typeof url === 'string' ? url : 'https://hanbokstudy.com'));
  }

  function errorToast(result, fallback) {
    if (result?.upgrade) toast(result.error, 'info', { label: 'See Hanbok Plus', path: '/pricing' });
    else toast(result?.error || fallback, 'error');
  }

  function send(message) {
    return chrome.runtime.sendMessage(message).catch((error) => {
      // The extension was reloaded or updated; this page's script is orphaned.
      console.warn('Hanbok: background unavailable', error);
      return { success: false, error: 'Hanbok was updated. Reload this page to keep using it.' };
    });
  }

  function hideFloating() {
    floating?.remove();
    floating = null;
  }

  function closeModal() {
    modal?.remove();
    modal = null;
  }

  function placeFloating(node, rect) {
    mountHost();
    hideFloating();
    floating = node;
    shadow.appendChild(node);
    const width = node.offsetWidth;
    const height = node.offsetHeight;
    let left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8);
    let top = rect.bottom + 8;
    if (top + height > window.innerHeight - 8) top = Math.max(8, rect.top - height - 8);
    node.style.left = `${left}px`;
    node.style.top = `${top}px`;
  }

  // ---------------------------------------------------------------------
  // Analysis

  async function analyze(text) {
    hideFloating();
    showModal(el('div', { className: 'loading' }, [
      mascot('think', 64, { motion: 'bob', alt: '' }),
      el('div', { className: 'spinner' }),
      'Analyzing…'
    ]));
    const result = await send({ type: 'ANALYZE', text });
    if (!modal) return; // closed while waiting
    if (!result?.success) {
      showModal(el('div', { className: 'error' }, [
        mascot('think', 64, { alt: '' }),
        el('p', { textContent: result?.error || 'Failed to analyze the text.' })
      ]));
      return;
    }
    showModal(renderAnalysis(result));
  }

  function showModal(content) {
    mountHost();
    if (!modal) {
      modal = el('div', { className: 'backdrop', onclick: (e) => { if (e.target === modal) closeModal(); } }, [
        el('div', { className: 'modal', role: 'dialog', 'aria-label': 'Hanbok analysis' }, [
          el('div', { className: 'modal-header' }, [
            mascot('head-3', 30, { alt: '' }),
            el('span', { className: 'brand', textContent: 'Hanbok' }),
            el('button', { className: 'icon-button', title: 'Close', 'aria-label': 'Close', textContent: '✕', onclick: closeModal })
          ]),
          el('div', { className: 'modal-body' })
        ])
      ]);
      shadow.appendChild(modal);
    }
    const body = modal.querySelector('.modal-body');
    body.replaceChildren(content);
    body.scrollTop = 0;
  }

  function renderAnalysis({ analysis, sentenceId, originalLanguage, translationLanguage, weeklyQuota, siteUrl }) {
    const sentence = analysis?.sentence || {};
    const components = (analysis?.components || []).filter((c) => c && c.type !== 'punctuation');
    const grammarPoints = analysis?.grammar_points || [];

    const audioButton = el('button', { className: 'button', textContent: '🔊 Listen' });
    audioButton.addEventListener('click', () => playAudio(sentenceId, audioButton));

    const saveButton = el('button', { className: 'button', textContent: 'Save sentence' });
    saveButton.addEventListener('click', async () => {
      saveButton.disabled = true;
      const result = await send({ type: 'SAVE_SENTENCE', sentenceId });
      if (result?.success) {
        saveButton.textContent = 'Saved';
        toast('Sentence saved to your library', 'success');
      } else {
        saveButton.disabled = false;
        toast(result?.error || 'Failed to save the sentence', 'error');
      }
    });

    const sections = [
      el('div', { className: 'sentence' }, [
        el('p', { className: 'original', textContent: sentence.original || '' }),
        el('p', { className: 'translation', textContent: sentence.translation || '' }),
        sentence.formality ? el('p', { className: 'meta', textContent: sentence.formality }) : null,
        sentence.context ? el('p', { className: 'meta', textContent: sentence.context }) : null
      ]),
      el('div', { className: 'actions' }, [
        audioButton,
        saveButton,
        el('a', {
          className: 'button button-primary',
          href: `${siteUrl}/sentence/${encodeURIComponent(sentenceId)}`,
          target: '_blank',
          rel: 'noopener',
          textContent: 'Open full analysis ↗'
        })
      ])
    ];

    if (components.length) {
      const seen = new Set();
      const rows = [];
      for (const component of components) {
        const key = component.dictionary_form || component.text;
        if (!key || seen.has(key)) continue;
        seen.add(key);
        rows.push(renderComponent(component, originalLanguage, translationLanguage));
      }
      sections.push(el('h3', { textContent: 'Words' }), el('ul', { className: 'components' }, rows));
    }

    if (grammarPoints.length) {
      sections.push(
        el('h3', { textContent: 'Grammar' }),
        el('ul', { className: 'grammar' }, grammarPoints.map((point) =>
          el('li', {}, [
            el('strong', { textContent: point.pattern || '' }),
            el('p', { textContent: point.explanation || '' })
          ])
        ))
      );
    }

    if (weeklyQuota && typeof weeklyQuota.weekSentencesRemaining === 'number') {
      sections.push(el('p', {
        className: 'quota',
        textContent: `${Math.max(0, weeklyQuota.weekSentencesRemaining)} of ${weeklyQuota.weekSentencesTotal} free analyses left this week`
      }));
    }

    return el('div', {}, sections);
  }

  function renderComponent(component, originalLanguage, translationLanguage) {
    const dictionaryForm = component.dictionary_form || component.text;
    const meaning = component.meaning?.description || '';
    const isSaved = savedWords.has(dictionaryForm);

    const addButton = el('button', {
      className: isSaved ? 'button button-small' : 'button button-keep button-small',
      textContent: isSaved ? 'Saved' : '+ Add',
      disabled: isSaved || !meaning,
      title: isSaved ? 'Already in your words' : 'Add to your words'
    });
    addButton.addEventListener('click', async () => {
      addButton.disabled = true;
      const result = await send({
        type: 'ADD_WORD',
        word: {
          originalWord: dictionaryForm,
          translatedWord: meaning,
          originalLanguage,
          translationLanguage,
          reading: component.reading || ''
        }
      });
      if (result?.success) {
        addButton.className = 'button button-small';
        addButton.textContent = 'Saved';
        savedWords.set(dictionaryForm, { word: dictionaryForm, meaning });
        toast(`Added “${dictionaryForm}” to your words`, 'success');
        loadVocabulary({ force: true });
      } else {
        addButton.disabled = false;
        toast(result?.error || 'Failed to add the word', 'error');
      }
    });

    const showDictionaryForm = component.dictionary_form && component.dictionary_form !== component.text;
    return el('li', {}, [
      el('div', { className: 'component-main' }, [
        el('span', { className: 'component-text', textContent: component.text || dictionaryForm }),
        component.reading ? el('span', { className: 'reading', textContent: component.reading }) : null,
        showDictionaryForm ? el('span', { className: 'dictionary', textContent: `(${component.dictionary_form})` }) : null,
        el('span', { className: 'type', textContent: component.type_translated || component.type || '' }),
        el('p', { className: 'meaning', textContent: meaning })
      ]),
      addButton
    ]);
  }

  async function playAudio(sentenceId, button) {
    button.disabled = true;
    const original = button.textContent;
    button.textContent = 'Loading…';
    const result = await send({ type: 'GET_AUDIO', sentenceId });
    button.textContent = original;
    button.disabled = false;
    if (!result?.success) {
      errorToast(result, 'Audio is not available');
      return;
    }
    playUrl(result.url, "Couldn't play audio on this page. Open the full analysis to listen.");
  }

  async function playUrl(url, blockedMessage) {
    try {
      await new Audio(url).play();
    } catch (error) {
      // Some sites' Content-Security-Policy blocks media from other origins.
      console.warn('Hanbok: audio playback failed', error);
      toast(blockedMessage, 'error');
    }
  }

  // ---------------------------------------------------------------------
  // Selection button and highlighted-word card

  function onMouseUp(event) {
    if (event.composedPath().includes(host)) return;
    // Let the selection settle (double-click, shift-click).
    setTimeout(() => {
      const selection = window.getSelection();
      const text = selection?.toString().trim() || '';
      // A plain click has no selection; mousedown already closed any
      // floating UI, and a click on a highlight is about to open its card.
      if (!text) return;
      if (!settings.selectionButtonEnabled || text.length > MAX_SELECTION
          || !looksLikeLanguage(text, settings.sourceLanguage) || !selection.rangeCount) {
        hideFloating();
        return;
      }
      const rect = selection.getRangeAt(0).getBoundingClientRect();
      if (!rect.width && !rect.height) return;
      const button = el('button', {
        className: 'floating selection-button',
        onmousedown: (e) => e.preventDefault(), // keep the selection
        onclick: () => analyze(text)
      }, [mascot('head-3', 24, { alt: '' }), 'Analyze with Hanbok']);
      placeFloating(button, rect);
    }, 10);
  }

  function onMouseDown(event) {
    if (!event.composedPath().includes(host)) hideFloating();
  }

  function onKeyDown(event) {
    if (event.key === 'Escape') {
      hideFloating();
      closeModal();
    }
  }

  // The sentence a highlighted word sits in, cut from its block's text at
  // sentence punctuation, for "Analyze sentence".
  function sentenceAround(mark) {
    const block = mark.closest(BLOCK_SELECTOR) || mark.parentElement;
    const range = document.createRange();
    range.setStart(block, 0);
    range.setEndBefore(mark);
    const before = range.toString();
    const text = block.textContent;
    const start = before.length;
    const end = start + mark.textContent.length;

    const terminators = /[.!?。！？\n]/;
    let from = start;
    while (from > 0 && !terminators.test(text[from - 1])) from -= 1;
    let to = end;
    while (to < text.length && !terminators.test(text[to])) to += 1;
    if (to < text.length && text[to] !== '\n') to += 1; // keep the punctuation

    let sentence = text.slice(from, to).replace(/\s+/g, ' ').trim();
    if (sentence.length > MAX_SELECTION) {
      // Very long run without punctuation: take a window around the word.
      const offset = Math.max(0, start - from - MAX_SELECTION / 2);
      sentence = text.slice(from + offset, from + offset + MAX_SELECTION).replace(/\s+/g, ' ').trim();
    }
    return sentence;
  }

  function onPageClick(event) {
    const target = event.target;
    if (!(target instanceof Element) || !target.classList.contains(HIGHLIGHT_CLASS)) return;
    const surface = target.textContent;
    const savedWord = findVocabularyWord(surface, [...savedWords.keys()], settings.sourceLanguage) || surface;
    const entry = savedWords.get(savedWord) || { word: savedWord, meaning: '' };
    const sentence = sentenceAround(target);
    setTimeout(() => placeFloating(renderWordCard(surface, entry, sentence), target.getBoundingClientRect()), 0);
  }

  function renderWordCard(surface, entry, sentence) {
    const listenButton = el('button', { className: 'icon-button listen', title: 'Pronounce', 'aria-label': 'Pronounce', textContent: '🔊' });
    listenButton.addEventListener('click', async () => {
      listenButton.disabled = true;
      const result = await send({ type: 'GET_WORD_AUDIO', word: entry.word, translation: entry.meaning });
      listenButton.disabled = false;
      if (!result?.success) errorToast(result, 'Pronunciation is not available');
      else playUrl(result.url, "Couldn't play audio on this page.");
    });

    const relations = el('div', { className: 'relations' });
    const relationsButton = el('button', { className: 'button button-small', textContent: 'Related words' });
    relationsButton.addEventListener('click', async () => {
      relationsButton.disabled = true;
      relationsButton.textContent = 'Loading…';
      const result = await send({ type: 'GET_WORD_RELATIONS', word: entry.word });
      if (!result?.success) {
        relationsButton.disabled = false;
        relationsButton.textContent = 'Related words';
        errorToast(result, 'Could not load related words');
        return;
      }
      relationsButton.remove();
      const groups = [
        renderRelationList('Synonyms', result.synonyms),
        renderRelationList('Antonyms', result.antonyms)
      ].filter(Boolean);
      relations.replaceChildren(...(groups.length ? groups : [el('p', { className: 'meta', textContent: 'No related words found.' })]));
    });

    const sentenceButton = sentence && sentence !== surface
      ? el('button', { className: 'button button-primary button-small', textContent: 'Analyze sentence', title: sentence, onclick: () => analyze(sentence) })
      : el('button', { className: 'button button-primary button-small', textContent: 'Analyze', onclick: () => analyze(surface) });

    const deckLink = el('a', { className: 'button button-small', target: '_blank', rel: 'noopener', textContent: 'My deck ↗' });
    siteUrl().then((url) => deckLink.setAttribute('href', `${url}/cards`));

    return el('div', { className: 'floating word-card' }, [
      el('div', { className: 'word-header' }, [
        el('span', { className: 'word', textContent: entry.word }),
        listenButton
      ]),
      surface !== entry.word ? el('div', { className: 'meta', textContent: `Seen here as ${surface}` }) : null,
      el('p', { className: 'meaning', textContent: entry.meaning || 'Saved in your Hanbok words' }),
      el('div', { className: 'actions' }, [sentenceButton, relationsButton, deckLink]),
      relations
    ]);
  }

  function renderRelationList(title, items) {
    if (!items?.length) return null;
    return el('div', { className: 'relation-group' }, [
      el('h4', { textContent: title }),
      el('ul', {}, items.map((item) => el('li', {}, [
        el('span', { className: 'component-text', textContent: item.originalWord || '' }),
        item.reading ? el('span', { className: 'reading', textContent: item.reading }) : null,
        el('span', { textContent: item.translatedWord || '' })
      ])))
    ]);
  }

  // ---------------------------------------------------------------------
  // Vocabulary highlighting

  function acceptTextNode(node) {
    if (!node.nodeValue || !node.nodeValue.trim()) return NodeFilter.FILTER_REJECT;
    for (let parent = node.parentElement; parent; parent = parent.parentElement) {
      if (SKIP_TAGS.has(parent.tagName.toUpperCase()) || parent.isContentEditable
          || parent.classList.contains(HIGHLIGHT_CLASS) || parent === host) {
        return NodeFilter.FILTER_REJECT;
      }
      if (parent === document.body) break;
    }
    return NodeFilter.FILTER_ACCEPT;
  }

  function highlightIn(root) {
    if (!pattern || !root) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, { acceptNode: acceptTextNode });
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);

    withObserverPaused(() => {
      for (const node of nodes) {
        const text = node.nodeValue;
        pattern.lastIndex = 0;
        const matches = [...text.matchAll(pattern)].filter((m) => m[0]);
        if (!matches.length) continue;

        const fragment = document.createDocumentFragment();
        let last = 0;
        for (const match of matches) {
          if (match.index > last) fragment.appendChild(document.createTextNode(text.slice(last, match.index)));
          const mark = document.createElement('span');
          mark.className = HIGHLIGHT_CLASS;
          mark.textContent = match[0];
          fragment.appendChild(mark);
          highlightCount += 1;
          last = match.index + match[0].length;
        }
        if (last < text.length) fragment.appendChild(document.createTextNode(text.slice(last)));
        node.parentNode.replaceChild(fragment, node);
      }
    });
  }

  function clearHighlights() {
    withObserverPaused(() => {
      for (const mark of document.querySelectorAll(`span.${HIGHLIGHT_CLASS}`)) {
        const parent = mark.parentNode;
        parent.replaceChild(document.createTextNode(mark.textContent), mark);
        parent.normalize();
      }
    });
    highlightCount = 0;
  }

  function refreshHighlights() {
    clearHighlights();
    pattern = settings.highlightEnabled
      ? buildVocabularyPattern(vocabulary.map((entry) => entry.word), settings.sourceLanguage)
      : null;
    if (pattern) highlightIn(document.body);
  }

  async function loadVocabulary({ force = false } = {}) {
    const result = await send({ type: 'GET_VOCABULARY', force });
    // Older cached responses were plain strings.
    vocabulary = (result?.words || []).map((entry) => (typeof entry === 'string' ? { word: entry, meaning: '' } : entry));
    savedWords = new Map(vocabulary.map((entry) => [entry.word, entry]));
    refreshHighlights();
  }

  // Re-highlight content the page adds later (infinite scroll, SPAs), but
  // never react to our own changes.
  let pendingRoots = new Set();
  let flushTimer = null;
  const observer = new MutationObserver((mutations) => {
    if (!pattern) return;
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node === host) continue;
        if (node.nodeType === Node.TEXT_NODE && node.parentElement) pendingRoots.add(node.parentElement);
        else if (node.nodeType === Node.ELEMENT_NODE) pendingRoots.add(node);
      }
    }
    if (pendingRoots.size && !flushTimer) {
      flushTimer = setTimeout(() => {
        const roots = [...pendingRoots].filter((root) => root.isConnected);
        pendingRoots = new Set();
        flushTimer = null;
        // Skip roots nested inside another pending root.
        for (const root of roots) {
          if (!roots.some((other) => other !== root && other.contains(root))) highlightIn(root);
        }
      }, 500);
    }
  });

  function observe() {
    observer.observe(document.body, { childList: true, subtree: true, characterData: false });
  }

  function withObserverPaused(fn) {
    observer.disconnect();
    try {
      fn();
    } finally {
      observe();
    }
  }

  // ---------------------------------------------------------------------
  // Wiring

  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message?.type) {
      case 'ANALYZE_SELECTION':
        analyze(message.text);
        break;
      case 'REFRESH_HIGHLIGHTING':
        loadVocabulary({ force: true }).then(() => sendResponse({ count: highlightCount }));
        return true;
      case 'CLEAR_HIGHLIGHTING':
        clearHighlights();
        sendResponse({ count: 0 });
        break;
      case 'GET_HIGHLIGHTED_COUNT':
        sendResponse({ count: highlightCount });
        break;
    }
    return false;
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    for (const [key, { newValue }] of Object.entries(changes)) {
      if (key in settings) settings[key] = newValue ?? DEFAULT_SETTINGS[key];
    }
    if (changes.sourceLanguage || changes.useLocalApi) loadVocabulary({ force: true });
    else if (changes.highlightEnabled) refreshHighlights();
  });

  async function init() {
    if (!document.body) return; // XML, PDF viewers and other non-HTML pages
    const stored = await chrome.storage.sync.get(Object.keys(DEFAULT_SETTINGS));
    settings = { ...DEFAULT_SETTINGS, ...stored };

    loadFonts();

    document.addEventListener('mouseup', onMouseUp, true);
    document.addEventListener('mousedown', onMouseDown, true);
    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('click', onPageClick, true);

    observe();
    // Loaded even with highlighting off, to mark words already saved.
    await loadVocabulary();
  }

  init();
})();
