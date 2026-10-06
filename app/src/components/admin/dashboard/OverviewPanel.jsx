'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import styles from '@/styles/components/admin/dashboard.module.scss';
import useAdminData from './useAdminData';
import { BarList, ColumnChart, Delta, StatTile } from './charts';
import {
    fmt, fmtMoney, pct, timeAgo, sourceLabel, languageLabel, FUNNEL, TIERS,
} from './format';

const METRICS = [
    { key: 'signups', label: 'Signups', color: 'var(--bp-read)' },
    { key: 'active', label: 'Active learners', color: 'var(--bp-und)' },
    { key: 'sentences', label: 'Sentences analyzed', color: 'var(--bp-flame)' },
];

// Over a year, daily columns get too thin to read, so group by week.
export const toWeeks = (series, key) => {
    const weeks = [];
    for (let i = series.length; i > 0; i -= 7) {
        const chunk = series.slice(Math.max(0, i - 7), i);
        const total = chunk.reduce((sum, d) => sum + d[key], 0);
        weeks.unshift({
            key: chunk[0].date,
            value: key === 'active' ? Math.round(total / chunk.length) : total,
            note: key === 'active' ? 'average a day, week starting here' : 'week starting here',
        });
    }
    return weeks;
};

export function SectionError({ error, onRetry }) {
    return (
        <div className={styles.sectionError} role="alert">
            <span>{error}</span>
            <button type="button" className={styles.ghostButton} onClick={() => onRetry(true)}>Try again</button>
        </div>
    );
}

