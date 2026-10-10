# Korean phrase pages

`phrases.json` holds one entry per page at `/phrases/<slug>` (hub: `/phrases`).
Add a phrase by appending an entry; the page, the hub tile and the sitemap entry follow.
Review every Korean sentence by hand before shipping.

```json
{
  "slug": "daebak",                  // URL, the romanization people search
  "ko": "대박",
  "roman": "daebak",
  "aka": ["dae bak"],                // other spellings learners type
  "meaning": "Awesome! / No way!",   // under 40 characters
  "category": "reaction",            // reaction | people | love | everyday | slang | internet
  "register": "casual",              // casual | polite | formal | any
  "intro": "...",                    // answers "what does X mean" in 2-3 sentences
  "literal": "...",                  // origin, or "" when nothing reliable to say
  "usage": ["...", "..."],
  "forms": [{ "ko": "...", "en": "...", "note": "..." }],
  "examples": [{ "context": "...", "en": "...", "chips": [[{ "t": "대박", "g": "awesome" }]] }],
  "related": ["heol"],               // other slugs in this file
  "faq": [{ "q": "...", "a": "..." }]
}
```

Example chips: one array per space-separated word. A part is `{ t, g }`; add `"p": true` for particles and
endings (gloss their function) and `"base"` for a conjugated stem's dictionary form. A final `?` or `!` is its
own part with `"p": true`.

"Hear it in songs" comes from `GET /api/lyrics/lines?q=<ko>` (server/controllers/lyrics/phraseLines.js),
which searches the analyzed lines of published Korean songs. Pages revalidate daily.
