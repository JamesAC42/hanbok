'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import styles from '@/styles/components/admin/dashboard.module.scss';
import useAdminData from './useAdminData';
import EditUserModal from '../EditUserModal';
import { fmt, fmtDateTime, timeAgo, sourceLabel, languageLabel, TIERS } from './format';

const COUNTS = [
    ['sentences', 'Sentences'],
    ['paragraphs', 'Paragraphs'],
    ['words', 'Saved words'],
    ['savedSentences', 'Saved sentences'],
    ['flashcards', 'Flashcards'],
    ['reviews', 'Reviews'],
    ['studyDays', 'Study days'],
    ['conversations', 'Tutor chats'],
];

export default function UserDrawer({ userId, onClose, onForbidden, onUserUpdated }) {
    const { data, error, loading, reload } = useAdminData(`/api/admin/stats/users/${userId}`, { onForbidden });
    const [editing, setEditing] = useState(false);
    const closeRef = useRef(null);

    useEffect(() => {
        closeRef.current?.focus();
        const onKey = (e) => { if (e.key === 'Escape' && !editing) onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose, editing]);

    const u = data?.user;
    const a = u?.attribution || {};

    return (
        <div className={styles.drawerOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label={u ? `Learner ${u.name}` : 'Learner'}>
                <header className={styles.drawerHead}>
                    <span className={styles.avatarLarge} aria-hidden="true">{(u?.name || '?').slice(0, 1).toUpperCase()}</span>
                    <div className={styles.drawerTitle}>
                        <h2>{u?.name || (error ? 'Could not load' : 'Loading…')}</h2>
                        {u && <span>{u.email}</span>}
                    </div>
                    <button ref={closeRef} type="button" className={styles.iconButton} onClick={onClose} aria-label="Close">×</button>
                </header>

                {error && <p className={styles.sectionError}>{error}</p>}

                {u && (
                    <div className={`${styles.drawerBody} ${loading ? styles.stale : ''}`}>
                        <div className={styles.chips}>
                            <span className={`${styles.chip} ${u.tier ? styles.chipPaid : ''}`}>{TIERS[u.tier] || 'Free'}</span>
                            {u.subscription?.status && (
                                <span className={`${styles.chip} ${u.subscription.status === 'active' ? '' : styles.chipBad}`}>Subscription {u.subscription.status}</span>
                            )}
                            <span className={styles.chip}>{u.method === 'google' ? 'Google sign-in' : u.verified ? 'Email, verified' : 'Email, not verified'}</span>
                            <span className={styles.chip}>#{u.userId}</span>
                        </div>

                        <dl className={styles.facts}>
                            <div><dt>Joined</dt><dd>{fmtDateTime(u.dateCreated)}</dd></div>
                            <div><dt>Last active</dt><dd>{data.lastActive ? `${timeAgo(data.lastActive)}` : 'Never'}</dd></div>
                            <div><dt>Said they came from</dt><dd>{sourceLabel(a.heardFrom)}</dd></div>
                            {(a.utm_source || a.utm_campaign) && <div><dt>Campaign</dt><dd>{[a.utm_source, a.utm_medium, a.utm_campaign].filter(Boolean).join(' / ')}</dd></div>}
                            {a.referrer && <div><dt>Referrer</dt><dd className={styles.breakAll}>{a.referrer}</dd></div>}
                            {a.landingPath && <div><dt>First page</dt><dd>{a.landingPath}</dd></div>}
                            {u.subscription?.startDate && <div><dt>Subscription since</dt><dd>{fmtDateTime(u.subscription.startDate)}</dd></div>}
                            {u.subscription?.customerId && (
                                <div><dt>Stripe</dt><dd>
                                    <a href={`https://dashboard.stripe.com/customers/${encodeURIComponent(u.subscription.customerId)}`} target="_blank" rel="noreferrer">Open customer ↗</a>
                                </dd></div>
                            )}
                        </dl>

                        <h3 className={styles.subHead}>What they have done</h3>
                        <div className={styles.countGrid}>
                            {COUNTS.map(([key, label]) => (
                                <div key={key}><strong>{fmt(data.counts[key])}</strong><span>{label}</span></div>
                            ))}
                        </div>

                        {data.featureUsage?.length > 0 && (
                            <>
                                <h3 className={styles.subHead}>Usage counters</h3>
                                <ul className={styles.plainList}>
                                    {data.featureUsage.map((row) => (
                                        <li key={row.feature}>
                                            <span>{row.feature.replace(/_/g, ' ')}</span>
                                            <span><strong>{fmt(row.count)}</strong> · last {timeAgo(row.lastUsed)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}

                        <h3 className={styles.subHead}>Recent sentences</h3>
                        {data.recent.length ? (
                            <ul className={styles.plainList}>
                                {data.recent.map((s) => (
                                    <li key={s.sentenceId}>
                                        <Link href={`/sentence/${s.sentenceId}`} target="_blank" className={styles.sentenceLink} lang={s.originalLanguage}>{s.text}</Link>
                                        <span className={styles.muted}>{languageLabel(s.originalLanguage)} · {timeAgo(s.dateCreated)}</span>
                                    </li>
                                ))}
                            </ul>
                        ) : <p className={styles.empty}>No sentences yet.</p>}

                        <h3 className={styles.subHead}>Limits and credits</h3>
                        <ul className={styles.plainList}>
                            <li><span>Audio credits left</span><strong>{fmt(u.remainingAudioGenerations)}</strong></li>
                            <li><span>Image extracts left</span><strong>{fmt(u.remainingImageExtracts)}</strong></li>
                            <li><span>Bought sentence analyses left</span><strong>{fmt(u.remainingSentenceAnalyses)}</strong></li>
                            <li><span>Max saved sentences / words</span><strong>{fmt(u.maxSavedSentences)} / {fmt(u.maxSavedWords)}</strong></li>
                        </ul>

                        <div className={styles.drawerActions}>
                            <button type="button" className={styles.pressButton} onClick={() => setEditing(true)}>Edit plan and limits</button>
                            <a className={styles.ghostButton} href={`mailto:${u.email}`}>Email them</a>
                        </div>
                    </div>
                )}
            </aside>
            {editing && u && (
                <EditUserModal
                    user={u}
                    onClose={() => setEditing(false)}
                    onUserUpdated={(updated) => {
                        setEditing(false);
                        reload(true);
                        onUserUpdated?.(updated);
                    }}
                />
            )}
        </div>
    );
}
