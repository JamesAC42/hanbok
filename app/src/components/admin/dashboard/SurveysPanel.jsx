'use client';
import { useEffect } from 'react';
import styles from '@/styles/components/admin/dashboard.module.scss';
import useAdminData from './useAdminData';
import { BarList, StatTile } from './charts';
import { PanelSkeleton, SectionError } from './OverviewPanel';
import { fmt, pct, timeAgo } from './format';

// Answers to the one-time "If Hanbok were an app on your phone, would you use
// it?" corner card (server/controllers/appSurvey.js). All time, since each
// person only sees it once.
const ANSWER = {
    yes: { label: 'Yes', color: 'var(--bp-und)' },
    maybe: { label: 'Maybe', color: 'var(--bp-keep)' },
    no: { label: 'No', color: 'var(--bp-rev)' },
};
const GROUP = { anon: 'Signed out', free: 'Free', trial: 'On the free Plus trial', basic: 'Basic (paying)', plus: 'Plus (paying)' };
const PHONE = { iphone: 'iPhone', android: 'Android', skipped: 'Skipped' };
const PHONE_COLOR = { iphone: 'var(--bp-read)', android: 'var(--bp-und)', skipped: 'var(--bp-gray)' };

const phoneRows = (counts) => Object.keys(PHONE).map((k) => ({ key: k, label: PHONE[k], value: counts[k], color: PHONE_COLOR[k] }));

export default function SurveysPanel({ refreshKey, onForbidden, onLoaded, onOpenUser }) {
    const survey = useAdminData('/api/admin/stats/app-survey', { onForbidden });

    useEffect(() => {
        if (refreshKey) survey.reload(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshKey]);

    useEffect(() => {
        if (survey.data) onLoaded?.(survey.data.cachedAt);
    }, [survey.data, onLoaded]);

    const d = survey.data;
    if (!d) return survey.error ? <SectionError error={survey.error} onRetry={survey.reload} /> : <PanelSkeleton />;

    const t = d.totals;
    const interested = t.yes + t.maybe;
    const iphones = d.platforms.all.iphone;

    return (
        <div className={`${styles.panel} ${survey.loading ? styles.stale : ''}`}>
            <div className={styles.tiles}>
                <StatTile label="Saw the question" accent="var(--bp-gray)" value={fmt(t.seen)}>
                    <span>{fmt(t.answered)} answered ({pct(t.answered, t.seen)}) · {fmt(t.dismissed)} closed it</span>
                </StatTile>
                <StatTile label="Would use an app" accent="var(--bp-und)" value={pct(t.yes, t.answered)}>
                    <span>{fmt(t.yes)} yes · {fmt(t.maybe)} maybe · {fmt(t.no)} no</span>
                </StatTile>
                <StatTile label="Interested on iPhone" accent="var(--bp-read)" value={fmt(iphones)}>
                    <span>of {fmt(interested)} yes or maybe · {fmt(d.platforms.all.android)} on Android</span>
                </StatTile>
                <StatTile label="Paying and interested on iPhone" accent="var(--bp-purple)" value={fmt(d.platforms.paying.iphone)}>
                    <span>{fmt(d.platforms.paying.android)} on Android</span>
                </StatTile>
            </div>

            <div className={styles.twoCol}>
                <section className={styles.card}>
                    <header className={styles.cardHead}>
                        <div>
                            <h2>If Hanbok were an app, would you use it?</h2>
                            <p>A corner card, shown once per person on a return visit, sharing the popup budget.</p>
                        </div>
                    </header>
                    <BarList rows={Object.keys(ANSWER).map((k) => ({ key: k, label: ANSWER[k].label, value: t[k], note: pct(t[k], t.answered), color: ANSWER[k].color }))} empty="No answers yet" />
                    <h3 className={styles.subHead}>By who&apos;s answering</h3>
                    <table className={styles.miniTable}>
                        <thead><tr><th /><th>Answered</th><th>Yes</th><th>Maybe</th><th>No</th></tr></thead>
                        <tbody>
                            {d.byGroup.map((g) => (
                                <tr key={g.group}>
                                    <td>{GROUP[g.group] || g.group}</td>
                                    <td>{fmt(g.answered)}</td>
                                    <td>{fmt(g.yes)}</td>
                                    <td>{fmt(g.maybe)}</td>
                                    <td>{fmt(g.no)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </section>

                <section className={styles.card}>
                    <header className={styles.cardHead}>
                        <div>
                            <h2>Which phone?</h2>
                            <p>Asked after a Yes or Maybe.</p>
                        </div>
                    </header>
                    <BarList rows={phoneRows(d.platforms.all)} empty="No answers yet" />
                    <h3 className={styles.subHead}>Only those who said Yes</h3>
                    <BarList rows={phoneRows(d.platforms.yes)} empty="No answers yet" />
                    <h3 className={styles.subHead}>Only paying learners</h3>
                    <BarList rows={phoneRows(d.platforms.paying)} empty="No answers yet" />
                </section>
            </div>

            <section className={styles.card}>
                <header className={styles.cardHead}>
                    <div>
                        <h2>Latest answers</h2>
                        <p>Click a signed-in learner to open them.</p>
                    </div>
                </header>
                {d.recent.length ? (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead><tr><th>When</th><th>Who</th><th>Answer</th><th>Phone</th></tr></thead>
                            <tbody>
                                {d.recent.map((r, i) => (
                                    <tr key={i} style={r.userId !== null ? { cursor: 'pointer' } : undefined}
                                        onClick={r.userId !== null ? () => onOpenUser?.(r.userId) : undefined}>
                                        <td>{timeAgo(r.at)}</td>
                                        <td>{r.userId !== null ? `${GROUP[r.group] || r.group} · #${r.userId}` : GROUP.anon}</td>
                                        <td>{ANSWER[r.answer]?.label || r.answer}</td>
                                        <td>{r.platform ? PHONE[r.platform] : '–'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p className={styles.empty}>No answers yet.</p>}
            </section>
        </div>
    );
}
