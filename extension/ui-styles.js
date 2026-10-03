// Styles for the extension's in-page UI, applied inside its shadow root.
// Lives in JS rather than a .css file so no page Content-Security-Policy
// can block it.
self.HANBOK_UI_CSS = `
:host { all: initial; }
* { box-sizing: border-box; }

.toasts, .floating, .backdrop {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Noto Sans KR', 'Noto Sans JP', sans-serif;
  font-size: 14px;
  line-height: 1.45;
  color: #1f2937;
  pointer-events: auto;
}

/* Toasts */
.toasts {
  position: fixed;
  top: 16px;
  right: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 320px;
  pointer-events: none;
  z-index: 2; /* above the modal backdrop */
}
.toast {
  padding: 10px 14px;
  border-radius: 8px;
  color: #fff;
  background: #3b82f6;
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.15);
  pointer-events: auto;
  animation: hanbok-in 0.2s ease-out;
  transition: opacity 0.3s, transform 0.3s;
}
.toast-success { background: #059669; }
.toast-error { background: #dc2626; }
.toast-out { opacity: 0; transform: translateX(16px); }

/* Floating selection button and word card */
.floating {
  position: fixed;
  animation: hanbok-in 0.15s ease-out;
}
.selection-button {
  border: none;
  border-radius: 999px;
  padding: 6px 14px;
  background: #b91c1c;
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.2);
}
.selection-button:hover { background: #991b1b; }
.word-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  padding: 12px;
  min-width: 180px;
  max-width: 280px;
  box-shadow: 0 10px 24px rgba(0, 0, 0, 0.15);
}
.word-card { width: 300px; max-width: calc(100vw - 16px); max-height: 60vh; overflow-y: auto; }
.word-header { display: flex; align-items: center; justify-content: space-between; gap: 8px; }
.word-card .word { font-weight: 700; font-size: 20px; }
.word-card .meaning { font-size: 15px; margin-top: 6px; }
.word-card .actions { margin-top: 12px; gap: 6px; }
.relations { margin-top: 4px; }
.relation-group h4 { font-size: 12px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin: 12px 0 4px; }
.relation-group ul { list-style: none; margin: 0; padding: 0; }
.relation-group li { padding: 3px 0; }
.toast-action { display: block; margin-top: 6px; color: #fff; font-weight: 600; text-decoration: underline; }

/* Analysis modal */
.backdrop {
  position: fixed;
  inset: 0;
  background: rgba(17, 24, 39, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}
.modal {
  background: #fff;
  border-radius: 14px;
  width: min(600px, 100%);
  max-height: min(80vh, 720px);
  display: flex;
  flex-direction: column;
  box-shadow: 0 24px 48px rgba(0, 0, 0, 0.25);
  animation: hanbok-in 0.2s ease-out;
}
.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid #f3f4f6;
}
.brand { font-weight: 700; color: #b91c1c; letter-spacing: 0.02em; }
.modal-body { padding: 16px; overflow-y: auto; }
.modal-body h3 { font-size: 13px; text-transform: uppercase; letter-spacing: 0.05em; color: #6b7280; margin: 20px 0 8px; }
p { margin: 0; }

.sentence .original { font-size: 20px; font-weight: 600; }
.sentence .translation { font-size: 16px; margin-top: 4px; }
.meta { color: #6b7280; font-size: 13px; margin-top: 4px; }

.actions { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 14px; }
.button {
  display: inline-flex;
  align-items: center;
  border: 1px solid #d1d5db;
  background: #fff;
  color: #1f2937;
  border-radius: 8px;
  padding: 7px 12px;
  font: inherit;
  font-weight: 500;
  text-decoration: none;
  cursor: pointer;
}
.button:hover:not(:disabled) { background: #f9fafb; }
.button:disabled { opacity: 0.6; cursor: default; }
.button-primary { background: #b91c1c; border-color: #b91c1c; color: #fff; }
.button-primary:hover:not(:disabled) { background: #991b1b; }
.button-small { padding: 4px 10px; font-size: 13px; }
.icon-button { border: none; background: none; font-size: 16px; color: #6b7280; cursor: pointer; padding: 4px; }

.components, .grammar { list-style: none; margin: 0; padding: 0; }
.components li {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 0;
  border-bottom: 1px solid #f3f4f6;
}
.component-main { min-width: 0; }
.component-text { font-weight: 600; font-size: 15px; margin-right: 6px; }
.reading, .dictionary { color: #6b7280; margin-right: 6px; }
.type { font-size: 12px; color: #9ca3af; }
.meaning { margin-top: 2px; }
.grammar li { padding: 8px 0; border-bottom: 1px solid #f3f4f6; }
.grammar p { margin-top: 2px; color: #374151; }
.quota { margin-top: 16px; font-size: 12px; color: #6b7280; }

.loading, .error { display: flex; align-items: center; gap: 10px; padding: 12px 0; }
.error p { color: #b91c1c; }
.spinner {
  width: 18px;
  height: 18px;
  border: 2px solid #fecaca;
  border-top-color: #b91c1c;
  border-radius: 50%;
  animation: hanbok-spin 0.8s linear infinite;
}

@keyframes hanbok-in { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: none; } }
@keyframes hanbok-spin { to { transform: rotate(360deg); } }

@media (prefers-color-scheme: dark) {
  .modal, .word-card { background: #1f2937; color: #f9fafb; border-color: #374151; }
  .toasts, .floating, .backdrop { color: #f9fafb; }
  .modal-header, .components li, .grammar li { border-color: #374151; }
  .button { background: #111827; color: #f9fafb; border-color: #4b5563; }
  .button:hover:not(:disabled) { background: #1f2937; }
  .button-primary { background: #b91c1c; border-color: #b91c1c; }
  .grammar p { color: #d1d5db; }
  .meta, .reading, .dictionary, .quota, .modal-body h3, .relation-group h4 { color: #9ca3af; }
}
`;
