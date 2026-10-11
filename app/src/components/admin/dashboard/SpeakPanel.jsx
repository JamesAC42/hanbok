'use client';
import { useEffect, useRef, useState } from 'react';
import styles from '@/styles/components/admin/dashboard.module.scss';
import useAdminData from './useAdminData';
import { ColumnChart, BarList, Delta, StatTile } from './charts';
import { PanelSkeleton, SectionError } from './OverviewPanel';
import { fmt, fmtDateTime, fmtDuration, fmtMoney, pct, timeAgo, TIERS } from './format';

// What GPT-Live sent during the call, as the browser saw it: runs of transcript
// pieces joined into one row. For working out odd calls.
const KINDS = { o: 'Character', i: 'Learner (heard)', Y: 'Learner line', 'L+': 'Line starts', 'L.': 'Line ends', 'L/': 'Line split', v: 'Learner voice', s: 'Session started', x: 'Event', error: 'Error', closed: 'Closed' };
function CallTimeline({ log }) {
    const [copied, setCopied] = useState(false);
    const rows = [];
    for (const [t, kind, text] of log) {
        const last = rows[rows.length - 1];
        if ((kind === 'o' || kind === 'i') && last?.kind === kind) { last.text += text; last.end = t; continue; }
        rows.push({ t, end: t, kind, text });
    }
    const copy = () => {
        navigator.clipboard?.writeText(JSON.stringify(log)).then(() => { setCopied(true); setTimeout(() => setCopied(false), 1500); }).catch(() => {});
    };
    return (
        <details className={styles.callTimeline}>
            <summary>Raw call timeline ({log.length} events)</summary>
            <button type="button" className={styles.miniBtn} onClick={copy}>{copied ? 'Copied' : 'Copy as JSON'}</button>
            <ol>
                {rows.map((r, i) => (
                    <li key={i} className={styles[`tl_${r.kind.replace(/\W/g, '_')}`] || ''}>
                        <span>{(r.t / 1000).toFixed(1)}s{r.end !== r.t ? `–${(r.end / 1000).toFixed(1)}s` : ''}</span>
                        <b>{KINDS[r.kind] || r.kind}</b>
                        {r.text && <span lang="ko">{r.text}</span>}
                    </li>
                ))}
            </ol>
        </details>
    );
}

const ISSUE_LABELS = {
    dropped: 'The call dropped',
    cant_hear: "Couldn't hear them",
    didnt_hear_me: "They didn't hear me",
    wrong_text: 'Words on screen were wrong',
    try_saying: '"Try saying" wrong or missing',
    ended_early: 'Ended too early',
    slow: 'Slow or laggy',
    other: 'Something else',
    'none picked': 'Nothing picked',
};

