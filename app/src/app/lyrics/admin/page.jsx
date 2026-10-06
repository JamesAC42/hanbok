'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Dashboard from '@/components/Dashboard';
import dash from '@/styles/components/admin/dashboard.module.scss';
import styles from '@/styles/components/admin/lyricsAdmin.module.scss';
import { fmt, timeAgo } from '@/components/admin/dashboard/format';

const EMPTY = { title: '', artist: '', anime: '', genre: '', youtubeUrl: '', lyricsText: '', language: 'ko', published: false };
const GENRES = [['kpop', 'K-Pop'], ['jpop', 'J-Pop'], ['anime', 'Anime'], ['other', 'Other']];
const LANGUAGES = [['ko', 'Korean'], ['ja', 'Japanese'], ['en', 'English']];
const FILTERS = [['all', 'All'], ['live', 'Published'], ['draft', 'Drafts'], ['todo', 'Needs analysis']];

const toForm = (lyric) => Object.fromEntries(Object.keys(EMPTY).map((key) => [key, lyric?.[key] ?? EMPTY[key]]));

// Accepts a pasted YouTube link and keeps just the video id.
const youtubeId = (value) => {
    const text = (value || '').trim();
    const match = text.match(/(?:youtu\.be\/|[?&]v=|\/shorts\/|\/embed\/|\/live\/)([\w-]{11})/);
    return match ? match[1] : text;
};

const lineCount = (text) => text.split('\n').filter((line) => line.trim()).length;

