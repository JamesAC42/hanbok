// Library search (Basic and Plus) and Anki export (Plus) helpers.

const params = (obj) => {
    const p = new URLSearchParams();
    for (const [k, v] of Object.entries(obj)) {
        if (v !== undefined && v !== null && String(v).trim() !== '') p.set(k, String(v).trim());
    }
    return p.toString();
};

export const libraryEndpoint = ({ q, page = 1, limit = 10, language = '' }) =>
    `/api/library/search?${params({ q, page, limit, language })}`;

export const ankiHref = ({ q = '', language = '' } = {}) => {
    const qs = params({ q, language });
    return `/api/library/anki${qs ? `?${qs}` : ''}`;
};

// The line under a search result saying why it matched.
export const matchLabel = (match) => {
    if (!match?.label) return '';
    if (match.kind === 'grammar') return `Grammar: ${match.label}`;
    if (match.kind === 'word') return `Word: ${match.label}${match.meaning ? ` · ${match.meaning}` : ''}`;
    return '';
};
