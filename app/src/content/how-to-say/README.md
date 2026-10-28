# "How to say X in Korean" pages

`entries.json` holds one entry per page at `/how-to-say/<slug>` (hub: `/how-to-say`).
Add a page by appending an entry; the page, the hub tile and the sitemap entry follow.
Review every Korean sentence by hand before shipping.

```json
{
  "slug": "i-love-you",              // URL: the English phrase, lowercase, hyphens
  "english": "I love you",           // the phrase as people type it into Google
  "category": "love",                // greetings | polite | feelings | love | celebrate | people | reactions | travel
  "answer": { "ko": "사랑해요", "roman": "saranghaeyo", "en": "I love you" },  // the one to use if you learn one
  "intro": "...",                    // 2-3 sentences; the first gives the answer
  "ways": [                          // 3-6 ways to say it, most useful first
    { "ko": "사랑해", "roman": "saranghae", "register": "casual", "note": "...", "phrase": "saranghae" }
  ],                                 // register: casual | polite | formal | any; phrase = a /phrases slug (optional)
  "examples": [{ "context": "...", "en": "...", "chips": [[{ "t": "사랑해", "g": "I love you" }]] }],
  "tips": ["...", "..."],            // 2-3 short paragraphs: culture, mistakes, pronunciation
  "related": ["i-like-you"],         // other slugs in this file
  "faq": [{ "q": "...", "a": "..." }]
}
```

Chips follow the same rules as the phrase pages (see ../phrases/README.md).
