// Styles for the extension's in-page UI, applied inside its shadow root.
// Lives in JS rather than a .css file so no page Content-Security-Policy
// can block it.
//
// This is the site's Bright Path look: tokens and building blocks are
// ported from app/src/styles/brightpath.scss and variables.module.scss
// (bp-press, bp-press-ghost, bp-card, bp-pill, bp-label). Stage colors
// carry the same meaning as on the site (see design/bright-path.md in the
// project files): Read blue for analyzing, Keep gold for saving words. The two fonts are declared in content.css,
// since Chrome resolves @font-face against the document, not a shadow tree.
self.HANBOK_UI_CSS = `
:host { all: initial; }
* { box-sizing: border-box; }

.toasts, .floating, .backdrop {
  --bp-read: #3D64E8;
  --bp-read-d: #2645B8;
  --bp-und: #13B5A6;
  --bp-und-d: #0B8C80;
  --bp-keep: #FFB020;
  --bp-keep-d: #D18700;
  --bp-keep-ink: #3A2600;
  --bp-rev: #FF5A5F;
  --bp-rev-d: #D63A40;
  --bp-gray: #8A8FA8;

  --background: #ffffff;
  --foreground: #171717;
  --bp-line: color-mix(in srgb, var(--foreground) 13%, var(--background));
  --bp-line-strong: color-mix(in srgb, var(--foreground) 22%, var(--background));
  --bp-soft: color-mix(in srgb, var(--foreground) 4%, var(--background));
  --bp-ink2: color-mix(in srgb, var(--foreground) 62%, var(--background));
  --bp-card: var(--background);
  --bp-und-soft: color-mix(in srgb, var(--bp-und) 12%, var(--background));
  --bp-read-soft: color-mix(in srgb, var(--bp-read) 11%, var(--background));
  --bp-title: 'Hanbok Lilita', 'Noto Sans KR', 'Hanbok Montserrat', sans-serif;
  --bp-keep-soft: color-mix(in srgb, var(--bp-keep) 16%, var(--background));

  font-family: 'Hanbok Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', 'Noto Sans JP', sans-serif;
  font-size: 14px;
  font-weight: 500;
  line-height: 1.5;
  color: var(--foreground);
  pointer-events: auto;
}

@media (prefers-color-scheme: dark) {
  .toasts, .floating, .backdrop {
    --background: #1a1a1a;
    --foreground: #ffffff;
  }
}

/* ---------- Building blocks (bp-press / bp-press-ghost / bp-card) ---------- */

.button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  font-family: inherit;
  font-weight: 800;
  font-size: 13px;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  white-space: nowrap;
  text-decoration: none;
  color: var(--bp-read);
  background: var(--bp-card);
  border: 2px solid var(--bp-line);
  border-radius: 14px;
  padding: 9px 16px;
  box-shadow: 0 3px 0 var(--bp-line);
  cursor: pointer;
  transition: transform 0.08s ease, box-shadow 0.08s ease, background 0.15s ease, filter 0.15s ease;
}
.button:hover:not(:disabled) { background: var(--bp-soft); }
.button:active:not(:disabled) { transform: translateY(3px); box-shadow: 0 0 0 var(--bp-line); }
:focus-visible { outline: 3px solid color-mix(in srgb, var(--bp-read) 70%, transparent); outline-offset: 2px; }
:focus:not(:focus-visible) { outline: none; }
.button:disabled { cursor: not-allowed; opacity: 0.55; transform: none; }

.button-primary {
  color: #fff;
  background: var(--bp-read);
  border: none;
  padding: 11px 18px;
  box-shadow: 0 4px 0 var(--bp-read-d);
}
.button-primary:hover:not(:disabled) { background: var(--bp-read); filter: brightness(1.06); }
.button-primary:active:not(:disabled) { transform: translateY(4px); box-shadow: 0 0 0 var(--bp-read-d); }
.button-primary:disabled { filter: grayscale(0.6); box-shadow: 0 4px 0 var(--bp-read-d); }

.button-keep {
  color: var(--bp-keep-ink);
  background: var(--bp-keep);
  border: none;
  box-shadow: 0 3px 0 var(--bp-keep-d);
}
.button-keep:hover:not(:disabled) { background: var(--bp-keep); filter: brightness(1.06); }
.button-keep:active:not(:disabled) { transform: translateY(3px); box-shadow: 0 0 0 var(--bp-keep-d); }
.button-keep:disabled { filter: grayscale(0.6); box-shadow: 0 3px 0 var(--bp-keep-d); }

.button-small { padding: 6px 12px; font-size: 12px; }

.icon-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 34px;
  height: 34px;
  border: 2px solid var(--bp-line);
  border-radius: 12px;
  background: var(--bp-card);
  color: var(--bp-ink2);
  font-size: 15px;
  cursor: pointer;
  transition: background 0.15s ease;
}
.icon-button:hover:not(:disabled) { background: var(--bp-soft); }
.icon-button:disabled { opacity: 0.55; cursor: not-allowed; }

h3, h4 {
  font-family: inherit;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--bp-ink2);
  margin: 22px 0 8px;
}
p { margin: 0; }
.mascot { display: block; flex: none; width: auto; object-fit: contain; user-select: none; }

/* ---------- Toasts ---------- */

.toasts {
  position: fixed;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 10px;
  max-width: 320px;
  pointer-events: none;
  z-index: 2; /* above the modal backdrop */
}
.toast {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  border-radius: 16px;
  font-weight: 600;
  color: #fff;
  background: var(--bp-read);
  box-shadow: 0 4px 0 var(--bp-read-d);
  pointer-events: auto;
  animation: hanbok-in 0.2s ease-out;
  transition: opacity 0.3s, transform 0.3s;
}
.toast-success { background: var(--bp-und); box-shadow: 0 4px 0 var(--bp-und-d); }
.toast-error { background: var(--bp-rev); box-shadow: 0 4px 0 var(--bp-rev-d); }
.toast-out { opacity: 0; transform: translateX(16px); }
.toast-action { display: block; margin-top: 6px; color: #fff; font-weight: 800; text-decoration: underline; }
.toast .mascot { margin-top: -2px; }

/* ---------- Selection button and word card ---------- */

.floating { position: fixed; animation: hanbok-in 0.15s ease-out; }

.selection-button {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: none;
  border-radius: 999px;
  padding: 9px 18px 9px 10px;
  background: var(--bp-read);
  color: #fff;
  /* This button is a top-level element of the shadow root, so "inherit"
     would pick up the host's reset (serif) instead of the UI font. */
  font-family: 'Hanbok Montserrat', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  cursor: pointer;
  box-shadow: 0 4px 0 var(--bp-read-d);
  transition: transform 0.08s ease, box-shadow 0.08s ease, filter 0.15s ease;
}
.selection-button:hover { filter: brightness(1.06); }
.selection-button:active { transform: translateY(4px); box-shadow: 0 0 0 var(--bp-read-d); }

.word-card {
  width: 310px;
  max-width: calc(100vw - 16px);
  max-height: 60vh;
  overflow-y: auto;
  background: var(--bp-card);
  border: 2px solid var(--bp-line-strong);
  border-top: 6px solid var(--bp-keep);
  border-radius: 18px;
  padding: 16px;
  box-shadow: 0 4px 0 var(--bp-line-strong);
}
.word-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.word-card .word { font-family: var(--bp-title); font-weight: 700; font-synthesis: none; font-size: 24px; line-height: 1.1; }
.word-card .meaning { font-size: 15px; margin-top: 8px; }
.word-card .actions { margin-top: 14px; gap: 8px; }
.relations { margin-top: 2px; }
.relation-group h4 { margin: 14px 0 6px; }
.relation-group ul { list-style: none; margin: 0; padding: 0; }
.relation-group li { display: flex; flex-wrap: wrap; gap: 6px; padding: 4px 0; }

/* ---------- Analysis modal ---------- */

.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(10, 14, 40, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.modal {
  background: var(--bp-card);
  border: 2px solid var(--bp-line);
  border-radius: 24px;
  width: min(620px, 100%);
  max-height: min(82vh, 760px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 6px 0 var(--bp-line);
  animation: hanbok-pop-in 0.2s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}
.modal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 14px 18px;
  border-bottom: 2px solid var(--bp-line);
}
.brand {
  font-family: var(--bp-title);
  font-weight: 700;
  font-synthesis: none;
  font-size: 20px;
  letter-spacing: 0.01em;
  margin-right: auto;
}
.modal-body { padding: 18px; overflow-y: auto; }

.sentence .original {
  font-family: var(--bp-title);
  font-weight: 700;
  font-synthesis: none;
  font-size: 26px;
  line-height: 1.25;
}
.sentence .translation { font-size: 16px; margin-top: 6px; }
.meta { color: var(--bp-ink2); font-size: 13px; margin-top: 6px; }

.actions { display: flex; flex-wrap: wrap; gap: 10px; margin-top: 16px; }

.components, .grammar { list-style: none; margin: 0; padding: 0; }
.components li {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 0;
  border-bottom: 2px solid var(--bp-line);
}
.components li:last-child { border-bottom: none; }
.component-main { min-width: 0; }
.component-text { font-family: var(--bp-title); font-weight: 700; font-synthesis: none; font-size: 19px; margin-right: 8px; }
.reading, .dictionary { color: var(--bp-ink2); margin-right: 6px; }
.type {
  display: inline-block;
  padding: 2px 10px;
  border-radius: 99px;
  background: var(--bp-read-soft);
  font-size: 10px;
  font-weight: 800;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--bp-read);
  vertical-align: 2px;
}
.meaning { margin-top: 4px; }
.grammar li { padding: 10px 0; border-bottom: 2px solid var(--bp-line); }
.grammar li:last-child { border-bottom: none; }
.grammar strong { font-family: var(--bp-title); font-weight: 700; font-synthesis: none; font-size: 17px; }
.grammar p { margin-top: 2px; }

.quota {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  margin-top: 20px;
  padding: 5px 12px;
  border-radius: 99px;
  background: var(--bp-soft);
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--bp-ink2);
}

.loading, .error { display: flex; align-items: center; justify-content: center; gap: 14px; padding: 24px 0; font-weight: 600; text-align: center; }
.error p { color: var(--bp-rev); }
.spinner {
  width: 20px;
  height: 20px;
  border: 3px solid var(--bp-read-soft);
  border-top-color: var(--bp-read);
  border-radius: 50%;
  animation: hanbok-spin 0.8s linear infinite;
}

@keyframes hanbok-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
@keyframes hanbok-pop-in { 0% { opacity: 0; transform: translateY(10px) scale(0.97); } 100% { opacity: 1; transform: none; } }
@keyframes hanbok-spin { to { transform: rotate(360deg); } }
@keyframes hanbok-bob { 50% { transform: translateY(-4px); } }
.bob { animation: hanbok-bob 3.4s ease-in-out infinite; }

@media (prefers-reduced-motion: reduce) {
  .floating, .modal, .toast, .bob, .spinner { animation: none; }
}
`;
