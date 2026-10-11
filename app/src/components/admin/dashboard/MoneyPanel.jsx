'use client';
import { useEffect, useState } from 'react';
import styles from '@/styles/components/admin/dashboard.module.scss';
import useAdminData from './useAdminData';
import { BarList, ColumnChart, Delta, LineChart, StatTile } from './charts';
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
    const revenue = useAdminData(`/api/admin/stats/revenue?days=${days}&tz=${encodeURIComponent(tz)}`, { onForbidden });
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
    const exact = (cents, currency = r.currency) => fmtMoney(cents, currency, { exact: true });
    const arpu = s.paying ? r.mrr / s.paying : 0;
    const daily = r.daily || [];
    const sinceLabel = daily.length ? fmtDate(daily[0].date) : `${days} days ago`;
    const couponGap = (r.mrrList ?? r.mrr) - r.mrr;

    return (
        <div className={`${styles.panel} ${revenue.loading ? styles.stale : ''}`}>
            {r.today && <TodayCard today={r.today} exact={exact} />}

            <div className={styles.tiles}>
                <StatTile label="Monthly revenue (MRR)" accent="var(--bp-purple)" value={exact(r.mrr)}>
                    {r.movement && <Delta value={r.mrr} prev={r.movement.from} suffix={`since ${sinceLabel}`} />}
                    {couponGap >= 50 && <span>{money(r.mrrList)} before coupons</span>}
                    {r.mrrCancelling > 0 && <span>{exact(r.mrr - r.mrrCancelling)} without the {fmt(s.cancelling)} set to cancel</span>}
                </StatTile>
                <StatTile label="Paying subscribers" accent="var(--bp-purple)" value={fmt(s.paying)}>
                    <span>{money(arpu)} each on average{s.discounted ? ` · ${fmt(s.discounted)} on a coupon` : ''}</span>
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

            {daily.length > 0 && (
                <div className={styles.twoCol}>
                    <section className={styles.card}>
                        <header className={styles.cardHead}>
                            <div>
                                <h2>Gross volume</h2>
                                <p>Payments each day before refunds, against the {days} days before.</p>
                            </div>
                        </header>
                        <div className={styles.chartFigures}>
                            <strong>{exact(r.revenue.gross ?? 0)}</strong>
                            <Delta value={r.revenue.gross ?? 0} prev={r.revenue.grossPrev ?? 0} suffix="" />
                            <span>{exact(r.revenue.grossPrev ?? 0)} previous period</span>
                        </div>
                        <Legend items={[['This period', 'var(--bp-purple)'], ['Previous period', 'var(--bp-gray)', true]]} />
                        <LineChart
                            label="Gross volume by day"
                            count={daily.length}
                            series={[
                                { label: 'this period', values: daily.map((d) => d.gross), color: 'var(--bp-purple)', pointLabel: (i) => fmtDate(daily[i].date) },
                                { label: 'previous period', values: daily.map((d) => d.prevGross), color: 'var(--bp-gray)', dashed: true, pointLabel: (i) => fmtDate(daily[i].prevDate) },
                            ]}
                            format={money}
                            xLabel={(i) => fmtDate(daily[i].date)}
                        />
                    </section>
                    <section className={styles.card}>
                        <header className={styles.cardHead}>
                            <div>
                                <h2>MRR</h2>
                                <p>Monthly revenue at the end of each day, after coupons.</p>
                            </div>
                        </header>
                        <div className={styles.chartFigures}>
                            <strong>{exact(r.mrr)}</strong>
                            {r.movement && <Delta value={r.mrr} prev={r.movement.from} suffix="" />}
                            {r.movement && <span>{exact(r.movement.from)} on {sinceLabel}</span>}
                        </div>
                        <Legend items={[['This period', 'var(--bp-purple)'], ['Previous period', 'var(--bp-gray)', true]]} />
                        <LineChart
                            label="MRR by day"
                            count={daily.length}
                            zeroBase={false}
                            series={[
                                { label: 'this period', values: daily.map((d) => d.mrr), color: 'var(--bp-purple)', pointLabel: (i) => fmtDate(daily[i].date) },
                                { label: 'previous period', values: daily.map((d) => d.prevMrr), color: 'var(--bp-gray)', dashed: true, pointLabel: (i) => fmtDate(daily[i].prevDate) },
                            ]}
                            format={exact}
                            xLabel={(i) => fmtDate(daily[i].date)}
                        />
                        {r.movement && (
                            <div className={styles.movement}>
                                <span className={`${styles.chip} ${styles.chipGood}`}>+{exact(r.movement.newMrr)} from {fmt(r.movement.newCount)} new</span>
                                <span className={`${styles.chip} ${styles.chipBad}`}>−{exact(r.movement.churnedMrr)} from {fmt(r.movement.churnedCount)} cancelled</span>
                                {Math.abs(r.movement.otherMrr) >= 1 && (
                                    <span className={styles.chip}>{r.movement.otherMrr > 0 ? '+' : '−'}{exact(Math.abs(r.movement.otherMrr))} plan changes</span>
                                )}
                            </div>
                        )}
                    </section>
                </div>
            )}

            <div className={styles.twoCol}>
                <ActivityCard events={r.events || []} days={days} exact={exact} onOpenUser={onOpenUser} />
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
            </div>

            {r.mrrBreakdown?.length > 0 && <MrrBreakdown rows={r.mrrBreakdown} total={r.mrr} exact={exact} onOpenUser={onOpenUser} />}

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
                            <p>Monthly value of each plan right now, after coupons.</p>
                        </div>
                    </header>
                    <BarList
                        rows={r.plans.map((p) => ({
                            key: `${p.plan}-${p.interval}`,
                            label: `${p.plan} ${p.interval}`,
                            value: p.mrr,
                            note: `${fmt(p.count)} ${p.count === 1 ? 'person' : 'people'}${p.discounted ? ` (${fmt(p.discounted)} on a coupon)` : ''} · ${pct(p.mrr, r.mrr)}`,
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
        </div>
    );
}

// Every subscription counted in today's MRR, to check against Stripe's list.
function MrrBreakdown({ rows, total, exact, onOpenUser }) {
    return (
        <section className={styles.card}>
            <header className={styles.cardHead}>
                <div>
                    <h2>What's in MRR</h2>
                    <p>The {fmt(rows.length)} subscriptions that make up {exact(total)}, largest first. Yearly plans count a twelfth of their price.</p>
                </div>
            </header>
            <details className={styles.breakdown}>
                <summary>Show all {fmt(rows.length)}</summary>
                <div className={styles.tableWrap}>
                    <table className={styles.table}>
                        <thead><tr><th>Who</th><th>Plan</th><th>Status</th><th>Since</th><th className={styles.num}>Monthly</th></tr></thead>
                        <tbody>
                            {rows.map((row) => (
                                <tr key={row.subscriptionId} className={row.userId ? styles.clickRow : undefined} onClick={row.userId ? () => onOpenUser(row.userId) : undefined}>
                                    <td><strong>{row.name || row.email || 'Unknown customer'}</strong>{row.name && row.email && <span className={styles.muted}>{row.email}</span>}</td>
                                    <td>{row.plan} {row.interval}{row.coupon ? ` · ${row.coupon.name}` : ''}</td>
                                    <td>{row.cancelAtPeriodEnd ? 'Set to cancel' : STATUS_LABELS[row.status] || row.status}</td>
                                    <td>{fmtDate(row.since, { month: 'short', day: 'numeric', year: 'numeric' })}</td>
                                    <td className={styles.num}>{exact(row.monthly, row.currency)}{row.monthly < row.listMonthly - 0.5 && <span className={styles.muted}> of {exact(row.listMonthly, row.currency)}</span>}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </details>
        </section>
    );
}

const hourLabel = (h) => {
    const hour = h % 24;
    return `${hour % 12 || 12} ${hour < 12 ? 'AM' : 'PM'}`;
};

function Legend({ items }) {
    return (
        <div className={styles.legend} aria-hidden="true">
            {items.map(([text, color, dashed]) => (
                <span key={text}><i className={dashed ? styles.legendDashed : undefined} style={{ borderColor: color }} />{text}</span>
            ))}
        </div>
    );
}

// Stripe's "Today": money in since midnight against yesterday, hour by hour.
function TodayCard({ today, exact }) {
    // Index i is the running total at i o'clock, so both lines start at zero.
    const todayLine = [0, ...today.hourly];
    const yesterdayLine = [0, ...today.yesterdayHourly];
    const asOf = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    return (
        <section className={styles.card}>
            <header className={styles.cardHead}>
                <div>
                    <h2>Today</h2>
                    <p>Money in since midnight, before refunds, against yesterday.</p>
                </div>
            </header>
            <div className={styles.today}>
                <div className={styles.todayFigures}>
                    <div className={styles.figure}>
                        <span>Gross volume</span>
                        <strong>{exact(today.gross)}</strong>
                        <span>as of {asOf}</span>
                    </div>
                    <div className={styles.figureRow}>
                        <div className={`${styles.figure} ${styles.figureSmall}`}>
                            <span>Yesterday</span>
                            <strong>{exact(today.yesterday)}</strong>
                            <span>{exact(today.yesterdaySoFar)} by this time</span>
                        </div>
                        <div className={`${styles.figure} ${styles.figureSmall}`}>
                            <span>New subscriptions</span>
                            <strong>{fmt(today.newSubscriptions)}</strong>
                            <span>since midnight</span>
                        </div>
                    </div>
                </div>
                <div>
                    <Legend items={[['Today', 'var(--bp-purple)'], ['Yesterday', 'var(--bp-gray)', true]]} />
                    <LineChart
                        label="Gross volume today and yesterday"
                        count={yesterdayLine.length}
                        series={[
                            { label: 'today', values: todayLine, color: 'var(--bp-purple)', pointLabel: (i) => `today by ${hourLabel(i)}` },
                            { label: 'yesterday', values: yesterdayLine, color: 'var(--bp-gray)', dashed: true, pointLabel: (i) => `yesterday by ${hourLabel(i)}` },
                        ]}
                        format={exact}
                        xLabel={hourLabel}
                        height={150}
                    />
                </div>
            </div>
        </section>
    );
}

const EVENT_TEXT = {
    new: { icon: '+', label: 'New subscription' },
    trial: { icon: '◷', label: 'Started a trial' },
    cancelling: { icon: '!', label: 'Set to cancel' },
    cancelled: { icon: '−', label: 'Cancelled' },
};

const dayHeading = (date) => {
    const d = new Date(date);
    const key = d.toDateString();
    const now = new Date();
    if (key === now.toDateString()) return 'Today';
    if (key === new Date(now.getTime() - 86400000).toDateString()) return 'Yesterday';
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
};

const couponText = (coupon, exact, currency) => {
    const off = coupon.percentOff ? `${coupon.percentOff}% off` : coupon.amountOff ? `${exact(coupon.amountOff, currency)} off` : '';
    return [coupon.name, off].filter(Boolean).join(' · ');
};

// New subscriptions and cancellations, newest first, grouped by day.
function ActivityCard({ events, days, exact, onOpenUser }) {
    const [all, setAll] = useState(false);
    const shown = all ? events : events.slice(0, 12);
    let lastDay = null;
    return (
        <section className={styles.card}>
            <header className={styles.cardHead}>
                <div>
                    <h2>Subscription activity</h2>
                    <p>New subscriptions, trials and cancellations in the last {days} days.</p>
                </div>
            </header>
            {shown.length ? (
                <ul className={styles.feed}>
                    {shown.map((e) => {
                        const heading = dayHeading(e.at);
                        const showHeading = heading !== lastDay;
                        lastDay = heading;
                        return (
                            <li key={`${e.type}-${e.subscriptionId}`}>
                                {showHeading && <div className={styles.dayLabel}>{heading}</div>}
                                <EventRow event={e} exact={exact} onOpenUser={onOpenUser} />
                            </li>
                        );
                    })}
                </ul>
            ) : <p className={styles.empty}>No new subscriptions or cancellations in this period.</p>}
            {events.length > 12 && (
                <button type="button" className={styles.linkButton} onClick={() => setAll((v) => !v)}>
                    {all ? 'Show fewer' : `Show all ${fmt(events.length)}`}
                </button>
            )}
        </section>
    );
}

function EventRow({ event: e, exact, onOpenUser }) {
    const text = EVENT_TEXT[e.type] || EVENT_TEXT.new;
    const person = e.name || e.email || 'Unknown customer';
    const plan = `${e.plan} ${e.interval}`;
    const time = new Date(e.at).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    const discounted = e.type === 'new' && e.paid !== null && e.paid !== undefined && e.paid < e.listPrice;

    let side;
    if (e.type === 'new') {
        side = (
            <>
                <strong>{e.paid === null || e.paid === undefined ? exact(e.listPrice, e.currency) : exact(e.paid, e.currency)}</strong>
                {discounted && <span><s>{exact(e.listPrice, e.currency)}</s> list</span>}
                <span>+{exact(e.monthly, e.currency)} MRR</span>
            </>
        );
    } else if (e.type === 'trial') {
        side = <><strong>Free</strong><span>{exact(e.listMonthly, e.currency)}/mo after</span></>;
    } else {
        side = <><strong>−{exact(e.monthly, e.currency)}</strong><span>MRR{e.type === 'cancelling' ? ' when it ends' : ''}</span></>;
    }

    const content = (
        <>
            <span className={`${styles.eventIcon} ${styles[`eventIcon_${e.type}`]}`} aria-hidden="true">{text.icon}</span>
            <span className={styles.eventMain}>
                <strong>{person}</strong>
                <span>
                    {text.label} · {plan}
                    {e.type === 'cancelling' && e.endsAt ? ` · ends ${fmtDate(e.endsAt)}` : ''}
                </span>
                {(e.coupon || (e.type === 'new' && e.status && e.status !== 'active')) && (
                    <span className={styles.chips}>
                        {e.coupon && <span className={`${styles.chip} ${styles.chipWarn}`}>{couponText(e.coupon, exact, e.currency)}</span>}
                        {e.type === 'new' && e.status !== 'active' && (
                            <span className={`${styles.chip} ${styles.chipBad}`}>Now {(STATUS_LABELS[e.status] || e.status).toLowerCase()}</span>
                        )}
                    </span>
                )}
            </span>
            <span className={styles.eventSide}>
                {side}
                <time dateTime={e.at}>{time}</time>
            </span>
        </>
    );
    return e.userId
        ? <button type="button" className={styles.event} onClick={() => onOpenUser(e.userId)}>{content}</button>
        : <div className={styles.event}>{content}</div>;
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
