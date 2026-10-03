# Hanbok design system

Direction: **Jjok (쪽빛, indigo dye)**. Calm, legible surfaces for long study
sessions; the palette comes from the hanbok illustration (indigo skirt, pale
yellow jeogori, red ribbon). The watercolor paintings carry the warmth.

Source of truth: `app/src/styles/tokens.scss` (scale + semantic tokens) and
`app/src/styles/theme.scss` (per-theme palettes). The Chrome extension copies
the values it needs from these files.

## Fonts

| Role | Token | Face |
| --- | --- | --- |
| UI and body text | `--font-ui` (`--font-body`, `--font-display`) | Noto Sans KR |
| Headings, wordmark | `--font-heading` (`--font-lilita`) | Hahmlet |
| Text in the language being learned | `--font-kr-serif`, `--font-jp-serif`, `--font-sc-serif`, `--font-tc-serif`, `--font-serif` (`.latin`) | Noto Serif family |

All faces load from `@fontsource-variable/*` (imported in `app/layout.jsx`) as
unicode-range woff2 subsets. Headings need an explicit weight
(`--weight-heavy` for display titles).

## Color

Use semantic tokens in new code; they follow whichever theme the user picked.

| Token | Use |
| --- | --- |
| `--surface`, `--surface-sunken`, `--surface-raised` | Page, wells, cards and popovers |
| `--text`, `--text-muted`, `--text-subtle` | Body, secondary, hints |
| `--border`, `--border-strong` | Dividers, input outlines |
| `--accent`, `--accent-hover`, `--accent-soft`, `--on-accent` | Primary actions, selected states, text on accent fills |
| `--highlight`, `--highlight-line` | Saved-word and selection highlights |
| `--error-*`, `--warning-*`, `--success-*`, `--info-*` | Status (background + foreground pairs) |

Brand primitives (`--brand-indigo`, `--brand-jeogori`, `--brand-red`, ...) are
for marketing surfaces that should look the same in every theme. Red is an
accent for small moments (new badges, streaks), never for primary buttons.

Word-type colors stay in `variables.module.scss` (`$word-types`).

## Scale

- Type: `--text-2xs` … `--text-3xl`, `--leading-tight|snug|normal|target`
- Spacing: `--space-1` (4px) … `--space-16` (64px)
- Radius: `--radius-sm` 6px, `--radius-md` 10px, `--radius-lg` 16px, `--radius-xl` 24px, `--radius-pill`
- Elevation: `--shadow-sm`, `--shadow-md`, `--shadow-lg`
- Motion: `--duration-fast|base|slow`, `--ease-out`

## Themes

`theme.scss` defines the legacy variables (`--background`, `--foreground`,
`--primary`, ...) for each theme. The semantic tokens are derived from them,
so adding a theme only means filling in those variables plus `--on-accent`
when its primary color is light.

## Rollout

1. Tokens and fonts (this layer).
2. App shell and analysis page.
3. Landing and pricing.
4. Remaining pages.
5. Chrome extension restyle.

Hard-coded colors in component SCSS move to tokens as each page is restyled.
