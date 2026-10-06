'use client';
import { useEffect } from 'react';
import styles from '@/styles/components/admin/dashboard.module.scss';
import useAdminData from './useAdminData';
import { BarList, ColumnChart, Delta, StatTile } from './charts';
import { PanelSkeleton, SectionError } from './OverviewPanel';
import { fmt, fmtDate, fmtMoney, timeAgo, pct } from './format';

const STATUS_LABELS = {
    active: 'Active',
    trialing: 'Trial',
    past_due: 'Payment failing',
    canceled: 'Cancelled',
    incomplete: 'Incomplete',
    incomplete_expired: 'Expired',
    unpaid: 'Unpaid',
    paused: 'Paused',
};

export default function MoneyPanel({ days, tz, refreshKey, onForbidden, onLoaded, onOpenUser }) {
    const revenue = useAdminData(`/api/admin/stats/revenue?days=${days}`, { onForbidden });
    // Without Stripe, fall back to plan counts from the database.
    const overview = useAdminData(`/api/admin/stats/overview?days=${days}&tz=${encodeURIComponent(tz)}`, {
        onForbidden,
        enabled: revenue.data?.available === false,
    });
    const users = overview.data?.kpis?.users;

    useEffect(() => {
        if (refreshKey) revenue.reload(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshKey]);

    useEffect(() => {
        if (revenue.data?.cachedAt) onLoaded?.(revenue.data.cachedAt);
    }, [revenue.data, onLoaded]);

    const r = revenue.data;
    if (!r) return revenue.error ? <SectionError error={revenue.error} onRetry={revenue.reload} /> : <PanelSkeleton />;

    if (!r.available) {
        return (
            <div className={styles.panel}>
                <div className={`${styles.alert} ${styles.alertBad}`}>
                    <strong>Revenue numbers need Stripe</strong>
                    <span>{r.reason}. Plan counts below come from the database instead.</span>
                </div>
                {users && (
                    <div className={styles.tiles}>
                        <StatTile label="Basic" accent="var(--bp-purple)" value={fmt(users.basic)} />
                        <StatTile label="Plus" accent="var(--bp-purple)" value={fmt(users.plus)} />
                        <StatTile label="Free" accent="var(--bp-gray)" value={fmt(users.free)} />
                    </div>
                )}
            </div>
        );
    }

    const s = r.subscribers;
    const cur = r.revenue.current;
    const money = (cents) => fmtMoney(cents, r.currency);
    const arpu = s.paying ? r.mrr / s.paying : 0;

    return (
        <div className={`${styles.panel} ${revenue.loading ? styles.stale : ''}`}>
            <div className={styles.tiles}>
                <StatTile label="Monthly revenue (MRR)" accent="var(--bp-purple)" value={money(r.mrr)}>
                    <span>{money(r.mrr * 12)} a year at this rate</span>
                </StatTile>
                <StatTile label="Paying subscribers" accent="var(--bp-purple)" value={fmt(s.paying)}>
                    <span>{money(arpu)} each on average</span>
                </StatTile>
                <StatTile label="New subscriptions" accent="var(--bp-und)" value={fmt(s.newInRange)}>
                    <Delta value={s.newInRange} prev={s.newPrev} />
                </StatTile>
                <StatTile label="Cancelled" accent="var(--bp-rev)" value={fmt(s.cancelledInRange)}>
                    <Delta value={s.cancelledInRange} prev={s.cancelledPrev} invert />
                </StatTile>
                <StatTile label="Money in" accent="var(--bp-keep)" value={money(cur.total)}>
                    <Delta value={cur.total} prev={r.revenue.prev.total} />
                </StatTile>
            </div>

            {(s.trialing > 0 || s.pastDue > 0 || s.cancelling > 0) && (
                <div className={styles.alerts}>
                    {s.pastDue > 0 && (
                        <div className={`${styles.alert} ${styles.alertBad}`}>
                            <strong>{fmt(s.pastDue)} {s.pastDue === 1 ? 'payment is' : 'payments are'} failing</strong>
                            <span>Stripe is retrying. These people may churn if their card stays declined.</span>
                        </div>
                    )}
                    {s.cancelling > 0 && (
                        <div className={styles.alert}>
                            <strong>{fmt(s.cancelling)} set to cancel</strong>
                            <span>They keep access until the end of the period they paid for.</span>
                        </div>
                    )}
                    {s.trialing > 0 && (
                        <div className={styles.alert}>
                            <strong>{fmt(s.trialing)} on a free trial</strong>
                            <span>Not counted in MRR until their first payment.</span>
                        </div>
                    )}
                </div>
            )}

            <div className={styles.twoCol}>
                <section className={styles.card}>
                    <header className={styles.cardHead}>
                        <div>
                            <h2>MRR over the last year</h2>
                            <p>Monthly revenue on the first of each month, plus today.</p>
                        </div>
                    </header>
                    <ColumnChart
                        points={r.mrrHistory.map((m, i) => ({
                            key: m.date,
                            value: m.mrr,
                            note: `${fmt(m.subscribers)} subscribers${i === r.mrrHistory.length - 1 ? ' (today)' : ''}`,
                        }))}
                        label="MRR"
                        color="var(--bp-purple)"
                        format={(v) => money(v)}
                        xLabel={(d) => fmtDate(d, { month: 'short', year: '2-digit' })}
                        height={180}
                    />
                </section>
                <section className={styles.card}>
                    <header className={styles.cardHead}>
                        <div>
                            <h2>Plans</h2>
                            <p>Monthly value of each plan right now.</p>
                        </div>
                    </header>
                    <BarList
                        rows={r.plans.map((p) => ({
                            key: `${p.plan}-${p.interval}`,
                            label: `${p.plan} ${p.interval}`,
                            value: p.mrr,
                            note: `${fmt(p.count)} people · ${pct(p.mrr, r.mrr)}`,
                        }))}
                        format={(v) => money(v)}
                        color="var(--bp-purple)"
                        empty="No paying subscribers yet"
                    />
                    <div className={styles.split}>
                        <div><span className={styles.tileLabel}>Subscriptions</span><strong>{money(cur.subscriptions)}</strong></div>
                        <div><span className={styles.tileLabel}>One-time packs</span><strong>{money(cur.oneTime)}</strong></div>
                        <div><span className={styles.tileLabel}>Payments</span><strong>{fmt(cur.count)}</strong></div>
                    </div>
                    <p className={styles.cardNote}>Money in this period, after refunds.</p>
                </section>
            </div>

            <div className={styles.twoCol}>
                <section className={styles.card}>
                    <header className={styles.cardHead}><div><h2>Latest payments</h2></div></header>
                    <ul className={styles.feed}>
                        {r.recentPayments.length ? r.recentPayments.map((p) => (
                            <li key={p.id}>
                                <PersonRow person={p} onOpenUser={onOpenUser}
                                    side={<>
                                        <span className={styles.chip}>{p.kind === 'subscription' ? 'Subscription' : 'Pack'}</span>
                                        <strong className={styles.amount}>{p.refunded ? 'Refunded' : fmtMoney(p.amount, p.currency, { exact: true })}</strong>
                                        <time dateTime={p.date}>{timeAgo(p.date)}</time>
                                    </>}
                                />
                            </li>
                        )) : <p className={styles.empty}>No payments in the last 60 days.</p>}
                    </ul>
                </section>
                <section className={styles.card}>
                    <header className={styles.cardHead}><div><h2>Latest subscriptions</h2></div></header>
                    <ul className={styles.feed}>
                        {r.recentSubscriptions.map((sub) => (
                            <li key={sub.id}>
                                <PersonRow person={sub} onOpenUser={onOpenUser}
                                    side={<>
                                        <span className={`${styles.chip} ${sub.status === 'active' && !sub.cancelAtPeriodEnd ? styles.chipPaid : sub.status === 'canceled' || sub.status === 'past_due' ? styles.chipBad : ''}`}>
                                            {sub.cancelAtPeriodEnd && sub.status !== 'canceled' ? 'Cancelling' : STATUS_LABELS[sub.status] || sub.status}
                                        </span>
                                        <span className={styles.muted}>{sub.plan} {sub.interval}</span>
                                        <time dateTime={sub.created}>{fmtDate(sub.created)}</time>
                                    </>}
                                />
                            </li>
                        ))}
                    </ul>
                </section>
            </div>
        </div>
    );
}

function PersonRow({ person, side, onOpenUser }) {
    const label = person.name || person.email || 'Unknown customer';
    const content = (
        <>
            <span className={styles.avatar} aria-hidden="true">{label.slice(0, 1).toUpperCase()}</span>
            <span className={styles.feedMain}>
                <strong>{label}</strong>
                {person.name && person.email && <span>{person.email}</span>}
            </span>
            <span className={styles.feedSide}>{side}</span>
        </>
    );
    return person.userId
        ? <button type="button" className={styles.feedRow} onClick={() => onOpenUser(person.userId)}>{content}</button>
        : <div className={styles.feedRow}>{content}</div>;
}
