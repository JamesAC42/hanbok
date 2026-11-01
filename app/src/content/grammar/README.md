# Korean grammar pattern pages

`patterns.json` holds one entry per page at `/grammar/<slug>` (hub: `/grammar`).
Add a page by appending an entry; the page, the hub tile, the sitemap entry and
the "Read the guide" links in sentence breakdowns and song notes follow.

Shape of an entry:

- `slug`, `form` ("-잖아(요)"), `roman`, `meaning` (short gloss), `category` (a key of
  `CATEGORIES` in index.js), `level` (Beginner | Intermediate | Advanced)
- `match`: spellings an analysis might use for this form ("-잖아", "-잖아요"); analyses
  and saved grammar link here when one matches
- `intro`, `usage` (paragraphs), `formation` ([{ when, rule, example }])
- `examples`: 4 × { context, chips: [[{ t, g, p?, base? }]], en }, same chips as phrases
- `compare` ([{ form, note }]), `mistakes` (strings), `faq` ([{ q, a }])
- `related`: other slugs here; `guide`: optional Learn article slug

Forms that already have a Learn guide (content/learn) should not get a page here.
Review every Korean sentence by hand before shipping.
