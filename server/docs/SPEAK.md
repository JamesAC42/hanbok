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
| `SPEAK_ENGINE` | live | `live` = GPT-Live (`gpt-live-1`, $0.05/min, screen driven by `/api/speak/coach`); `realtime` = Realtime API with tool calls |
| `SPEAK_LIVE_MODEL` | gpt-live-1 | |
| `SPEAK_COACH_MODEL` | gpt-4.1 | Live only: reads the transcript after each line for captions, goals, cards, mood and the end of the scene |
| `SPEAK_MODEL_FREE` / `_BASIC` / `_PLUS` | gpt-realtime-2.1 | the mini model sounded off in testing, so every plan uses the full one |
| `SPEAK_MAX_SESSION_SECONDS` | 600 | longest single call |
| `SPEAK_VOICE_HORANG` | ripple | Horang's GPT-Live voice |
| `SPEAK_REALTIME_VOICE_HORANG` | cedar | Horang's voice on the Realtime fallback (it lacks the newer voices) |
| `SPEAK_VOICE_SORA` | marin | Sora's GPT-Live voice |
| `SPEAK_REALTIME_VOICE_SORA` | marin | Sora's voice on the Realtime fallback |
| `SPEAK_TRANSCRIBE_MODEL` | gpt-4o-transcribe | captions of what the learner says, with a mixed-language hint |
| `SPEAK_TRANSLATE_MODEL` | gpt-4.1 | translation and romanization under the character's lines |
