'use client';
import { useEffect, useState } from 'react';
import styles from '@/styles/components/admin/dashboard.module.scss';
import useAdminData from './useAdminData';
import { BarList, ColumnChart, StatTile } from './charts';
import { PanelSkeleton, SectionError } from './OverviewPanel';
import { fmt, fmtDate, timeAgo, TIERS } from './format';
import { CHROME_EXTENSION_URL } from '@/lib/extension';

const ACTIONS = {
    analyze: 'Analyzed a sentence',
    saveWord: 'Saved a word',
    saveSentence: 'Saved a sentence',
    audio: 'Played audio',
    wordDetails: 'Opened word details',
    open: 'Opened the popup',
    sync: 'Synced word highlights',
};

const CHARTS = [
    { key: 'people', label: 'People', color: 'var(--bp-und)' },
    { key: 'analyses', label: 'Analyses', color: 'var(--bp-read)' },
];

export default function ExtensionPanel({ days, tz, refreshKey, onForbidden, onLoaded, onOpenUser }) {
    const stats = useAdminData(`/api/admin/stats/extension?days=${days}&tz=${encodeURIComponent(tz)}`, { onForbidden });
    const [chart, setChart] = useState('people');

    useEffect(() => {
        if (refreshKey) stats.reload(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshKey]);

    useEffect(() => {
        if (stats.data) onLoaded?.(stats.data.cachedAt);
    }, [stats.data, onLoaded]);

    const x = stats.data;
    if (!x) return stats.error ? <SectionError error={stats.error} onRetry={stats.reload} /> : <PanelSkeleton />;

    const chartInfo = CHARTS.find((c) => c.key === chart);
    const analyses = x.actions.find((a) => a.key === 'analyze');
    const saves = x.actions.filter((a) => a.key === 'saveWord' || a.key === 'saveSentence').reduce((sum, a) => sum + a.uses, 0);

    return (
        <div className={`${styles.panel} ${stats.loading ? styles.stale : ''}`}>
            <p className={styles.cardNote}>
                {x.trackingSince ? `Counting extension use since ${fmtDate(x.trackingSince, { month: 'short', day: 'numeric', year: 'numeric' })}. ` : 'No extension use recorded yet. '}
                Installs and uninstalls are only in the{' '}
                <a href="https://chrome.google.com/webstore/devconsole" target="_blank" rel="noopener noreferrer">Chrome Web Store dashboard</a>
                {CHROME_EXTENSION_URL && <> (<a href={CHROME_EXTENSION_URL} target="_blank" rel="noopener noreferrer">listing</a>)</>}.
            </p>

            <div className={styles.tiles}>
                <StatTile label="Learners with it" accent="var(--bp-keep)" value={fmt(x.people.known)}>
                    <span>{fmt(x.people.used)} have used it · {fmt(x.people.tiers[1] + x.people.tiers[2])} paying</span>
                </StatTile>
                <StatTile label="Active this week" accent="var(--bp-und)" value={fmt(x.active.week)}>
                    <span>{fmt(x.active.day)} today · {fmt(x.active.month)} this month</span>
                </StatTile>
                <StatTile label="Analyses from it" accent="var(--bp-read)" value={fmt(analyses?.uses)}>
                    <span>by {fmt(analyses?.people)} people in this period</span>
                </StatTile>
                <StatTile label="Saves from it" accent="var(--bp-flame)" value={fmt(saves)}>
                    <span>words and sentences in this period</span>
                </StatTile>
            </div>

            <section className={styles.card}>
                <header className={styles.cardHead}>
                    <div>
                        <h2>Daily use</h2>
                        <p>People who used the extension each day, signed in or not, in your time zone.</p>
                    </div>
                    <div className={styles.segmented} role="tablist" aria-label="Chart metric">
                        {CHARTS.map((c) => (
                            <button key={c.key} type="button" role="tab" aria-selected={chart === c.key}
                                className={chart === c.key ? styles.segOn : ''} onClick={() => setChart(c.key)}>
                                {c.label}
                            </button>
                        ))}
                    </div>
                </header>
                <ColumnChart points={x.daily.map((d) => ({ key: d.key, value: d[chart] }))} label={chartInfo.label} color={chartInfo.color} />
            </section>

            <section className={styles.card}>
                <header className={styles.cardHead}>
                    <div>
                        <h2>What they do with it</h2>
                        <p>Times each thing happened in this period, and how many people did it.</p>
                    </div>
                </header>
                <BarList
                    rows={x.actions.map((a) => ({ key: a.key, label: ACTIONS[a.key] || a.key, value: a.uses, note: `${fmt(a.people)} people` }))}
                    color="var(--bp-keep)"
                />
            </section>

            <section className={styles.card}>
                <header className={styles.cardHead}>
                    <div>
                        <h2>Who uses it</h2>
                        <p>Signed-in learners the extension or the site has seen it with, most recent first. Counts are for this period. Click a row for details.</p>
                    </div>
                </header>
                {x.users.length ? (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead>
                                <tr><th>Learner</th><th>Plan</th><th>Analyses</th><th>Saves</th><th>Joined</th><th>First seen</th><th>Last seen</th><th>Version</th></tr>
                            </thead>
                            <tbody>
                                {x.users.map((u) => (
                                    <tr key={u.userId} className={styles.clickRow} tabIndex={0}
                                        onClick={() => onOpenUser(u.userId)}
                                        onKeyDown={(ev) => { if (ev.key === 'Enter') onOpenUser(u.userId); }}>
                                        <td><strong>{u.name}</strong><span className={styles.muted}>{u.email}</span></td>
                                        <td><span className={`${styles.chip} ${u.tier ? styles.chipPaid : ''}`}>{TIERS[u.tier] || 'Free'}</span></td>
                                        <td className={styles.num}>{fmt(u.analyses)}</td>
                                        <td className={styles.num}>{fmt(u.saves)}</td>
                                        <td>{fmtDate(u.joined, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                        <td>{fmtDate(u.firstSeen)}</td>
                                        <td>{timeAgo(u.lastSeen)}</td>
                                        <td>{u.version || '–'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p className={styles.empty}>No signed-in learner has used the extension since counting started.</p>}
            </section>
        </div>
    );
}