export default function OverviewPanel({ days, tz, refreshKey, onForbidden, onLoaded, onOpenUser, onGoTab }) {
    const overview = useAdminData(`/api/admin/stats/overview?days=${days}&tz=${encodeURIComponent(tz)}`, { onForbidden });
    const revenue = useAdminData(`/api/admin/stats/revenue?days=${days}`, { onForbidden });
    const feed = useAdminData('/api/admin/stats/feed', { onForbidden });
    const [metric, setMetric] = useState('signups');
    const [sourceView, setSourceView] = useState('heardFrom');

    useEffect(() => {
        if (!refreshKey) return;
        overview.reload(true);
        revenue.reload(true);
        feed.reload(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshKey]);

    useEffect(() => {
        if (overview.data) onLoaded?.(overview.data.cachedAt);
    }, [overview.data, onLoaded]);

    const o = overview.data;
    const r = revenue.data;
    const f = feed.data;
    const metricInfo = METRICS.find((m) => m.key === metric);

    const points = useMemo(() => {
        if (!o) return [];
        if (o.series.length > 120) return toWeeks(o.series, metric);
        return o.series.map((d) => ({
            key: d.date,
            value: d[metric],
            note: metric === 'sentences' && d.anonSentences ? `${fmt(d.anonSentences)} without an account` : null,
        }));
    }, [o, metric]);

    if (!o) {
        return overview.error
            ? <SectionError error={overview.error} onRetry={overview.reload} />
            : <PanelSkeleton />;
    }

    const k = o.kpis;
    const signedUp = o.funnel[0]?.users || 0;
    const sourceRows = (o.sources[sourceView] || []).map((row) => ({
        key: row.key,
        label: sourceView === 'heardFrom' ? sourceLabel(row.key) : row.key,
        value: row.count,
        note: pct(row.count, signedUp),
    }));
    if (sourceView === 'heardFrom' && o.sources.heardFromUnknown) {
        sourceRows.push({ key: '_none', label: "Didn't say", value: o.sources.heardFromUnknown, note: pct(o.sources.heardFromUnknown, signedUp), color: 'var(--bp-gray)' });
    }

    const needsLook = (f?.feedback?.length || 0) + (f?.jobs?.failed?.length || 0) + (f?.pendingSuggestions ? 1 : 0);

    return (
        <div className={`${styles.panel} ${overview.loading ? styles.stale : ''}`}>
            <div className={styles.tiles}>
                <StatTile label="Monthly revenue" accent="var(--bp-purple)" loading={revenue.loading && !r}
                    value={r?.available ? fmtMoney(r.mrr, r.currency) : r ? `${fmt(k.users.basic + k.users.plus)} paid` : '…'}>
                    {r?.available ? (
                        <button type="button" className={styles.tileLink} onClick={() => onGoTab('money')}>
                            {fmt(r.subscribers.paying)} paying{r.subscribers.trialing ? ` · ${fmt(r.subscribers.trialing)} trialing` : ''}
                        </button>
                    ) : r ? (
                        <span>{fmt(k.users.basic)} Basic · {fmt(k.users.plus)} Plus (Stripe not connected)</span>
                    ) : null}
                </StatTile>
                <StatTile label="New signups" value={fmt(k.signups.value)}>
                    <Delta value={k.signups.value} prev={k.signups.prev} />
                </StatTile>
                <StatTile label="Active learners" accent="var(--bp-und)" value={fmt(k.active.value)}>
                    <Delta value={k.active.value} prev={k.active.prev} />
                </StatTile>
                <StatTile label="Sentences analyzed" accent="var(--bp-flame)" value={fmt(k.sentences.value)}>
                    <Delta value={k.sentences.value} prev={k.sentences.prev} />
                </StatTile>
                <StatTile label="Signup to paid" accent="var(--bp-keep)" value={pct(k.paidFromCohort, k.signups.value, 1)}>
                    <span>{fmt(k.paidFromCohort)} of {fmt(k.signups.value)} new learners</span>
                </StatTile>
            </div>

            <section className={styles.card}>
                <header className={styles.cardHead}>
                    <div>
                        <h2>Growth</h2>
                        <p>{o.series.length > 120 ? 'Per week' : 'Per day'}, in your time zone.</p>
                    </div>
                    <div className={styles.segmented} role="tablist" aria-label="Chart metric">
                        {METRICS.map((m) => (
                            <button key={m.key} type="button" role="tab" aria-selected={metric === m.key}
                                className={metric === m.key ? styles.segOn : ''} onClick={() => setMetric(m.key)}>
                                {m.label}
                            </button>
                        ))}
                    </div>
                </header>
                <ColumnChart points={points} label={metricInfo.label} color={metricInfo.color} />
                {metric === 'sentences' && (
                    <p className={styles.cardNote}>{fmt(k.sentences.anon)} of these came from visitors without an account.</p>
                )}
                {metric === 'active' && (
                    <p className={styles.cardNote}>Signed-in people who analyzed, saved, studied or chatted that day.</p>
                )}
            </section>

            <div className={styles.twoCol}>
                <section className={styles.card}>
                    <header className={styles.cardHead}>
                        <div>
                            <h2>What new learners did</h2>
                            <p>Of the {fmt(signedUp)} people who signed up in this period.</p>
                        </div>
                    </header>
                    <ul className={styles.funnel}>
                        {o.funnel.map((step) => (
                            <li key={step.key}>
                                <div className={styles.barListHead}>
                                    <span className={styles.barListLabel}>{FUNNEL[step.key].label}</span>
                                    <span className={styles.barListValue}>{fmt(step.users)}<em>{pct(step.users, signedUp)}</em></span>
                                </div>
                                <div className={styles.barTrack}>
                                    <i style={{ width: `${signedUp ? Math.max(step.users ? 1.5 : 0, (step.users / signedUp) * 100) : 0}%`, background: FUNNEL[step.key].color }} />
                                </div>
                            </li>
                        ))}
                    </ul>
                    <h3 className={styles.subHead}>Who ends up paying (all time)</h3>
                    <table className={styles.miniTable}>
                        <thead><tr><th>Said they came from</th><th>Learners</th><th>Paid</th><th>Rate</th></tr></thead>
                        <tbody>
                            {o.sources.allTime.slice(0, 9).map((row) => (
                                <tr key={row.key || 'none'}>
                                    <td>{sourceLabel(row.key)}</td>
                                    <td>{fmt(row.users)}</td>
                                    <td>{fmt(row.paid)}</td>
                                    <td><strong>{pct(row.paid, row.users, 1)}</strong></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <section className={styles.card}>
                    <header className={styles.cardHead}>
                        <div>
                            <h2>Where they came from</h2>
                            <p>New learners in this period.</p>
                        </div>
                        <div className={styles.segmented} role="tablist" aria-label="Source type">
                            {[['heardFrom', 'They said'], ['utm', 'UTM'], ['referrers', 'Referrer']].map(([key, label]) => (
                                <button key={key} type="button" role="tab" aria-selected={sourceView === key}
                                    className={sourceView === key ? styles.segOn : ''} onClick={() => setSourceView(key)}>
                                    {label}
                                </button>
                            ))}
                        </div>
                    </header>
                    <BarList rows={sourceRows} empty="No source data for this period" />
                </section>
            </div>

            <div className={styles.twoCol}>
                <section className={styles.card}>
                    <header className={styles.cardHead}>
                        <div>
                            <h2>Newest learners</h2>
                            <p>Click anyone to see what they have done.</p>
                        </div>
                        <button type="button" className={styles.ghostButton} onClick={() => onGoTab('users')}>All users</button>
                    </header>
                    {f ? (
                        <ul className={styles.feed}>
                            {f.signups.map((u) => (
                                <li key={u.userId}>
                                    <button type="button" className={styles.feedRow} onClick={() => onOpenUser(u.userId)}>
                                        <span className={styles.avatar} aria-hidden="true">{(u.name || '?').slice(0, 1).toUpperCase()}</span>
                                        <span className={styles.feedMain}>
                                            <strong>{u.name}</strong>
                                            <span>{u.email}</span>
                                        </span>
                                        <span className={styles.feedSide}>
                                            {u.tier > 0 && <span className={`${styles.chip} ${styles.chipPaid}`}>{TIERS[u.tier]}</span>}
                                            {(u.heardFrom || u.utmSource || u.referrer) && (
                                                <span className={styles.chip}>{u.heardFrom ? sourceLabel(u.heardFrom) : u.utmSource || u.referrer}</span>
                                            )}
                                            <time dateTime={u.dateCreated}>{timeAgo(u.dateCreated)}</time>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    ) : feed.error ? <SectionError error={feed.error} onRetry={feed.reload} /> : <p className={styles.empty}>Loading…</p>}
                </section>

                <section className={styles.card}>
                    <header className={styles.cardHead}>
                        <div>
                            <h2>Needs a look</h2>
                            <p>{f ? (needsLook ? 'Feedback, failures and requests from the last week.' : 'All clear.') : 'Loading…'}</p>
                        </div>
                    </header>
                    {f && (
                        <div className={styles.attention}>
                            {(f.jobs.failed.length > 0 || f.pendingSuggestions > 0) && (
                                <div className={styles.alerts}>
                                    {f.jobs.failed.length > 0 && (
                                        <div className={`${styles.alert} ${styles.alertBad}`}>
                                            <strong>{fmt(f.jobs.counts.failed || f.jobs.failed.length)} paragraph analyses failed this week</strong>
                                            <span>out of {fmt(Object.values(f.jobs.counts).reduce((a, b) => a + b, 0))} started. Latest: {f.jobs.failed[0].error || 'no error message'}</span>
                                        </div>
                                    )}
                                    {f.pendingSuggestions > 0 && (
                                        <Link href="/lyrics/suggestions" className={styles.alert}>
                                            <strong>{fmt(f.pendingSuggestions)} lyric requests waiting</strong>
                                            <span>Review them on the suggestions page.</span>
                                        </Link>
                                    )}
                                </div>
                            )}
                            <h3 className={styles.subHead}>Latest feedback</h3>
                            {f.feedback.length ? (
                                <ul className={styles.quotes}>
                                    {f.feedback.map((item) => (
                                        <li key={item.feedbackId}>
                                            <p>{item.text}</p>
                                            <span>
                                                <button type="button" className={styles.linkButton} onClick={() => onOpenUser(item.userId)}>{item.name}</button>
                                                {' · '}{timeAgo(item.dateCreated)}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            ) : <p className={styles.empty}>No feedback yet.</p>}
                            <Link href="/feedback" className={styles.ghostButton}>Open the feedback page</Link>
                        </div>
                    )}
                </section>
            </div>

            <section className={styles.card}>
                <header className={styles.cardHead}>
                    <div>
                        <h2>Languages people study</h2>
                        <p>Sentences analyzed in this period, by language.</p>
                    </div>
                </header>
                <BarList rows={o.languages.map((l) => ({ key: l.key, label: languageLabel(l.key), value: l.count, note: pct(l.count, k.sentences.value) }))} color="var(--bp-read)" />
            </section>
        </div>
    );
}

export function PanelSkeleton() {
    return (
        <div className={styles.panel} aria-busy="true">
            <div className={styles.tiles}>
                {[0, 1, 2, 3, 4].map((i) => <div key={i} className={`${styles.tile} ${styles.skeleton}`} />)}
            </div>
            <div className={`${styles.card} ${styles.skeleton}`} style={{ height: 320 }} />
        </div>
    );
}
