'use client';
import { useEffect } from 'react';
import styles from '@/styles/components/admin/dashboard.module.scss';
import useAdminData from './useAdminData';
import { StatTile } from './charts';
import { PanelSkeleton, SectionError } from './OverviewPanel';
import { fmt, fmtDate, pct, timeAgo, sourceLabel, FEATURES, STAGES, TIERS } from './format';

// Cell shade for a retention rate: one hue, lighter to darker.
const cellStyle = (rate) => {
    if (rate === null) return undefined;
    const strength = Math.round(8 + Math.min(1, rate) * 80);
    return {
        background: `color-mix(in srgb, var(--bp-read) ${strength}%, var(--background))`,
        color: strength > 50 ? '#fff' : 'var(--foreground)',
    };
};

export default function LearnersPanel({ days, tz, refreshKey, onForbidden, onLoaded, onOpenUser }) {
    const engagement = useAdminData(`/api/admin/stats/engagement?days=${days}&tz=${encodeURIComponent(tz)}`, { onForbidden });

    useEffect(() => {
        if (refreshKey) engagement.reload(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshKey]);

    useEffect(() => {
        if (engagement.data) onLoaded?.(engagement.data.cachedAt);
    }, [engagement.data, onLoaded]);

    const e = engagement.data;
    if (!e) {
        return engagement.error ? <SectionError error={engagement.error} onRetry={engagement.reload} /> : <PanelSkeleton />;
    }

    const maxUsers = Math.max(1, ...e.features.list.map((row) => row.users));
    const weeks = Math.max(0, ...e.retention.map((c) => c.active.length));

    return (
        <div className={`${styles.panel} ${engagement.loading ? styles.stale : ''}`}>
            <div className={styles.tiles}>
                <StatTile label="Active today" accent="var(--bp-und)" value={fmt(e.active.day)}>
                    <span>in the last 24 hours</span>
                </StatTile>
                <StatTile label="Active this week" accent="var(--bp-und)" value={fmt(e.active.week)}>
                    <span>last 7 days</span>
                </StatTile>
                <StatTile label="Active this month" accent="var(--bp-und)" value={fmt(e.active.month)}>
                    <span>last 30 days</span>
                </StatTile>
                <StatTile label="Stickiness" accent="var(--bp-flame)" value={pct(e.active.avgDaily, e.active.month)}>
                    <span>average day&apos;s learners out of the month&apos;s ({fmt(e.active.avgDaily)} a day)</span>
                </StatTile>
            </div>

            <section className={styles.card}>
                <header className={styles.cardHead}>
                    <div>
                        <h2>How people use Hanbok</h2>
                        <p>Signed-in learners who used each part of the loop in this period. Visitors without an account also ran {fmt(e.features.anonAnalyses)} analyses.</p>
                    </div>
                </header>
                <ul className={styles.featureList}>
                    {e.features.list.map((row) => (
                        <li key={row.key}>
                            <span className={styles.stageTag} style={{ '--stage': STAGES[row.stage].color }}>{STAGES[row.stage].label}</span>
                            <span className={styles.featureName}>{FEATURES[row.key].label}</span>
                            <div className={styles.barTrack}>
                                <i style={{ width: `${Math.max(row.users ? 1.5 : 0, (row.users / maxUsers) * 100)}%`, background: STAGES[row.stage].color }} />
                            </div>
                            <span className={styles.featureNums}>
                                <strong>{fmt(row.users)}</strong> people
                                <em>{fmt(row.uses)} {FEATURES[row.key].unit}</em>
                            </span>
                        </li>
                    ))}
                </ul>
            </section>

            <section className={styles.card}>
                <header className={styles.cardHead}>
                    <div>
                        <h2>Do they come back?</h2>
                        <p>Each row is a week of signups. Each cell is the share of them active that many weeks later. Week 0 is the week they joined.</p>
                    </div>
                </header>
                <div className={styles.cohortWrap}>
                    <table className={styles.cohort}>
                        <thead>
                            <tr>
                                <th scope="col">Joined</th>
                                <th scope="col">People</th>
                                {Array.from({ length: weeks }, (_, i) => <th key={i} scope="col">Wk {i}</th>)}
                            </tr>
                        </thead>
                        <tbody>
                            {e.retention.map((cohort) => (
                                <tr key={cohort.weekStart}>
                                    <th scope="row">{fmtDate(cohort.weekStart)}</th>
                                    <td className={styles.cohortSize}>{fmt(cohort.size)}</td>
                                    {Array.from({ length: weeks }, (_, i) => {
                                        const count = cohort.active[i];
                                        if (count === undefined) return <td key={i} className={styles.cohortEmpty} />;
                                        const rate = cohort.size ? count / cohort.size : null;
                                        return (
                                            <td key={i} style={cellStyle(rate)} title={`${fmt(count)} of ${fmt(cohort.size)} active in week ${i}`}>
                                                {rate === null ? '–' : pct(count, cohort.size)}
                                            </td>
                                        );
                                    })}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className={styles.card}>
                <header className={styles.cardHead}>
                    <div>
                        <h2>Most active learners</h2>
                        <p>By sentences analyzed in this period. Click a row for details.</p>
                    </div>
                </header>
                {e.topLearners.length ? (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr><th>Learner</th><th>Plan</th><th>Sentences</th><th>Reviews</th><th>Came from</th><th>Joined</th><th>Last active</th></tr>
                            </thead>
                            <tbody>
                                {e.topLearners.map((u) => (
                                    <tr key={u.userId} className={styles.clickRow} tabIndex={0}
                                        onClick={() => onOpenUser(u.userId)}
                                        onKeyDown={(ev) => { if (ev.key === 'Enter') onOpenUser(u.userId); }}>
                                        <td><strong>{u.name}</strong><span className={styles.muted}>{u.email}</span></td>
                                        <td><span className={`${styles.chip} ${u.tier ? styles.chipPaid : ''}`}>{TIERS[u.tier] || 'Free'}</span></td>
                                        <td className={styles.num}>{fmt(u.sentences)}</td>
                                        <td className={styles.num}>{fmt(u.reviews)}</td>
                                        <td>{sourceLabel(u.heardFrom)}</td>
                                        <td>{fmtDate(u.joined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                        <td>{timeAgo(u.lastActive)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p className={styles.empty}>Nobody analyzed a sentence in this period.</p>}
            </section>
        </div>
    );
}
