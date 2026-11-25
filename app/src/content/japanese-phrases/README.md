# Japanese word pages

`phrases.json` holds one entry per page at `/japanese/phrases/<slug>` (hub:
`/japanese/phrases`). Add a page by appending an entry; the page, the hub tile,
the sitemap entry and the /llms.txt line follow.

Shape of an entry:

- `slug` (romaji people search: "senpai"), `ja` (as usually written: "先輩"),
  `kana` (reading), `roman`, `aka` (other spellings people search),
  `meaning` (short gloss), `category` (a key of `CATEGORIES` in index.js),
  `register` (casual | polite | formal | any | rude)
- `intro`, `literal` (origin or parts), `usage` (paragraphs)
- `forms`: [{ ja, en, note }]
- `examples`: 3 × { context, chips, romaji, en }. Chips are the same as the
  Japanese grammar pages: [[{ t, g, p?, base?, r? }]], `r` being the hiragana
  reading of a part with kanji. Joining every `t` gives the sentence.
- `related`: other slugs here; `faq`: [{ q, a }]

Review every Japanese sentence by hand before shipping.