// Beta: what learners said after their calls, problem reports first.
function ReportsCard({ reports: r, onOpenCall }) {
    if (!r) return null;
    return (
        <section className={styles.card}>
            <header className={styles.cardHead}>
                <div>
                    <h2>Problem reports (beta)</h2>
                    <p>
                        &ldquo;How did the call go?&rdquo; after each call. {fmt(r.answered)} of {fmt(r.asked)} answered, {fmt(r.ok)} said it worked,{' '}
                        {fmt(r.problems)} reported a problem. {fmt(Math.round(r.refundedSeconds / 60))} minutes refunded.
                    </p>
                </div>
            </header>
            {r.list.length ? (
                <>
                    <BarList rows={r.issues.map((i) => ({ key: i.key, label: ISSUE_LABELS[i.key] || i.key, value: i.count, color: 'var(--bp-flame)' }))} />
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead><tr><th>When</th><th>Learner</th><th>Scene</th><th>What went wrong</th><th>In their words</th><th>Ended</th><th>Refunded</th></tr></thead>
                            <tbody>
                                {r.list.map((x) => (
                                    <tr key={x.sessionId} className={styles.clickRow} tabIndex={0}
                                        onClick={() => onOpenCall(x.sessionId)}
                                        onKeyDown={(ev) => { if (ev.key === 'Enter') onOpenCall(x.sessionId); }}>
                                        <td>{timeAgo(x.at)}</td>
                                        <td><strong>{x.name}</strong></td>
                                        <td>{x.title}<span className={styles.muted}>{x.engine}</span></td>
                                        <td>{x.issues.map((i) => ISSUE_LABELS[i] || i).join(', ') || '–'}</td>
                                        <td>{x.note || '–'}</td>
                                        <td>{END[x.endReason.replace(/^dropped.*/, 'dropped')] || x.endReason}</td>
                                        <td>{x.refunded ? `${fmtDuration(x.seconds)}` : 'no'}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : <p className={styles.empty}>No problem reports in this period.</p>}
        </section>
    );
}

const pctOf = (rate) => (rate === null || rate === undefined ? '–' : `${Math.round(rate * 100)}%`);

const LABELS = {
    // promo
    announcement_view: 'Saw the announcement popup',
    announcement_click: 'Clicked the announcement',
    announcement_dismiss: 'Closed the announcement',
    promo_view: 'Saw the Home promo card',
    promo_click: 'Clicked a Speak promo',
    // picker
    picker_view: 'Opened the Speak page',
    scene_click: 'Picked a scene',
    signup_click: 'Clicked sign up (signed out)',
    // call
    call_connected: 'Call connected',
    mic_denied: 'Blocked the microphone',
    connect_failed: 'Call failed to connect',
    assist_change: 'Changed the help level',
    help_tap: 'Tapped Help',
    script_open: 'Opened the script',
    english_toggle: 'Toggled English captions',
    slower_tap: 'Tapped Slower',
    hang_up: 'Hung up early',
    // after
    results_view: 'Saw the results screen',
    breakdown: 'Broke down a line',
    breakdown_locked: 'Tried a breakdown with none left',
    translations_toggle: 'Toggled transcript translations',
    line_translate: 'Translated one line',
    grammar_save: 'Saved grammar',
    phrase_save: 'Saved a phrase',
    play_again: 'Played the scene again',
    more_scenes: 'Went back for more scenes',
    history_list_view: 'Opened past conversations',
    history_view: 'Opened a past call',
};
const WHERE = {
    home_card: 'Home Speak card', home_promo: 'Home promo card', sidebar: 'Sidebar "New" tag', analysis: 'Analysis page link',
    analysis_limit: 'Analysis limit popup', result: 'Results screen', limit: 'Speak minutes wall', plan_card: 'Speak plan card',
    transcript_result: 'Transcript (after a call)', transcript_history: 'Transcript (past call)', picker: 'Speak page', start: 'Starting a call',
    grammar_save: 'Grammar library full', announcement: 'Announcement popup', updates: "What's new page", home: 'Home', hero: 'Speak page header',
    scene: 'Scene card (signed out)', other: 'Other',
};
const whereLabel = (k) => WHERE[k] || k;
const END = { complete: 'Finished the scene', user: 'Hung up', time: 'Ran out of time', left: 'Left the page', replaced: 'Started another call', dropped: 'Connection dropped', 'still open': 'Still open', unknown: 'Unknown' };

const eventRows = (rows, color) => rows.map((r) => ({ key: r.key, label: LABELS[r.key] || r.key, value: r.uses, note: `${fmt(r.people)} people`, color }));
const countRows = (rows, label = whereLabel, color) => rows.map((r) => ({ key: r.key, label: label(r.key), value: r.count, color }));

function SplitTable({ title, rows }) {
    if (!rows?.length) return null;
    return (
        <>
            <h3 className={styles.subHead}>{title}</h3>
            <table className={styles.miniTable}>
                <thead><tr><th /><th>Calls</th><th>People</th><th>Real</th><th>Cleared</th><th>Avg length</th></tr></thead>
                <tbody>
                    {rows.map((r) => (
                        <tr key={r.key}>
                            <td style={{ textTransform: 'capitalize' }}>{r.key}</td>
                            <td>{fmt(r.calls)}</td>
                            <td>{fmt(r.people)}</td>
                            <td>{pctOf(r.realRate)}</td>
                            <td>{pctOf(r.clearRate)}</td>
                            <td>{fmtDuration(r.avgSeconds)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
}

const CHART = [
    { key: 'calls', label: 'Calls', color: 'var(--bp-purple)' },
    { key: 'minutes', label: 'Minutes', color: 'var(--bp-und)' },
    { key: 'speakers', label: 'People talking', color: 'var(--bp-flame)' },
];

export default function SpeakPanel({ days, tz, refreshKey, onForbidden, onLoaded, onOpenUser }) {
    const speak = useAdminData(`/api/admin/stats/speak?days=${days}&tz=${encodeURIComponent(tz)}`, { onForbidden });
    const [metric, setMetric] = useState('calls');
    const [openCall, setOpenCall] = useState(null);

    useEffect(() => {
        if (refreshKey) speak.reload(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshKey]);

    useEffect(() => {
        if (speak.data) onLoaded?.(speak.data.cachedAt);
    }, [speak.data, onLoaded]);

    const d = speak.data;
    if (!d) return speak.error ? <SectionError error={speak.error} onRetry={speak.reload} /> : <PanelSkeleton />;

    const t = d.tiles;
    const top = d.funnel[0]?.people || 0;
    const chart = CHART.find((c) => c.key === metric);
    const silentShare = pct(d.health.silentCalls, t.calls.value);

    return (
        <div className={`${styles.panel} ${speak.loading ? styles.stale : ''}`}>
            <div className={styles.tiles}>
                <StatTile label="People talking" accent="var(--bp-purple)" value={fmt(t.speakers.value)}>
                    <Delta value={t.speakers.value} prev={t.speakers.prev} />
                </StatTile>
                <StatTile label="Calls" accent="var(--bp-purple)" value={fmt(t.calls.value)}>
                    <Delta value={t.calls.value} prev={t.calls.prev} />
                </StatTile>
                <StatTile label="Minutes talked" accent="var(--bp-und)" value={fmt(t.minutes.value)}>
                    <span>≈ {fmtMoney(Math.round(t.cost * 100))} in API costs</span>
                </StatTile>
                <StatTile label="Real conversations" accent="var(--bp-keep)" value={pctOf(t.realRate.value)}>
                    <span>of calls had 3+ lines from the learner · avg {fmtDuration(t.avgRealSeconds)}</span>
                </StatTile>
                <StatTile label="Scenes cleared" accent="var(--bp-flame)" value={pctOf(t.clearRate.value)}>
                    <span>of calls hit every goal · {fmt(t.returning)} came back another day</span>
                </StatTile>
            </div>

            <section className={styles.card}>
                <header className={styles.cardHead}>
                    <div>
                        <h2>Speak over time</h2>
                        <p>Per day, in your time zone.</p>
                    </div>
                    <div className={styles.segmented} role="tablist" aria-label="Chart metric">
                        {CHART.map((m) => (
                            <button key={m.key} type="button" role="tab" aria-selected={metric === m.key}
                                className={metric === m.key ? styles.segOn : ''} onClick={() => setMetric(m.key)}>
                                {m.label}
                            </button>
                        ))}
                    </div>
                </header>
                <ColumnChart points={d.daily.map((p) => ({ key: p.key, value: p[metric] }))} label={chart.label} color={chart.color} />
            </section>

            <ReportsCard reports={d.reports} onOpenCall={setOpenCall} />

            <div className={styles.twoCol}>
                <section className={styles.card}>
                    <header className={styles.cardHead}>
                        <div>
                            <h2>Does it work?</h2>
                            <p>Signed-in people at each step in this period.{d.anonVisitors ? ` ${fmt(d.anonVisitors)} signed-out visitors also opened the page.` : ''}</p>
                        </div>
                    </header>
                    <ul className={styles.funnel}>
                        {d.funnel.map((step) => (
                            <li key={step.key}>
                                <div className={styles.barListHead}>
                                    <span className={styles.barListLabel}>{step.label}</span>
                                    <span className={styles.barListValue}>{fmt(step.people)}<em>{pct(step.people, top)}</em></span>
                                </div>
                                <div className={styles.barTrack}>
                                    <i style={{ width: `${top ? Math.max(step.people ? 1.5 : 0, (step.people / top) * 100) : 0}%`, background: 'var(--bp-purple)' }} />
                                </div>
                            </li>
                        ))}
                    </ul>
                    <h3 className={styles.subHead}>How calls ended</h3>
                    <BarList rows={countRows(d.endReasons, (k) => END[k] || k, 'var(--bp-und)')} empty="No calls in this period" />
                </section>

                <section className={styles.card}>
                    <header className={styles.cardHead}>
                        <div>
                            <h2>Problems</h2>
                            <p>Calls that didn&apos;t turn into a conversation.</p>
                        </div>
                    </header>
                    <table className={styles.miniTable}>
                        <tbody>
                            <tr><td>Silent calls (learner never spoke)</td><td><strong>{fmt(d.health.silentCalls)}</strong> {silentShare !== '–' ? `(${silentShare})` : ''}</td></tr>
                            <tr><td>Character never spoke</td><td><strong>{fmt(d.health.neverHeard)}</strong></td></tr>
                            <tr><td>Connection dropped mid-call</td><td><strong>{fmt(d.health.dropped)}</strong></td></tr>
                            <tr><td>Fell back to the Realtime API</td><td><strong>{fmt(d.health.fellBack)}</strong></td></tr>
                            <tr><td>Call failed to connect</td><td><strong>{fmt(d.health.connectFailed)}</strong></td></tr>
                            <tr><td>Microphone blocked</td><td><strong>{fmt(d.health.micDenied)}</strong></td></tr>
                            {d.health.startFailed.map((r) => (
                                <tr key={r.key}><td>{r.key === 'limit' ? 'Tried to start with no minutes left' : r.key === 'pickup' ? 'Server could not open the call' : r.key}</td><td><strong>{fmt(r.count)}</strong></td></tr>
                            ))}
                        </tbody>
                    </table>
                    <h3 className={styles.subHead}>During calls</h3>
                    <BarList rows={eventRows(d.inCall, 'var(--bp-und)')} empty="No call controls used yet" />
                </section>
            </div>

            <div className={styles.twoCol}>
                <section className={styles.card}>
                    <header className={styles.cardHead}>
                        <div>
                            <h2>After the call</h2>
                            <p>What people did with the results, transcript and past conversations.</p>
                        </div>
                    </header>
                    <BarList rows={eventRows(d.after, 'var(--bp-keep)')} empty="Nothing yet" />
                    <h3 className={styles.subHead}>Made for them</h3>
                    <table className={styles.miniTable}>
                        <tbody>
                            <tr><td>Calls with notes made</td><td><strong>{fmt(d.afterCalls.recapsMade)}</strong></td></tr>
                            <tr><td>Transcripts translated</td><td><strong>{fmt(d.afterCalls.transcriptsTranslated)}</strong></td></tr>
                            <tr><td>Phrases taught in calls</td><td><strong>{fmt(d.afterCalls.phrasesTaught)}</strong></td></tr>
                            <tr><td>Pronunciation tips given</td><td><strong>{fmt(d.afterCalls.tipsGiven)}</strong></td></tr>
                            <tr><td>Calls that used their saved words</td><td><strong>{fmt(d.afterCalls.callsWithSavedWords)}</strong></td></tr>
                        </tbody>
                    </table>
                </section>

                <section className={styles.card}>
                    <header className={styles.cardHead}>
                        <div>
                            <h2>Finding Speak and paying for it</h2>
                            <p>Announcements, promos and upsells.</p>
                        </div>
                    </header>
                    <table className={styles.miniTable}>
                        <tbody>
                            <tr><td>Speakers on a paid plan now</td><td><strong>{fmt(d.money.paidSpeakers)}</strong> of {fmt(t.speakers.value)}</td></tr>
                            <tr><td>Started free, paying now</td><td><strong>{fmt(d.money.upgradedAfterSpeaking)}</strong></td></tr>
                            <tr><td>Ran out of minutes (people)</td><td><strong>{fmt(d.money.limitHitPeople)}</strong></td></tr>
                            <tr><td>Upgrade clicks from Speak</td><td><strong>{fmt(d.money.upsellClicks)}</strong></td></tr>
                        </tbody>
                    </table>
                    <h3 className={styles.subHead}>Announcement and promos</h3>
                    <BarList rows={eventRows(d.promo.events, 'var(--bp-purple)')} empty="No promo activity yet" />
                    <h3 className={styles.subHead}>Where people opened Speak from</h3>
                    <BarList rows={countRows(d.promo.pickerFrom, whereLabel, 'var(--bp-read)')} empty="No tagged visits yet" />
                    <h3 className={styles.subHead}>Upgrade clicks by place</h3>
                    <BarList rows={countRows(d.promo.upsellWhere, whereLabel, 'var(--bp-flame)')} empty="No upgrade clicks yet" />
                </section>
            </div>

            <section className={styles.card}>
                <header className={styles.cardHead}>
                    <div>
                        <h2>Scenes</h2>
                        <p>&quot;Real&quot; means the learner said 3 or more lines. &quot;Cleared&quot; means every goal was hit.{d.unplayed.length ? ` Not played yet: ${d.unplayed.join(', ')}.` : ''}</p>
                    </div>
                </header>
                {d.scenes.length ? (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead><tr><th>Scene</th><th>With</th><th>Calls</th><th>People</th><th>Real</th><th>Cleared</th><th>Learner lines</th><th>Avg length</th></tr></thead>
                            <tbody>
                                {d.scenes.map((r) => (
                                    <tr key={r.key}>
                                        <td><strong>{r.title}</strong></td>
                                        <td style={{ textTransform: 'capitalize' }}>{r.character}</td>
                                        <td className={styles.num}>{fmt(r.calls)}</td>
                                        <td className={styles.num}>{fmt(r.people)}</td>
                                        <td className={styles.num}>{pctOf(r.realRate)}</td>
                                        <td className={styles.num}>{pctOf(r.clearRate)}</td>
                                        <td className={styles.num}>{r.avgYouLines === null ? '–' : r.avgYouLines.toFixed(1)}</td>
                                        <td className={styles.num}>{fmtDuration(r.avgSeconds)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p className={styles.empty}>No calls in this period.</p>}
                <div className={styles.twoCol}>
                    <div>
                        <SplitTable title="By character" rows={d.splits.character} />
                        <SplitTable title="By level" rows={d.splits.level} />
                        <SplitTable title="By help style" rows={d.splits.assist} />
                    </div>
                    <div>
                        <SplitTable title="By plan" rows={d.splits.plan} />
                        <SplitTable title="By engine" rows={d.splits.engine} />
                    </div>
                </div>
            </section>

            <section className={styles.card}>
                <header className={styles.cardHead}>
                    <div>
                        <h2>Who talks the most</h2>
                        <p>By minutes in this period. Click a row for the learner.</p>
                    </div>
                </header>
                {d.topSpeakers.length ? (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead><tr><th>Learner</th><th>Plan</th><th>Calls</th><th>Minutes</th><th>Real</th><th>Cleared</th><th>Lines said</th><th>Days</th><th>Used after</th><th>Last call</th></tr></thead>
                            <tbody>
                                {d.topSpeakers.map((u) => (
                                    <tr key={u.userId} className={styles.clickRow} tabIndex={0}
                                        onClick={() => onOpenUser(u.userId)}
                                        onKeyDown={(ev) => { if (ev.key === 'Enter') onOpenUser(u.userId); }}>
                                        <td><strong>{u.name}</strong><span className={styles.muted}>{u.email}</span></td>
                                        <td><span className={`${styles.chip} ${u.tier ? styles.chipPaid : ''}`}>{TIERS[u.tier] || 'Free'}</span></td>
                                        <td className={styles.num}>{fmt(u.calls)}</td>
                                        <td className={styles.num}>{fmt(u.seconds / 60)}</td>
                                        <td className={styles.num}>{fmt(u.real)}</td>
                                        <td className={styles.num}>{fmt(u.cleared)}</td>
                                        <td className={styles.num}>{fmt(u.youLines)}</td>
                                        <td className={styles.num}>{fmt(u.days)}</td>
                                        <td className={styles.num}>{fmt(u.tools)}</td>
                                        <td>{timeAgo(u.lastCall)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p className={styles.empty}>Nobody has talked yet in this period.</p>}
            </section>

            <section className={styles.card}>
                <header className={styles.cardHead}>
                    <div>
                        <h2>Recent calls</h2>
                        <p>Click a call to read its transcript, notes and what happened around it.</p>
                    </div>
                </header>
                {d.recent.length ? (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead><tr><th>When</th><th>Learner</th><th>Scene</th><th>Setup</th><th>Length</th><th>Lines (them / char)</th><th>Goals</th><th>Ended</th><th>Used after</th></tr></thead>
                            <tbody>
                                {d.recent.map((c) => (
                                    <tr key={c.sessionId} className={styles.clickRow} tabIndex={0}
                                        onClick={() => setOpenCall(c.sessionId)}
                                        onKeyDown={(ev) => { if (ev.key === 'Enter') setOpenCall(c.sessionId); }}>
                                        <td>{timeAgo(c.startedAt)}</td>
                                        <td><strong>{c.name}</strong><span className={styles.muted}>{TIERS[c.tier] || 'Free'}</span></td>
                                        <td>{c.title}</td>
                                        <td><span className={styles.muted}>{c.level} · {c.assist}{c.fellBack ? ' · fallback' : ''}</span></td>
                                        <td className={styles.num}>{fmtDuration(c.seconds)}</td>
                                        <td className={styles.num}>{fmt(c.youLines)} / {fmt(c.charLines)}</td>
                                        <td className={styles.num}>{c.goalsDone}/{c.goalsTotal}</td>
                                        <td>{END[c.endReason.replace(/^dropped.*/, 'dropped')] || c.endReason}{c.feedback === 'problem' ? ' · 👎 reported' : c.feedback === 'ok' ? ' · 👍' : ''}</td>
                                        <td className={styles.num}>{fmt(c.tools)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p className={styles.empty}>No calls in this period.</p>}
            </section>

            {openCall && <CallDrawer sessionId={openCall} onClose={() => setOpenCall(null)} onForbidden={onForbidden} onOpenUser={onOpenUser} />}
        </div>
    );
}

function CallDrawer({ sessionId, onClose, onForbidden, onOpenUser }) {
    const { data, error } = useAdminData(`/api/admin/speak/calls/${sessionId}`, { onForbidden });
    const closeRef = useRef(null);

    useEffect(() => {
        closeRef.current?.focus();
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const c = data?.call;
    const u = data?.user;
    return (
        <div className={styles.drawerOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label="Speak call">
                <header className={styles.drawerHead}>
                    <div className={styles.drawerTitle}>
                        <h2>{c ? c.title : error ? 'Could not load' : 'Loading…'}</h2>
                        {c && <span>{fmtDateTime(c.startedAt)} · {fmtDuration(c.seconds)} · {c.character} · {c.level} · {c.assist} · {c.engine}{c.fellBack ? ' (fallback)' : ''}</span>}
                    </div>
                    <button ref={closeRef} type="button" className={styles.iconButton} onClick={onClose} aria-label="Close">×</button>
                </header>
                {error && <p className={styles.sectionError}>{error}</p>}
                {c && (
                    <div className={styles.drawerBody}>
                        <div className={styles.chips}>
                            {u && <button type="button" className={styles.chip} onClick={() => onOpenUser(u.userId)}>{u.name} · {TIERS[u.tier] || 'Free'}</button>}
                            <span className={styles.chip}>Ended: {END[(c.endReason || (c.open ? 'still open' : 'unknown')).replace(/^dropped.*/, 'dropped')] || c.endReason}</span>
                            <span className={styles.chip}>{c.youLines} learner lines</span>
                            <span className={styles.chip}>{c.goalsDoneCount}/{c.goalsTotal} goals</span>
                            {c.feedback && <span className={styles.chip}>{c.feedback.ok ? '👍 Said it worked' : `👎 Reported a problem${c.refundedSeconds ? ' · minutes refunded' : ''}`}</span>}
                        </div>
                        {c.feedback && !c.feedback.ok && (
                            <div className={styles.callReport}>
                                <b>What went wrong:</b> {(c.feedback.issues || []).map((i) => ISSUE_LABELS[i] || i).join(', ') || 'nothing picked'}
                                {c.feedback.note && <p>&ldquo;{c.feedback.note}&rdquo;</p>}
                            </div>
                        )}
                        <h3 className={styles.subHead}>Goals</h3>
                        <ul className={styles.callGoals}>
                            {c.goalList.map((g) => <li key={g.text}>{g.done ? '✓' : '○'} {g.text}</li>)}
                        </ul>
                        {c.summary && <p><em>&ldquo;{c.summary}&rdquo;</em></p>}
                        <h3 className={styles.subHead}>Transcript</h3>
                        {c.transcript.length ? (
                            <ol className={styles.callScript}>
                                {c.transcript.map((m, i) => (
                                    <li key={i} className={m.who === 'you' ? styles.callYou : ''}>
                                        <b>{m.who === 'you' ? 'Learner' : c.character}</b> <span lang="ko">{m.text}</span>
                                    </li>
                                ))}
                            </ol>
                        ) : <p className={styles.empty}>No transcript saved for this call.</p>}
                        {c.recap && (
                            <>
                                <h3 className={styles.subHead}>Notes they got</h3>
                                <ul className={styles.callGoals}>
                                    {(c.recap.well || []).map((x) => <li key={x}>👏 {x}</li>)}
                                    {(c.recap.improve || []).map((x) => <li key={x}>🎯 {x}</li>)}
                                    {(c.recap.grammar || []).map((g) => <li key={g.pattern}>📘 {g.pattern}: {g.name}</li>)}
                                </ul>
                            </>
                        )}
                        {(c.phrases.length > 0 || c.tips.length > 0) && (
                            <>
                                <h3 className={styles.subHead}>Taught during the call</h3>
                                <ul className={styles.callGoals}>
                                    {c.phrases.map((p) => <li key={p.word}>💬 {p.word}: {p.text}</li>)}
                                    {c.tips.map((p, i) => <li key={`${p.word}${i}`}>🗣️ {p.word}: {p.text}</li>)}
                                </ul>
                            </>
                        )}
                        <h3 className={styles.subHead}>What they did</h3>
                        {data.events.length ? (
                            <ul className={styles.callGoals}>
                                {data.events.map((e, i) => (
                                    <li key={i}>{new Date(e.at).toLocaleTimeString()} · {LABELS[e.type] || e.type}{e.meta?.where ? ` (${whereLabel(e.meta.where)})` : ''}</li>
                                ))}
                            </ul>
                        ) : <p className={styles.empty}>No tracked actions for this call.</p>}
                        {c.eventLog?.length > 0 && <CallTimeline log={c.eventLog} />}
                    </div>
                )}
            </aside>
        </div>
    );
}
