// Links to a sentence use its random publicId when it has one; older sentences
// only have the numeric id, which still works.
export const sentenceKey = (s) => s?.publicId || s?.sentenceId;

export const sentenceHref = (s) => `/sentence/${sentenceKey(s)}`;
