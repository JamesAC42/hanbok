'use client';
import { useEffect, useMemo } from 'react';
import styles from '@/styles/components/admin/dashboard.module.scss';
import useAdminData from './useAdminData';
import { BarList, ColumnChart, Delta, StatTile } from './charts';
import { PanelSkeleton, SectionError, toWeeks } from './OverviewPanel';
import { countryLabel, eventLabel, EVENTS, fmt, fmtDuration, pct } from './format';

const EVENT_ORDER = Object.keys(EVENTS);
const DEVICE_LABELS = { mobile: 'Phone', desktop: 'Computer', laptop: 'Laptop', tablet: 'Tablet' };

// Site traffic from Umami: who visits, what they look at, where they come from,
// and which key steps they take. Signups come from our own database so the
// visitor-to-signup rate uses the real account count.
export default function TrafficSection({ days, tz, refreshKey, onForbidden, signups }) {
    const traffic = useAdminData(`/api/admin/stats/traffic?days=${days}&tz=${encodeURIComponent(tz)}`, { onForbidden });

    useEffect(() => {
        if (refreshKey) traffic.reload(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshKey]);

    const t = traffic.data;
    const points = useMemo(() => {
        if (!t?.available) return [];
        if (t.series.length > 120) return toWeeks(t.series, 'visitors');
        return t.series.map((d) => ({ key: d.date, value: d.visitors, note: `${fmt(d.pageviews)} page views` }));
    }, [t]);

    if (!t) return traffic.error ? <SectionError error={traffic.error} onRetry={traffic.reload} /> : <PanelSkeleton />;
    if (!t.available) return <TrafficSetup reason={t.reason} />;

    const { current: c, prev: p } = t.stats;
    const avgVisit = c.visits ? c.totaltime / c.visits : 0;
    const events = [...t.events].sort((a, b) => {
        const ai = EVENT_ORDER.indexOf(a.label);
        const bi = EVENT_ORDER.indexOf(b.label);
        return (ai < 0 ? 99 : ai) - (bi < 0 ? 99 : bi) || b.value - a.value;
    });

    return (
        <div className={`${styles.panel} ${traffic.loading ? styles.stale : ''}`}>
            <div className={styles.tiles}>
                <StatTile label="Site visitors" accent="var(--bp-und)" value={fmt(c.visitors)}>
                    <Delta value={c.visitors} prev={p.visitors} />
                </StatTile>
                <StatTile label="Page views" accent="var(--bp-und)" value={fmt(c.pageviews)}>
                    <Delta value={c.pageviews} prev={p.pageviews} />
                </StatTile>
                <StatTile label="Visitors who signed up" accent="var(--bp-purple)" value={signups ? pct(signups.value, c.visitors, 1) : '…'}>
                    <span>{signups ? `${fmt(signups.value)} signups from ${fmt(c.visitors)} visitors` : ''}</span>
                </StatTile>
                <StatTile label="Average visit" accent="var(--bp-und)" value={fmtDuration(avgVisit)}>
                    <span>{pct(c.bounces, c.visits)} left after one page</span>
                </StatTile>
            </div>

            <section className={styles.card}>
                <header className={styles.cardHead}>
                    <div>
                        <h2>Visitors per day</h2>
                        <p>Everyone who opened the site, signed in or not. From Umami.</p>
                    </div>
                    <div className={styles.headActions}>
                        {t.activeNow !== null && (
                            <span className={styles.liveNow}><i aria-hidden="true" />{fmt(t.activeNow)} on the site now</span>
                        )}
                        <a className={styles.ghostButton} href={t.dashboardUrl} target="_blank" rel="noreferrer">Open Umami ↗</a>
                    </div>
                </header>
                <ColumnChart points={points} label="Visitors" color="var(--bp-und)" />
            </section>

            <div className={styles.twoCol}>
                <section className={styles.card}>
                    <header className={styles.cardHead}>
                        <div>
                            <h2>Most viewed pages</h2>
                            <p>Page views this period.</p>
                        </div>
                    </header>
                    <BarList rows={t.pages.map((r) => ({ key: r.label, label: r.label, value: r.value }))} color="var(--bp-und)" empty="No page views yet" />
                </section>
                <section className={styles.card}>
                    <header className={styles.cardHead}>
                        <div>
                            <h2>Where visitors come from</h2>
                            <p>Sites that sent visitors. People who typed the address aren&apos;t listed.</p>
                        </div>
                    </header>
                    <BarList rows={t.referrers.map((r) => ({ key: r.label, label: r.label, value: r.value }))} color="var(--bp-read)" empty="No referrers yet" />
                </section>
            </div>

            <div className={styles.twoCol}>
                <section className={styles.card}>
                    <header className={styles.cardHead}>
                        <div>
                            <h2>Key steps visitors took</h2>
                            <p>Times each step happened this period, in the order a new learner meets them.</p>
                        </div>
                    </header>
                    <BarList rows={events.map((e) => ({ key: e.label, label: eventLabel(e.label), value: e.value }))} color="var(--bp-purple)"
                        empty="No tracked steps yet. They start counting once this version is live." />
                </section>
                <section className={styles.card}>
                    <header className={styles.cardHead}>
                        <div>
                            <h2>Countries and devices</h2>
                            <p>Visitors this period.</p>
                        </div>
                    </header>
                    <BarList rows={t.countries.map((r) => ({ key: r.label, label: countryLabel(r.label), value: r.value, note: pct(r.value, c.visitors) }))} color="var(--bp-flame)" empty="No country data yet" />
                    <h3 className={styles.subHead}>Devices</h3>
                    <BarList rows={t.devices.map((r) => ({ key: r.label, label: DEVICE_LABELS[r.label] || r.label, value: r.value, note: pct(r.value, c.visitors) }))} color="var(--bp-gray)" empty="No device data yet" />
                </section>
            </div>
        </div>
    );
}

function TrafficSetup({ reason }) {
    return (
        <section className={styles.card}>
            <header className={styles.cardHead}>
                <div>
                    <h2>Connect Umami to see site traffic</h2>
                    <p>
                        {reason === 'not_configured'
                            ? 'Add an Umami login to the server and visitors, top pages, referrers and key steps show up here.'
                            : `${reason}. Check the Umami login in the server settings.`}
                    </p>
                </div>
            </header>
            <p className={styles.cardNote}>
                In server/.env set UMAMI_USERNAME and UMAMI_PASSWORD, then restart the server.
            </p>
        </section>
    );
}
