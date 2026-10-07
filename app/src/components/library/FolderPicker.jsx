'use client';
import { useEffect, useRef, useState } from 'react';
import { createFolder, fetchFolders, moveToFolder } from '@/lib/libraryFolders';
import styles from '@/styles/components/folderpicker.module.scss';

export const FolderIcon = () => (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.icon}>
        <path fill="currentColor" d="M3 6.5A2.5 2.5 0 0 1 5.5 4h4.1c.7 0 1.3.3 1.8.8L12.8 6h5.7A2.5 2.5 0 0 1 21 8.5v9a2.5 2.5 0 0 1-2.5 2.5h-13A2.5 2.5 0 0 1 3 17.5z" />
    </svg>
);

// A small menu for filing a saved sentence or paragraph in a Library folder.
// It moves the item as soon as a folder is picked, and can make a new folder.
// Pass `folders` to reuse a list the page already has; otherwise it loads them.
export default function FolderPicker({
    type,
    itemId,
    currentFolderId = null,
    heading = 'Move to folder',
    align = 'right',
    folders: knownFolders,
    onMoved,
    onFolderCreated,
    onClose,
}) {
    const ref = useRef(null);
    const [folders, setFolders] = useState(knownFolders || null);
    const [newName, setNewName] = useState('');
    const [busy, setBusy] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (knownFolders) return;
        fetchFolders()
            .then((data) => setFolders(data.folders))
            .catch(() => setFolders([]));
    }, [knownFolders]);

    useEffect(() => {
        ref.current?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    }, []);

    useEffect(() => {
        const onPointer = (event) => {
            if (ref.current && !ref.current.contains(event.target)) onClose?.();
        };
        const onKey = (event) => { if (event.key === 'Escape') onClose?.(); };
        document.addEventListener('mousedown', onPointer);
        document.addEventListener('touchstart', onPointer);
        document.addEventListener('keydown', onKey);
        return () => {
            document.removeEventListener('mousedown', onPointer);
            document.removeEventListener('touchstart', onPointer);
            document.removeEventListener('keydown', onKey);
        };
    }, [onClose]);

    const move = async (folder) => {
        const folderId = folder ? folder.folderId : null;
        if (folderId === (currentFolderId ?? null)) { onClose?.(); return; }
        setBusy(true);
        setError(null);
        try {
            await moveToFolder(type, itemId, folderId);
            onMoved?.(folderId, folder);
            onClose?.();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    const addFolder = async (event) => {
        event.preventDefault();
        const name = newName.trim();
        if (!name) return;
        setBusy(true);
        setError(null);
        try {
            const folder = await createFolder(name);
            setFolders((list) => (list?.some((f) => f.folderId === folder.folderId) ? list : [...(list || []), folder]));
            onFolderCreated?.(folder);
            await moveToFolder(type, itemId, folder.folderId);
            onMoved?.(folder.folderId, folder);
            onClose?.();
        } catch (err) {
            setError(err.message);
        } finally {
            setBusy(false);
        }
    };

    // Clicks inside shouldn't open the row the picker sits on.
    const stop = (event) => event.stopPropagation();

    return (
        <div ref={ref} className={`${styles.picker} ${align === 'left' ? styles.alignLeft : ''}`} role="dialog" aria-label={heading} onClick={stop}>
            <div className={styles.header}>
                <span className={styles.heading}>{heading}</span>
                <button type="button" className={styles.close} onClick={onClose} aria-label="Close">×</button>
            </div>

            {folders === null ? (
                <p className={styles.note}>Loading folders…</p>
            ) : (
                <ul className={styles.list}>
                    {folders.map((folder) => (
                        <li key={folder.folderId}>
                            <button
                                type="button"
                                className={`${styles.option} ${folder.folderId === currentFolderId ? styles.current : ''}`}
                                onClick={() => move(folder)}
                                disabled={busy}
                            >
                                <FolderIcon />
                                <span className={styles.name}>{folder.name}</span>
                                {folder.folderId === currentFolderId && <span className={styles.check} aria-label="Current folder">✓</span>}
                            </button>
                        </li>
                    ))}
                    {currentFolderId !== null && currentFolderId !== undefined && (
                        <li>
                            <button type="button" className={`${styles.option} ${styles.none}`} onClick={() => move(null)} disabled={busy}>
                                Take it out of this folder
                            </button>
                        </li>
                    )}
                    {folders.length === 0 && <li className={styles.note}>No folders yet. Make your first one:</li>}
                </ul>
            )}

            <form className={styles.newFolder} onSubmit={addFolder}>
                <input
                    type="text"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="New folder name"
                    maxLength={60}
                    aria-label="New folder name"
                    disabled={busy}
                />
                <button type="submit" disabled={busy || !newName.trim()}>Add</button>
            </form>

            {error && <p className={styles.error} role="alert">{error}</p>}
        </div>
    );
}
