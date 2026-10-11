# Speak (voice role-play with Horang)

Live voice conversations with Horang and Sora over GPT-Live (WebRTC), with the OpenAI Realtime API as a fallback (`SPEAK_ENGINE`).

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
usage reported by the browser). GPT-Live calls also keep `eventLog`, the raw
transcript pieces and line breaks the browser saw (`[ms, kind, text]`), shown as
"Raw call timeline" in the admin call drawer. GPT-Live sends no turn
boundaries: the character often starts answering before the learner's own
transcript arrives, so the browser splits lines on the learner's transcript
and microphone, not only on gaps (see `startLiveLine` in `speakClient.js`).

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
| `SPEAK_BETA` | on | `off` hides the Beta labels and stops giving minutes back |
| `SPEAK_BETA_REFUNDS` | 3 | reported calls per plan period that get their minutes back |
| `SPEAK_REPORT_EMAIL` | (unset) | when set, each problem report is emailed here |
| `SPEAK_RATING_EVERY` | 3 | "How did you like this call?" comes up on the learner's first call of 45s+ and then one in every this many (1 = every call) |

## Beta survey

After each call (and on past calls from the last 7 days) the learner is asked
"How did the call go?". A problem report (`POST /api/speak/session/:id/feedback`,
`{ok, issues, note}`) is saved on the session as `feedback`; during the beta it
also refunds that call's minutes once (`refundedSeconds`, which `secondsUsed`
subtracts), up to `SPEAK_BETA_REFUNDS` calls per plan period. Reports show in
the admin Speak tab under "Problem reports (beta)".

Some calls lead with "How did you like this call?" instead: five faces (1-5)
and an optional comment, sent as `{rating, comment}` to the same endpoint and
saved as `feedback.rating` / `feedback.comment` next to any problem report.
`/end` decides which calls ask (`askRating`, stored as `ratingAsked`). The admin
Speak tab shows them under "How people feel about calls".
