'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Dashboard from '@/components/Dashboard';
import { characterOf } from '@/components/speak/characters';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/styles/pages/speakResults.module.scss';

const when = (d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
const mins = (s) => (s < 60 ? `${s}s` : `${Math.round(s / 60)} min`);
const starCount = (done, total) => (total && done === total ? 3 : done * 2 >= total && done > 0 ? 2 : 1);

export default function SpeakHistoryPage() {
    const { isAuthenticated, loading: authLoading } = useAuth();
    const [rows, setRows] = useState(null);
    const [more, setMore] = useState(false);
    const [error, setError] = useState('');

    const load = (before) => {
        fetch(`/api/speak/history${before ? `?before=${encodeURIComponent(before)}` : ''}`, { credentials: 'include' })
            .then((r) => r.json())
            .then((d) => {
                if (!d.success) throw new Error(d.error);
                setRows((r) => [...(before ? r || [] : []), ...d.sessions]);
                setMore(d.more);
            })
            .catch(() => setError('Could not load your conversations. Try again in a moment.'));
    };
    useEffect(() => { if (isAuthenticated) load(); }, [isAuthenticated]);

    return (
        <Dashboard>
            <div className={styles.history}>
                <div className={styles.histHead}>
                    <h1>Your conversations</h1>
                    <Link href="/speak">← Back to Speak</Link>
                </div>
                {!authLoading && !isAuthenticated && (
                    <div className={styles.empty}>
                        Sign in to see your past calls with Horang and Sora.
                        <Link className={styles.againBtn} href="/login?next=/speak/history">Sign in</Link>
                    </div>
                )}
                {error && <p className={styles.noteMuted}>{error}</p>}
                {isAuthenticated && rows === null && !error && <div className={styles.shimmerBox}><span /><span /><span /></div>}
                {rows && rows.length === 0 && (
                    <div className={styles.empty}>
                        No conversations yet. Your calls, their transcripts and notes will show up here.
                        <Link className={styles.againBtn} href="/speak">Start a conversation</Link>
                    </div>
                )}
                {rows && rows.length > 0 && (
                    <ul className={styles.histList}>
                        {rows.map((r) => {
                            const ch = characterOf(r.character);
                            const stars = starCount(r.goalsDone, r.goalsTotal);
                            return (
                                <li key={r.sessionId}>
                                    <Link className={styles.histItem} href={`/speak/history/${r.sessionId}`} style={{ '--accent': ch.color, '--accent-soft': ch.soft }}>
                                        <span className={styles.histThumb} style={r.background ? { backgroundImage: `url(/images/speak/bg/${r.background}.webp)` } : undefined}>
                                            <img src={`/images/speak/${ch.id}/happy.webp`} alt="" />
                                        </span>
                                        <span className={styles.histInfo}>
                                            <span className={styles.histTitle}>{r.title}</span>
                                            <span className={styles.histMeta}>{when(r.startedAt)} · with {ch.name} · {mins(r.seconds)} · {r.goalsDone}/{r.goalsTotal} goals</span>
                                            {r.summary && <span className={styles.histSummary}>{r.summary}</span>}
                                        </span>
                                        <span className={styles.histStars} aria-label={`${stars} of 3 stars`}>{'★'.repeat(stars)}</span>
                                    </Link>
                                </li>
                            );
                        })}
                    </ul>
                )}
                {more && <button type="button" className={styles.moreBtn} onClick={() => load(rows[rows.length - 1].startedAt)}>Show older</button>}
            </div>
        </Dashboard>
    );
}