export default function AdminLyrics() {
    const router = useRouter();
    const { user, isAuthenticated, loading } = useAuth();
    const { isAdmin, loading: adminLoading } = useAdmin();
    const { t } = useLanguage();

    const [lyrics, setLyrics] = useState([]);
    const [listState, setListState] = useState({ loading: true, error: null });
    const [selectedId, setSelectedId] = useState(null); // song _id, 'new', or null
    const [form, setForm] = useState(EMPTY);
    const [query, setQuery] = useState('');
    const [filter, setFilter] = useState('all');
    const [saving, setSaving] = useState(false);
    const [notice, setNotice] = useState(null); // { kind: 'good' | 'bad', text }
    const [analysis, setAnalysis] = useState({ running: false, log: [], progress: null });
    const [deletingAnalysis, setDeletingAnalysis] = useState(false);
    const logRef = useRef(null);
    const sourceRef = useRef(null);

    const selected = lyrics.find((l) => l._id === selectedId) || null;
    const isNew = selectedId === 'new';
    const dirty = useMemo(() => {
        if (!selectedId) return false;
        const base = isNew ? EMPTY : toForm(selected);
        return Object.keys(EMPTY).some((key) => (form[key] ?? '') !== (base[key] ?? ''));
    }, [form, selected, selectedId, isNew]);

    useEffect(() => {
        document.title = t('lyrics.adminPageTitle');
    }, [t]);

    useEffect(() => {
        if (loading || adminLoading) return;
        if (!isAuthenticated || !isAdmin(user?.email)) router.replace('/');
    }, [loading, adminLoading, isAuthenticated, isAdmin, user, router]);

    const loadLyrics = useCallback(async (attempt = 0) => {
        try {
            const response = await fetch('/api/lyrics/admin', { credentials: 'include' });
            // A request right after an analysis stream closes can hit a dropped
            // keep-alive socket in the /api proxy, so try once more.
            if (!response.ok && attempt === 0) return loadLyrics(1);
            const data = await response.json();
            if (!data.success) throw new Error(data.message || 'Could not load songs');
            setLyrics(data.lyrics.filter((l) => l && l._id));
            setListState({ loading: false, error: null });
            return data.lyrics;
        } catch (error) {
            setListState({ loading: false, error: error.message });
            return null;
        }
    }, []);

    useEffect(() => {
        if (isAuthenticated) loadLyrics();
    }, [isAuthenticated, loadLyrics]);

    // Keep the newest log line in view.
    useEffect(() => {
        if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
    }, [analysis.log]);

    // Close a running analysis stream when leaving the page.
    useEffect(() => () => sourceRef.current?.close(), []);

    // Warn before closing the tab with unsaved edits.
    useEffect(() => {
        if (!dirty) return undefined;
        const onBeforeUnload = (e) => { e.preventDefault(); e.returnValue = ''; };
        window.addEventListener('beforeunload', onBeforeUnload);
        return () => window.removeEventListener('beforeunload', onBeforeUnload);
    }, [dirty]);

    const open = (id) => {
        if (id === selectedId) return;
        if (dirty && !confirm('You have unsaved changes. Leave them?')) return;
        if (analysis.running) {
            sourceRef.current?.close();
        }
        setSelectedId(id);
        setForm(id === 'new' ? EMPTY : toForm(lyrics.find((l) => l._id === id)));
        setNotice(null);
        setAnalysis({ running: false, log: [], progress: null });
    };

    const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));

    const save = async (overrides = {}) => {
        const body = { ...form, ...overrides, youtubeUrl: youtubeId(form.youtubeUrl) };
        if (!body.title.trim() || !body.genre || !body.lyricsText.trim()) {
            setNotice({ kind: 'bad', text: 'Add a title, a genre and the lyrics before saving.' });
            return;
        }
        setSaving(true);
        setNotice(null);
        try {
            const response = await fetch(isNew ? '/api/lyrics/admin' : `/api/lyrics/admin/${selectedId}`, {
                method: isNew ? 'POST' : 'PUT',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify(body),
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.message || 'Could not save');
            const list = await loadLyrics();
            const id = isNew ? data.lyric?._id : selectedId;
            const fresh = list?.find((l) => l._id === id);
            if (fresh) {
                setSelectedId(fresh._id);
                setForm(toForm(fresh));
            } else {
                setForm(body);
            }
            setNotice({ kind: 'good', text: isNew ? 'Song added.' : overrides.published !== undefined ? (overrides.published ? 'Published. Learners can see it now.' : 'Unpublished. It is hidden from learners.') : 'Saved.' });
        } catch (error) {
            setNotice({ kind: 'bad', text: error.message });
        } finally {
            setSaving(false);
        }
    };

    const remove = async () => {
        if (!selected || !confirm(`Delete "${selected.title}"? This cannot be undone.`)) return;
        try {
            const response = await fetch(`/api/lyrics/admin/${selected._id}`, { method: 'DELETE', credentials: 'include' });
            const data = await response.json();
            if (!data.success) throw new Error(data.message || 'Could not delete');
            setLyrics((prev) => prev.filter((l) => l._id !== selected._id));
            setSelectedId(null);
            setForm(EMPTY);
        } catch (error) {
            setNotice({ kind: 'bad', text: error.message });
        }
    };

    const addLog = (type, message) => setAnalysis((prev) => ({ ...prev, log: [...prev.log, { type, message, at: new Date() }] }));

    const generate = () => {
        if (!selected) return;
        const lyricKey = selected._id;
        setAnalysis({ running: true, log: [{ type: 'info', message: 'Connecting…', at: new Date() }], progress: 0 });

        const source = new EventSource(`/api/lyrics/admin/generate-analysis/${lyricKey}`, { withCredentials: true });
        sourceRef.current = source;
        const parse = (event) => { try { return JSON.parse(event.data); } catch { return {}; } };
        const finish = () => { source.close(); setAnalysis((prev) => ({ ...prev, running: false })); };

        source.onopen = () => addLog('info', 'Connected. Analyzing every line…');
        source.onmessage = (event) => addLog('info', parse(event).message || String(event.data));
        source.addEventListener('status', (event) => addLog('status', parse(event).message));
        source.addEventListener('progress', (event) => {
            const data = parse(event);
            setAnalysis((prev) => ({
                ...prev,
                progress: Math.max(0, Math.min(100, data.progress || 0)),
                log: [...prev.log, { type: 'progress', message: `Line ${data.processed} of ${data.total}`, at: new Date() }],
            }));
        });
        source.addEventListener('error', (event) => {
            const data = event.data ? parse(event) : {};
            addLog('error', data.message || (source.readyState === EventSource.CLOSED ? 'The connection closed before the analysis finished.' : 'Connection lost. Trying again…'));
            if (event.data || source.readyState === EventSource.CLOSED) finish();
        });
        source.addEventListener('complete', async (event) => {
            addLog('success', parse(event).message || 'Analysis finished.');
            setAnalysis((prev) => ({ ...prev, progress: 100 }));
            setLyrics((prev) => prev.map((l) => (l._id === lyricKey ? { ...l, hasAnalysis: true } : l)));
            finish();
            await loadLyrics();
        });
    };

    const deleteAnalysis = async () => {
        if (!selected || !confirm('Delete the analysis for this song? Every analyzed line will be removed.')) return;
        setDeletingAnalysis(true);
        try {
            const response = await fetch(`/api/lyrics/${selected._id}/analysis`, { method: 'DELETE', credentials: 'include' });
            const data = await response.json();
            if (!data.success) throw new Error(data.message || 'Could not delete the analysis');
            setLyrics((prev) => prev.map((l) => (l._id === selected._id ? { ...l, hasAnalysis: false } : l)));
            setNotice({ kind: 'good', text: `Analysis deleted (${fmt(data.deletedSentences)} lines).` });
        } catch (error) {
            setNotice({ kind: 'bad', text: error.message });
        } finally {
            setDeletingAnalysis(false);
        }
    };

    const visible = useMemo(() => {
        const q = query.trim().toLowerCase();
        return lyrics.filter((l) => {
            if (filter === 'live' && !l.published) return false;
            if (filter === 'draft' && l.published) return false;
            if (filter === 'todo' && l.hasAnalysis) return false;
            if (!q) return true;
            return [l.title, l.artist, l.anime].some((v) => v && v.toLowerCase().includes(q));
        });
    }, [lyrics, query, filter]);

    const counts = useMemo(() => ({
        all: lyrics.length,
        live: lyrics.filter((l) => l.published).length,
        draft: lyrics.filter((l) => !l.published).length,
        todo: lyrics.filter((l) => !l.hasAnalysis).length,
    }), [lyrics]);

    if (loading || adminLoading || !isAuthenticated || !isAdmin(user?.email)) return null;

    const videoId = youtubeId(form.youtubeUrl);
    const lines = lineCount(form.lyricsText);

    return (
        <Dashboard>
            <div className={`${dash.page} ${styles.page}`}>
                <header className={dash.pageHead}>
                    <div>
                        <Link href="/admin?tab=tools" className={styles.back}>← Admin</Link>
                        <h1 className={dash.pageTitle}>Lyrics library</h1>
                    </div>
                    <button type="button" className={dash.pressButton} onClick={() => open('new')}>+ Add a song</button>
                </header>

                <div className={`${styles.layout} ${selectedId ? styles.editing : ''}`}>
                    <aside className={`${dash.card} ${styles.listCard}`}>
                        <input
                            type="search"
                            className={dash.input}
                            placeholder="Search title, artist or anime"
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            aria-label="Search songs"
                        />
                        <div className={styles.filters} role="group" aria-label="Filter songs">
                            {FILTERS.map(([key, label]) => (
                                <button key={key} type="button" aria-pressed={filter === key}
                                    className={`${styles.filter} ${filter === key ? styles.filterOn : ''}`}
                                    onClick={() => setFilter(key)}>
                                    {label} <span>{fmt(counts[key])}</span>
                                </button>
                            ))}
                        </div>

                        {listState.error && <p className={dash.sectionError}>{listState.error}</p>}
                        {listState.loading ? <p className={dash.empty}>Loading songs…</p> : (
                            <ul className={styles.songs}>
                                {visible.map((l) => (
                                    <li key={l._id}>
                                        <button type="button" className={`${styles.song} ${selectedId === l._id ? styles.songOn : ''}`} onClick={() => open(l._id)}>
                                            <span className={styles.songMain}>
                                                <strong>{l.title || 'Untitled'}</strong>
                                                <span>{[l.artist, l.anime].filter(Boolean).join(' · ') || 'Unknown artist'}</span>
                                            </span>
                                            <span className={styles.songMeta}>
                                                <span className={`${dash.chip} ${l.published ? styles.chipLive : ''}`}>{l.published ? 'Live' : 'Draft'}</span>
                                                {!l.hasAnalysis && <span className={`${dash.chip} ${dash.chipBad}`}>No analysis</span>}
                                                <span className={styles.views}>{fmt(l.viewCount)} views</span>
                                            </span>
                                        </button>
                                    </li>
                                ))}
                                {!visible.length && <p className={dash.empty}>No songs match.</p>}
                            </ul>
                        )}
                    </aside>

                    <section className={styles.editor}>
                        {!selectedId ? (
                            <div className={`${dash.card} ${styles.placeholder}`}>
                                <h2>Pick a song to edit</h2>
                                <p>Or add a new one. A song goes live in three steps: save the lyrics, generate the analysis, then publish.</p>
                                <button type="button" className={dash.pressButton} onClick={() => open('new')}>+ Add a song</button>
                            </div>
                        ) : (
                            <>
                                <button type="button" className={styles.mobileBack} onClick={() => open(null)}>← All songs</button>

                                <form className={dash.card} onSubmit={(e) => { e.preventDefault(); save(); }}>
                                    <header className={dash.cardHead}>
                                        <div>
                                            <h2>{isNew ? 'New song' : form.title || 'Untitled'}</h2>
                                            <p>
                                                {isNew ? 'Saved as a draft. You can publish after the analysis is ready.' : (
                                                    <>
                                                        {selected?.published ? 'Live on the lyrics page' : 'Draft, hidden from learners'}
                                                        {selected?.dateCreated && ` · added ${timeAgo(selected.dateCreated)}`}
                                                        {selected && ` · ${fmt(selected.viewCount)} views`}
                                                    </>
                                                )}
                                            </p>
                                        </div>
                                        {dirty && <span className={`${dash.chip} ${styles.unsaved}`}>Unsaved changes</span>}
                                    </header>

                                    <Steps isNew={isNew} selected={selected} />

                                    <div className={styles.fields}>
                                        <label className={`${dash.field} ${styles.wide}`}>
                                            <span>Title</span>
                                            <input className={dash.input} value={form.title} onChange={(e) => set('title', e.target.value)} required />
                                        </label>
                                        <label className={dash.field}>
                                            <span>Artist</span>
                                            <input className={dash.input} value={form.artist} onChange={(e) => set('artist', e.target.value)} />
                                        </label>
                                        <label className={dash.field}>
                                            <span>Anime (optional)</span>
                                            <input className={dash.input} value={form.anime} onChange={(e) => set('anime', e.target.value)} />
                                        </label>
                                        <div className={dash.field}>
                                            <span>Genre</span>
                                            <div className={dash.segmented} role="group" aria-label="Genre">
                                                {GENRES.map(([key, label]) => (
                                                    <button key={key} type="button" aria-pressed={form.genre === key}
                                                        className={form.genre === key ? dash.segOn : ''} onClick={() => set('genre', key)}>{label}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <div className={dash.field}>
                                            <span>Language</span>
                                            <div className={dash.segmented} role="group" aria-label="Language">
                                                {LANGUAGES.map(([key, label]) => (
                                                    <button key={key} type="button" aria-pressed={form.language === key}
                                                        className={form.language === key ? dash.segOn : ''} onClick={() => set('language', key)}>{label}</button>
                                                ))}
                                            </div>
                                        </div>
                                        <label className={`${dash.field} ${styles.wide}`}>
                                            <span>YouTube video (paste the link or the id)</span>
                                            <div className={styles.videoRow}>
                                                <input className={dash.input} value={form.youtubeUrl} placeholder="https://www.youtube.com/watch?v=…"
                                                    onChange={(e) => set('youtubeUrl', e.target.value)}
                                                    onBlur={(e) => set('youtubeUrl', youtubeId(e.target.value))} />
                                                {/^[\w-]{11}$/.test(videoId) && (
                                                    // eslint-disable-next-line @next/next/no-img-element
                                                    <img key={videoId} src={`https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`} alt="" className={styles.thumb}
                                                        onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                                                )}
                                            </div>
                                        </label>
                                        <label className={`${dash.field} ${styles.wide}`}>
                                            <span>Lyrics, one line per line of the song <em className={styles.lineCount}>{fmt(lines)} lines</em></span>
                                            <textarea className={`${dash.input} ${styles.lyricsBox}`} value={form.lyricsText}
                                                onChange={(e) => set('lyricsText', e.target.value)} lang={form.language} required />
                                        </label>
                                    </div>

                                    {notice && <p className={`${styles.notice} ${notice.kind === 'bad' ? styles.noticeBad : ''}`} role="status">{notice.text}</p>}

                                    <footer className={styles.actions}>
                                        <button type="submit" className={dash.pressButton} disabled={saving || (!dirty && !isNew)}>
                                            {saving ? 'Saving…' : isNew ? 'Save song' : 'Save changes'}
                                        </button>
                                        {!isNew && selected && (
                                            <button type="button" className={dash.ghostButton} disabled={saving || dirty}
                                                title={dirty ? 'Save your changes first' : undefined}
                                                onClick={() => save({ published: !selected.published })}>
                                                {selected.published ? 'Unpublish' : 'Publish'}
                                            </button>
                                        )}
                                        {!isNew && selected?.lyricId && (
                                            <Link href={`/lyrics/${selected.lyricId}`} target="_blank" className={dash.ghostButton}>Preview ↗</Link>
                                        )}
                                        {!isNew && <button type="button" className={`${dash.ghostButton} ${styles.danger}`} onClick={remove}>Delete song</button>}
                                    </footer>
                                </form>

                                {!isNew && selected && (
                                    <section className={dash.card}>
                                        <header className={dash.cardHead}>
                                            <div>
                                                <h2>Line-by-line analysis</h2>
                                                <p>{selected.hasAnalysis
                                                    ? 'Ready. Learners can tap any line to see its breakdown.'
                                                    : 'Not generated yet. This analyzes every line of the lyrics with the same model as sentence analysis.'}</p>
                                            </div>
                                            <span className={`${dash.chip} ${selected.hasAnalysis ? styles.chipLive : dash.chipBad}`}>{selected.hasAnalysis ? 'Ready' : 'Missing'}</span>
                                        </header>

                                        {(analysis.running || analysis.log.length > 0) && (
                                            <div className={styles.progressBox}>
                                                {analysis.progress !== null && (
                                                    <div className={dash.barTrack} aria-label={`${Math.round(analysis.progress)}% done`}>
                                                        <i style={{ width: `${analysis.progress}%`, background: 'var(--bp-pink)' }} />
                                                    </div>
                                                )}
                                                <ol ref={logRef} className={styles.log}>
                                                    {analysis.log.map((entry, i) => (
                                                        <li key={i} className={styles[`log_${entry.type}`]}>
                                                            <time>{entry.at.toLocaleTimeString()}</time>
                                                            <span>{entry.message}</span>
                                                        </li>
                                                    ))}
                                                </ol>
                                            </div>
                                        )}

                                        <div className={styles.actions}>
                                            {!selected.hasAnalysis && (
                                                <button type="button" className={styles.pinkButton} onClick={generate} disabled={analysis.running || dirty}
                                                    title={dirty ? 'Save your changes first' : undefined}>
                                                    {analysis.running ? 'Analyzing…' : 'Generate analysis'}
                                                </button>
                                            )}
                                            {selected.hasAnalysis && (
                                                <>
                                                    <Link href={`/lyrics/${selected.lyricId}`} target="_blank" className={dash.ghostButton}>Open the song page ↗</Link>
                                                    <button type="button" className={`${dash.ghostButton} ${styles.danger}`} onClick={deleteAnalysis} disabled={deletingAnalysis}>
                                                        {deletingAnalysis ? 'Deleting…' : 'Delete analysis'}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                        {selected.hasAnalysis && (
                                            <p className={dash.cardNote}>Changed the lyrics? Delete the analysis and generate it again so the lines match.</p>
                                        )}
                                    </section>
                                )}
                            </>
                        )}
                    </section>
                </div>
            </div>
        </Dashboard>
    );
}

function Steps({ isNew, selected }) {
    const steps = [
        { label: 'Lyrics saved', done: !isNew },
        { label: 'Analysis ready', done: !!selected?.hasAnalysis },
        { label: 'Published', done: !!selected?.published },
    ];
    return (
        <ol className={styles.steps}>
            {steps.map((step, i) => (
                <li key={step.label} className={step.done ? styles.stepDone : ''}>
                    <span aria-hidden="true">{step.done ? '✓' : i + 1}</span>
                    {step.label}
                </li>
            ))}
        </ol>
    );
}
