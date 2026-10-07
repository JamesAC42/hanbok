// Client calls for Library folders (saved sentences and paragraphs).

const send = async (url, method = 'GET', body) => {
    const response = await fetch(url, {
        method,
        credentials: 'include',
        headers: body ? { 'Content-Type': 'application/json' } : undefined,
        body: body ? JSON.stringify(body) : undefined,
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok || !data.success) throw new Error(data.error || 'Something went wrong. Try again.');
    return data;
};

export const fetchFolders = () => send('/api/folders');
export const createFolder = (name) => send('/api/folders', 'POST', { name }).then((d) => d.folder);
export const renameFolder = (folderId, name) => send(`/api/folders/${folderId}`, 'PATCH', { name }).then((d) => d.folder);
export const deleteFolder = (folderId) => send(`/api/folders/${folderId}`, 'DELETE');

// type is 'sentence' (id = publicId or sentenceId) or 'extended_text' (id = textId).
export const moveToFolder = (type, id, folderId) =>
    send('/api/saved-items/folder', 'PUT', { type, id, folderId: folderId ?? null });
