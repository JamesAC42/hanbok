# Japanese grammar pages

`patterns.json` holds one entry per page at `/japanese/grammar/<slug>` (hub:
`/japanese/grammar`). Add a page by appending an entry; the page, the hub tile,
the sitemap entry and the /llms.txt line follow.

Shape of an entry:

- `slug` (romaji people search: "te-shimau"), `form` ("てしまう / ちゃう"), `roman`,
  `meaning` (short gloss), `category` (a key of `CATEGORIES` in index.js),
  `level` (N5 | N4 | N3, the JLPT level it is usually taught at)
- `intro`, `usage` (paragraphs), `formation` ([{ when, rule, example }])
- `examples`: 4 × { context, chips, romaji, en }. Chips are the same as the
  Korean pages ([[{ t, g, p?, base? }]]) plus `r`, the hiragana reading of a
  part with kanji, shown as furigana. Joining every `t` gives the sentence
  (no spaces).
- `compare` ([{ form, note }]), `mistakes` (strings), `faq` ([{ q, a }])
- `related`: other slugs here

Review every Japanese sentence by hand before shipping.
