# Extended Text – Manual Test Checklist

Use two test accounts: Free tier (weekly quota enforced) and Paid tier (tier > 0, unlimited). Have a few sample passages ready: short 2–3 sentence text (~300 chars), mid-length (~1,800 chars), and an over-limit text (>5,000 chars).

## Access, onboarding, and gating
- Logged out, visit `/extended-text`: onboarding modal auto-opens, hero shows “New!” badge, notice asks to log in; primary button reads “Log in”.
- Logged in first-time visit: onboarding auto-opens (localStorage key `extendedTextOnboardingSeen` absent); dots and Next/Finish buttons work; closing sets the key and suppresses modal on refresh.
- Confirm “Open walkthrough” button reopens onboarding; pricing CTA navigates to pricing; login CTA routes to login when logged out.

## Language selectors and stats bar
- Switch learning/native languages; labels and flag icon update; translation label interpolates the native language name.
- Char limit value matches tier (Free 500, Basic 2,000, Plus 5,000) and weekly usage text shows login prompt when logged out, numeric quota for Free, “Unlimited” for paid.

## Form validation
- Text area requires non-empty content; error clears on edit.
- Over character limit shows inline warning; submit button disables while over limit and re-enables when under.
- Text shorter than 2 sentences is rejected with the specific single-sentence error.
- Unsupported language combination is blocked (manually tweak request if needed).
- Title optional: submit with/without title; maxLength 100 enforced.

## Weekly quota behavior (Free tier)
- Start below quota: submit succeeds; weekly remaining decrements on completion and is reflected in header/profile.
- At quota: page shows warning banner; submit button disabled; server response includes rate-limit message if request forced.
- New week reset (optional): advance clock/reset record and verify quota resets to 2/2.

## Submission happy path
- Valid text under limit submits, POST body trims whitespace, and routes to `/extended-text/progress/:jobId` carrying `title`, `count`, `textId` query params when available.
- Loading state shows on button; clears after navigation.

## Progress page
- SSE connects to `/api/extended-text/progress/:jobId`; initial payload sets status/processed/total fields.
- Status transitions render localized messages (processing → analyzing_sentence with counters → overall_analysis → saving_results).
- Percentage and sentence counts climb; custom `progress` message overrides default when sent.
- On completion: shows redirect notice, renders quota message when returned, auto-redirects to `/extended-text/:textId` ~2s later; AuthContext quota counters update.
- If job already completed before visiting, initial event immediately triggers completion flow.
- Error paths: lost connection shows connection error; server `jobError` shows error copy and stops updates; unauthorized job returns 403 (verify redirect or error).

## Extended text detail page (`/extended-text/:textId`)
- Auth required: logged out gets auth error; non-owner receives 403 error state.
- Successful load shows hero meta (sentence count, date, languages, tone, weekly usage tag for Free users).
- Sentences list renders in order with numbers and translations when present.
- Combined translation block appears only when sentences have translations.
- Overall analysis blocks (summary, structure, cultural context, tone, themes, key grammar patterns) render if present; empty fields do not create blank blocks.
- Page title updates to “<Title> | Extended Text” when title exists.

## Sentence analysis flyout
- Clicking a sentence opens flyout with the correct analysis; badge reflects sentence number; ESC key and backdrop close it.
- Toggle same sentence closes it; selecting different sentences swaps content.
- “Select a sentence” placeholder shows when no selection.

## Mobile/responsiveness and assets
- Hero/side art render without layout issues; watercolor sidebar image loads.
- Progress circle and bars remain legible on narrow widths; flyout overlay scrolls and is dismissible on mobile.
