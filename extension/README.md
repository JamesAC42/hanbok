# Hanbok Study Chrome extension

Brings Hanbok to any web page:

- **Analyze**: select text and click **Analyze with Hanbok** (or right-click → *Analyze with Hanbok*). You get the translation, a word-by-word breakdown, grammar points, audio, and a link to the full analysis on hanbokstudy.com. Analyses count toward the same weekly quota as the site.
- **Save words**: add any word from an analysis to your deck, and save the sentence to your library.
- **See your words**: words you've saved for your learning language are highlighted as you browse. Click one to analyze it.

The extension uses your hanbokstudy.com login. Log in on the site, then open the extension popup to pick your languages.

## Install for development

1. Go to `chrome://extensions`, turn on **Developer mode**, click **Load unpacked**, and pick this `extension/` folder.
2. To use a local stack, run the server (`server/`, port 5666) and the app (`app/`, port 3000), log in at http://localhost:3000, then turn on **Use local development server** in the popup.
3. After editing files, click the reload icon on the extension's card and refresh the page you're testing on.

Highlighting tests run without a browser:

```sh
node --test extension/test/highlight.test.js
```

## How it fits together

| File | Role |
|---|---|
| `manifest.json` | MV3 manifest. Content scripts run on all http(s) pages except Hanbok itself. |
| `background.js` | Service worker. Owns the context menu and every API call, so requests carry the site's session cookie. |
| `content.js` | Selection button, analysis modal, toasts, and vocabulary highlighting. UI lives in a closed shadow root; page text is only written with `textContent`. |
| `highlight.js` | Builds the vocabulary regex per language (Korean stem/particle handling, no word boundaries for ja/zh, Unicode boundaries elsewhere). |
| `ui-styles.js` | Styles for the shadow-root UI, kept in JS so page CSP can't block them. |
| `content.css` | The only styles injected into the page: the highlight itself. |
| `popup.*` | Toolbar popup: login status, languages, toggles. |
| `shared.js` | Language list (mirror of `server/supported_languages.js`), site URLs, default settings. |

API endpoints used: `GET /api/session`, `GET /api/words`, `POST /api/words`, `POST /api/submit`, `POST /api/sentences/:id/save`, `GET /api/audio-url/:id`. All go to the site origin, which proxies `/api` to the server.

## Known limits

- Korean highlighting matches the start of a word, so `공부하다` finds `공부해요`, but contracted forms like `기다려요` for `기다리다` are missed. Japanese verb conjugations aren't matched either.
- Audio plays in the page, so sites with a strict media Content-Security-Policy block it; the full-analysis link still works.
- Not yet published to the Chrome Web Store.
