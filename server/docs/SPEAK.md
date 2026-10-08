# Speak (voice role-play with Horang)

Live voice conversations with Horang over OpenAI Realtime (WebRTC).

Flow: the browser makes a WebRTC offer and posts it to `POST /api/speak/session`.
The server checks the plan's minutes, builds Horang's instructions (scene, level,
the learner's 40 newest saved words and 12 newest saved grammar points), opens the
call with `POST https://api.openai.com/v1/realtime/calls` and returns OpenAI's
answer. Audio then flows browser <-> OpenAI directly. The API key never reaches
the browser, and the server hangs the call up (`/v1/realtime/calls/:id/hangup`)
when the session's time runs out.

Code: `speak/scenarios.js` (scenes), `speak/prompt.js` (instructions + tools),
`speak/limits.js` (minutes per plan), `controllers/speak.js` (routes),
`app/src/lib/speakClient.js` + `app/src/components/speak/SpeakScene.jsx` (browser).

Sessions are stored in `speak_sessions` (time used, goals done, transcript, token
usage reported by the browser).

## Settings (server .env)

| Variable | Default | |
|---|---|---|
| `OPENAI_API_KEY` | (required) | Speak returns 503 without it |
| `SPEAK_FREE_MINUTES` | 5 | per 7 days |
| `SPEAK_BASIC_MINUTES` | 60 | per 30 days |
| `SPEAK_PLUS_MINUTES` | 120 | per 30 days |
| `SPEAK_MODEL_FREE` / `_BASIC` | gpt-realtime-2.1-mini | |
| `SPEAK_MODEL_PLUS` | gpt-realtime-2.1 | |
| `SPEAK_MAX_SESSION_SECONDS` | 600 | longest single call |
| `SPEAK_VOICE` | cedar | Horang's voice |
| `SPEAK_TRANSLATE_MODEL` | gpt-4.1 | captions under Horang's lines |
