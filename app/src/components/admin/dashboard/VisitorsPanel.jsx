'use client';
import { useEffect, useMemo, useState } from 'react';
import styles from '@/styles/components/admin/dashboard.module.scss';
import useAdminData from './useAdminData';
import { ColumnChart, Delta, StatTile } from './charts';
import { PanelSkeleton, SectionError, toWeeks } from './OverviewPanel';
import { fmt, pct, timeAgo } from './format';

const WEEK = 7 * 24 * 60 * 60 * 1000;

export default function VisitorsPanel({ days, tz, refreshKey, onForbidden }) {
    const overview = useAdminData(`/api/admin/stats/overview?days=${days}&tz=${encodeURIComponent(tz)}`, { onForbidden });
    const [sortBy, setSortBy] = useState('lastUpdated');
    const [page, setPage] = useState(1);
    const visitors = useAdminData(`/api/admin/rate-limits?identifierType=ipAddress&limit=20&page=${page}&sortBy=${sortBy}&sortOrder=desc`, { onForbidden });

    useEffect(() => {
        if (!refreshKey) return;
        overview.reload(true);
        visitors.reload();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshKey]);

    const o = overview.data;
    const points = useMemo(() => {
        if (!o) return [];
        if (o.series.length > 120) return toWeeks(o.series, 'anonSentences');
        return o.series.map((d) => ({ key: d.date, value: d.anonSentences }));
    }, [o]);

    if (!o) return overview.error ? <SectionError error={overview.error} onRetry={overview.reload} /> : <PanelSkeleton />;

    const anon = o.kpis.sentences.anon;
    const v = visitors.data;

    return (
        <div className={`${styles.panel} ${overview.loading ? styles.stale : ''}`}>
            <div className={styles.tiles}>
                <StatTile label="Analyses without an account" accent="var(--bp-gray)" value={fmt(anon)}>
                    <span>{pct(anon, o.kpis.sentences.value)} of all analyses this period</span>
                </StatTile>
                <StatTile label="Visitors who tried it" accent="var(--bp-gray)" value={v ? fmt(v.totalAnonymousUsers) : '…'}>
                    <span>unique addresses, all time</span>
                </StatTile>
                <StatTile label="Their analyses, all time" accent="var(--bp-gray)" value={v ? fmt(v.totalAnonymousSentences) : '…'}>
                    <span>{v && v.totalAnonymousUsers ? `${(v.totalAnonymousSentences / v.totalAnonymousUsers).toFixed(1)} each on average` : ''}</span>
                </StatTile>
                <StatTile label="New signups" value={fmt(o.kpis.signups.value)}>
                    <Delta value={o.kpis.signups.value} prev={o.kpis.signups.prev} />
                </StatTile>
            </div>

            <section className={styles.card}>
                <header className={styles.cardHead}>
                    <div>
                        <h2>Analyses by visitors without an account</h2>
                        <p>People trying Hanbok before signing up. Free visitors get 10 a week.</p>
                    </div>
                </header>
                <ColumnChart points={points} label="Analyses" color="var(--bp-gray-d)" />
            </section>

            <section className={styles.card}>
                <header className={styles.cardHead}>
                    <div>
                        <h2>Visitors</h2>
                        <p>Each row is one network address. Heavy users here are good candidates for a signup nudge.</p>
                    </div>
                    <label className={styles.inlineSelect}>
                        <span>Sort</span>
                        <select value={sortBy} onChange={(e) => { setSortBy(e.target.value); setPage(1); }}>
                            <option value="lastUpdated">Most recent</option>
                            <option value="totalSentences">Most analyses</option>
                        </select>
                    </label>
                </header>
                {visitors.error && <SectionError error={visitors.error} onRetry={visitors.reload} />}
                <div className={`${styles.tableWrap} ${visitors.loading ? styles.stale : ''}`}>
                    <table className={styles.table}>
                        <thead><tr><th>Address</th><th>Analyses</th><th>This week</th><th>Last seen</th></tr></thead>
                        <tbody>
                            {(v?.rateLimits || []).map((row) => {
                                const thisWeek = row.weekStartDate && Date.now() - new Date(row.weekStartDate).getTime() < WEEK ? row.weekSentences : 0;
                                return (
                                    <tr key={row.identifier}>
                                        <td className={styles.mono}>{row.identifier}</td>
                                        <td className={styles.num}>{fmt(row.totalSentences)}</td>
                                        <td className={styles.num}>{fmt(thisWeek)}{thisWeek >= 10 && <span className={`${styles.chip} ${styles.chipBad}`}>at limit</span>}</td>
                                        <td>{timeAgo(row.lastUpdated)}</td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
                <div className={styles.pager}>
                    <button type="button" className={styles.ghostButton} disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>Previous</button>
                    <span>Page {fmt(page)} of {fmt(v?.pagination?.totalPages || 1)}</span>
                    <button type="button" className={styles.ghostButton} disabled={page >= (v?.pagination?.totalPages || 1)} onClick={() => setPage((p) => p + 1)}>Next</button>
                </div>
            </section>
        </div>
    );
}
