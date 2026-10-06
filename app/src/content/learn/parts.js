// Shorthand for the word chips in learn articles' <Example> sentences.
// chip(W('학생', 'student'), P('이에요', '"am / is", polite'))
export const chip = (...parts) => ({ parts });
// A word the reader can save. `base` is its dictionary form when the chip shows a conjugated one.
export const W = (t, g, base) => ({ t, g, ...(base && { base }) });
// A particle or ending: colored, not saveable.
export const P = (t, g) => ({ t, g, particle: true });
