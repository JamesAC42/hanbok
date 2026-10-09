'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import Dashboard from '@/components/Dashboard';
import { characterOf } from '@/components/speak/characters';
import { RecapNotes, useRecap, starsFor } from '@/components/speak/SpeakResults';
import styles from '@/styles/pages/speakResults.module.scss';

const when = (d) => new Date(d).toLocaleString(undefined, { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' });
const fmtTime = (s) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;

export default function SpeakHistoryItemPage() {
    const { id } = useParams();
    const [session, setSession] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetch(`/api/speak/history/${encodeURIComponent(id)}`, { credentials: 'include' })
            .then((r) => r.json())
            .then((d) => { if (d.success) setSession(d.session); else setError(d.error || 'Not found'); })
            .catch(() => setError('Could not load this conversation.'));
    }, [id]);

    return (
        <Dashboard>
            <div className={styles.history}>
                <div className={styles.histHead}>
                    <Link href="/speak/history">← All conversations</Link>
                </div>
                {error && <div className={styles.empty}>That conversation couldn&apos;t be found.<Link className={styles.againBtn} href="/speak/history">Back to your conversations</Link></div>}
                {!session && !error && <div className={styles.shimmerBox}><span /><span /><span /></div>}
                {session && <Detail session={session} />}
            </div>
        </Dashboard>
    );
}

function Detail({ session }) {
    const ch = characterOf(session.character);
    // Calls from before notes existed get them made the first time they're opened.
    const { recap, loading, failed } = useRecap(session.sessionId, session.recap);
    const stars = starsFor(session.goals);
    return (
        <div className={styles.notes} style={{ '--accent': ch.color, '--accent-soft': ch.soft }}>
            <header className={styles.detailHead}>
                <span className={styles.detailFace}><img src={`/images/speak/${ch.id}/${ch.celebrate}.webp`} alt="" /></span>
                <div>
                    <h1>{session.title}</h1>
                    <p className={styles.meaning}>{when(session.startedAt)} · with {ch.name} · {fmtTime(session.seconds)} · <span className={styles.histStars}>{'★'.repeat(stars)}</span></p>
                    {session.summary && <p>&ldquo;{session.summary}&rdquo;</p>}
                </div>
            </header>
            <ul className={styles.goalList}>
                {session.goals.map((g) => (
                    <li key={g.text} className={g.done ? styles.goalDone : ''}><span className={styles.goalMark} aria-hidden="true">{g.done ? '✓' : ''}</span>{g.text}</li>
                ))}
            </ul>
            <RecapNotes recap={recap} loading={loading} failed={failed} phrases={session.phrases} tips={session.tips} language={session.language} nativeLanguage={session.nativeLanguage || 'en'} />
            <section className={styles.saveBlock}>
                <h2 className={styles.blockTitle}>Transcript</h2>
                <ul className={styles.script}>
                    {session.transcript.map((m, i) => (
                        <li key={i} className={m.who === 'you' ? styles.scriptYou : styles.scriptChar}>
                            <span className={styles.scriptWho}>{m.who === 'you' ? 'You' : ch.name}</span>
                            <span lang={session.language} className={styles.scriptText}>{m.text}</span>
                        </li>
                    ))}
                </ul>
            </section>
        </div>
    );
}
