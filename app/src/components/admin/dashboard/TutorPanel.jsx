'use client';
import { useEffect, useRef, useState } from 'react';
import styles from '@/styles/components/admin/dashboard.module.scss';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import useAdminData from './useAdminData';
import { ColumnChart, BarList, Delta, StatTile } from './charts';
import { PanelSkeleton, SectionError } from './OverviewPanel';
import { fmt, fmtDateTime, languageLabel, pct, timeAgo, TIERS } from './format';

const FACES = { 1: ['😖', 'Not for me'], 2: ['😕', 'Meh'], 3: ['😐', 'Okay'], 4: ['🙂', 'Good'], 5: ['😍', 'Loved it'] };
const SCORE_COLORS = { 5: 'var(--bp-und)', 4: 'var(--bp-und-line)', 3: 'var(--bp-keep)', 2: 'var(--bp-flame)', 1: 'var(--bp-rev)' };
const REASONS = {
    wrong: 'Something was wrong',
    confusing: 'Confusing',
    not_answered: "Didn't answer the question",
    too_long: 'Too long',
    too_short: 'Not enough detail',
    language: 'Wrong language',
    other: 'Something else',
    'none picked': 'No reason picked',
};
const LIMITS = {
    monthly: 'Out of conversations this month',
    messages: 'Hit the questions-per-conversation cap',
    per_sentence: 'Hit the per-sentence cap',
    free_blank: 'Free plan tried a chat without a sentence',
};
const LABELS = {
    page_view: 'Opened the Tutor',
    new_chat: 'Clicked New chat',
    conversation_open: 'Opened a past conversation',
    conversation_delete: 'Deleted a conversation',
    language_change: 'Changed the language',
    view_analysis: 'Went to the sentence analysis',
    chat_start: 'Started a conversation',
    reply_failed: "Horang's reply failed",
    limit_hit: 'Hit a limit',
    message_up: '👍 on an answer',
    message_down: '👎 on an answer',
    survey_view: 'Saw "How is Horang helping?"',
    survey_rating: 'Rated the Tutor',
    survey_dismiss: 'Said "Not now" to the rating',
};
const FROM = { sentence: 'From a sentence', direct: 'Directly (sidebar, link)', conversation: 'A conversation link', open: 'Open question', other: 'Other' };
const SOURCE = { sentence: 'About a sentence', open: 'Open question' };

const pctOf = (rate) => (rate === null || rate === undefined ? '–' : `${Math.round(rate * 100)}%`);
const avgText = (n) => (n === null || n === undefined ? '–' : n.toFixed(1));
const secs = (n) => (n === null || n === undefined ? '–' : `${n.toFixed(1)}s`);
// Horang answers in markdown with <example> tags; strip both for one-line previews.
const plain = (text) => (text || '').replace(/<\/?[a-z]+>/gi, ' ').replace(/[#*_`>|]+|-{3,}/g, ' ').replace(/\s+/g, ' ').trim();
const clip = (text, n = 140) => (text && text.length > n ? `${text.slice(0, n - 1)}…` : text || '');
const eventRows = (rows, color) => rows.map((r) => ({ key: r.key, label: LABELS[r.key] || r.key, value: r.uses, note: `${fmt(r.people)} people`, color }));
const countRows = (rows, labels, color) => rows.map((r) => ({ key: r.key, label: labels[r.key] || r.key, value: r.count, color }));

const CHART = [
    { key: 'questions', label: 'Questions', color: 'var(--bp-flame)' },
    { key: 'conversations', label: 'Conversations', color: 'var(--bp-und)' },
    { key: 'chatters', label: 'People chatting', color: 'var(--bp-purple)' },
];

function ClickRow({ onOpen, children }) {
    return (
        <tr className={styles.clickRow} tabIndex={0} onClick={onOpen} onKeyDown={(ev) => { if (ev.key === 'Enter') onOpen(); }}>
            {children}
        </tr>
    );
}

// "How is Horang helping?" (1-5), asked on some conversations.
function RatingsCard({ ratings: r, onOpen }) {
    const groups = [
        ...r.source.map((g) => ({ ...g, key: `s:${g.key}`, label: SOURCE[g.key] || g.key })),
        ...r.plan.map((g) => ({ ...g, key: `p:${g.key}`, label: `${g.key} plan` })),
    ];
    return (
        <section className={styles.card}>
            <header className={styles.cardHead}>
                <div>
                    <h2>How people feel about the Tutor</h2>
                    <p>
                        &ldquo;How is Horang helping you so far?&rdquo; comes up after Horang&apos;s second answer, on a learner&apos;s first conversation and then every few.{' '}
                        {fmt(r.rated)} of {fmt(r.asked)} asked gave a rating, {fmt(r.dismissed)} said &ldquo;Not now&rdquo;.
                    </p>
                </div>
                <div className={styles.ratingBig}>
                    <strong>{avgText(r.average)}</strong><span>/ 5 average</span>
                    {r.average !== null && r.prevAverage !== null && <span>{avgText(r.prevAverage)} the period before</span>}
                </div>
            </header>
            {r.rated ? (
                <>
                    <div className={styles.twoCol}>
                        <BarList rows={r.scores.map((x) => ({ key: String(x.score), label: `${FACES[x.score][0]} ${FACES[x.score][1]}`, value: x.count, color: SCORE_COLORS[x.score] }))} />
                        <div className={`${styles.tableWrap} ${styles.tableNarrow}`}>
                            <table className={styles.table}>
                                <thead><tr><th>Kind or plan</th><th>Ratings</th><th>Avg</th></tr></thead>
                                <tbody>
                                    {groups.map((g) => <tr key={g.key}><td>{g.label}</td><td>{fmt(g.ratings)}</td><td>{avgText(g.average)}</td></tr>)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    <h3 className={styles.subHead}>Latest ratings</h3>
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead><tr><th>When</th><th>Learner</th><th>First question</th><th>Rating</th><th>In their words</th><th>Questions</th></tr></thead>
                            <tbody>
                                {r.list.map((x) => (
                                    <ClickRow key={x.conversationId} onOpen={() => onOpen(x.conversationId)}>
                                        <td>{timeAgo(x.at)}</td>
                                        <td><strong>{x.name}</strong></td>
                                        <td>{clip(x.question, 80)}</td>
                                        <td className={styles.nowrap}>{FACES[x.rating][0]} {FACES[x.rating][1]}</td>
                                        <td>{x.comment || '–'}</td>
                                        <td className={styles.num}>{fmt(x.questions)}</td>
                                    </ClickRow>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : <p className={styles.empty}>No ratings in this period yet.</p>}
        </section>
    );
}

// 👎 on Horang's answers, with the question that got them.
function VotesCard({ votes: v, upRate, onOpen }) {
    return (
        <section className={styles.card}>
            <header className={styles.cardHead}>
                <div>
                    <h2>Answers people flagged</h2>
                    <p>
                        👍/👎 under each of Horang&apos;s answers. {fmt(v.up)} 👍 and {fmt(v.down)} 👎 on answers sent in this period
                        {upRate !== null ? ` (${pctOf(upRate)} thumbs up)` : ''}.
                    </p>
                </div>
            </header>
            {v.list.length ? (
                <>
                    <BarList rows={v.reasons.map((x) => ({ key: x.key, label: REASONS[x.key] || x.key, value: x.count, color: 'var(--bp-flame)' }))} />
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead><tr><th>When</th><th>Learner</th><th>They asked</th><th>Horang said</th><th>Why 👎</th></tr></thead>
                            <tbody>
                                {v.list.map((x) => (
                                    <ClickRow key={x.messageId} onOpen={() => onOpen(x.conversationId)}>
                                        <td>{timeAgo(x.at)}</td>
                                        <td><strong>{x.name}</strong></td>
                                        <td>{clip(x.question, 120) || '–'}</td>
                                        <td>{clip(plain(x.answer), 160)}</td>
                                        <td>{x.reasons.map((r) => REASONS[r] || r).join(', ') || '–'}{x.note ? <span className={styles.muted}>&ldquo;{x.note}&rdquo;</span> : null}</td>
                                    </ClickRow>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ) : <p className={styles.empty}>No 👎 in this period.</p>}
        </section>
    );
}

function SplitTable({ title, rows, label = (k) => k }) {
    if (!rows?.length) return null;
    return (
        <>
            <h3 className={styles.subHead}>{title}</h3>
            <table className={styles.miniTable}>
                <thead><tr><th /><th>Chats</th><th>People</th><th>Follow-up</th><th>Avg questions</th><th>👍</th><th>Rating</th></tr></thead>
                <tbody>
                    {rows.map((r) => (
                        <tr key={r.key}>
                            <td>{label(r.key)}</td>
                            <td>{fmt(r.conversations)}</td>
                            <td>{fmt(r.people)}</td>
                            <td>{pctOf(r.followUpRate)}</td>
                            <td>{avgText(r.avgQuestions)}</td>
                            <td>{pctOf(r.upRate)}</td>
                            <td>{avgText(r.rating)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </>
    );
}

export default function TutorPanel({ days, tz, refreshKey, onForbidden, onLoaded, onOpenUser }) {
    const tutor = useAdminData(`/api/admin/stats/tutor?days=${days}&tz=${encodeURIComponent(tz)}`, { onForbidden });
    const [metric, setMetric] = useState('questions');
    const [open, setOpen] = useState(null);

    useEffect(() => {
        if (refreshKey) tutor.reload(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [refreshKey]);

    useEffect(() => {
        if (tutor.data) onLoaded?.(tutor.data.cachedAt);
    }, [tutor.data, onLoaded]);

    const d = tutor.data;
    if (!d) return tutor.error ? <SectionError error={tutor.error} onRetry={tutor.reload} /> : <PanelSkeleton />;

    const t = d.tiles;
    const top = d.funnel[0]?.people || 0;
    const chart = CHART.find((c) => c.key === metric);
    const depthTop = Math.max(1, ...d.depth.map((x) => x.count));

    return (
        <div className={`${styles.panel} ${tutor.loading ? styles.stale : ''}`}>
            <div className={styles.tiles}>
                <StatTile label="People chatting" accent="var(--bp-purple)" value={fmt(t.chatters.value)}>
                    <Delta value={t.chatters.value} prev={t.chatters.prev} />
                </StatTile>
                <StatTile label="Questions asked" accent="var(--bp-flame)" value={fmt(t.questions.value)}>
                    <Delta value={t.questions.value} prev={t.questions.prev} />
                </StatTile>
                <StatTile label="Conversations" accent="var(--bp-und)" value={fmt(t.conversations.value)}>
                    <span>avg {avgText(t.avgQuestions)} questions each · {fmt(t.returning)} came back another day</span>
                </StatTile>
                <StatTile label="Asked a follow-up" accent="var(--bp-keep)" value={pctOf(t.followUpRate.value)}>
                    <span>of new conversations{t.followUpRate.prev !== null ? ` · ${pctOf(t.followUpRate.prev)} the period before` : ''}</span>
                </StatTile>
                <StatTile label="Answers 👍" accent="var(--bp-und)" value={pctOf(t.upRate.value)}>
                    <span>of {fmt(t.upRate.votes)} votes · rating {avgText(t.rating.value)}/5 from {fmt(t.rating.count)}</span>
                </StatTile>
            </div>

            <section className={styles.card}>
                <header className={styles.cardHead}>
                    <div>
                        <h2>Tutor over time</h2>
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

            <RatingsCard ratings={d.ratings} onOpen={setOpen} />

            <VotesCard votes={d.votes} upRate={t.upRate.value} onOpen={setOpen} />

            <div className={styles.twoCol}>
                <section className={styles.card}>
                    <header className={styles.cardHead}>
                        <div>
                            <h2>Does it work?</h2>
                            <p>Signed-in people at each step in this period.</p>
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
                    <h3 className={styles.subHead}>Questions per new conversation</h3>
                    <BarList rows={d.depth.map((x) => ({ key: x.key, label: `${x.key} ${x.key === '1' ? 'question' : 'questions'}`, value: x.count, color: 'var(--bp-und)' }))} max={depthTop} empty="No conversations in this period" />
                </section>

                <section className={styles.card}>
                    <header className={styles.cardHead}>
                        <div>
                            <h2>Problems and limits</h2>
                            <p>Replies that failed or were slow, and the caps people ran into.</p>
                        </div>
                    </header>
                    <table className={styles.miniTable}>
                        <tbody>
                            <tr><td>Replies that failed</td><td><strong>{fmt(d.health.failures)}</strong></td></tr>
                            <tr><td>New conversations with no answer</td><td><strong>{fmt(d.health.noReply)}</strong></td></tr>
                            <tr><td>Time to a full answer (median / slowest 10%)</td><td><strong>{secs(d.health.replySeconds.median)}</strong> / {secs(d.health.replySeconds.p90)}</td></tr>
                            <tr><td>Time to the first words (median)</td><td><strong>{secs(d.health.firstWordsSeconds)}</strong></td></tr>
                            <tr><td>Conversations that used every question allowed</td><td><strong>{fmt(d.capped)}</strong></td></tr>
                            <tr><td>Deleted by the learner</td><td><strong>{fmt(d.health.deleted)}</strong></td></tr>
                        </tbody>
                    </table>
                    {d.health.failureReasons.length > 0 && (
                        <>
                            <h3 className={styles.subHead}>Why replies failed</h3>
                            <BarList rows={countRows(d.health.failureReasons, {}, 'var(--bp-rev)')} />
                        </>
                    )}
                    <h3 className={styles.subHead}>Limits hit ({fmt(d.limits.people)} people)</h3>
                    <BarList rows={countRows(d.limits.where, LIMITS, 'var(--bp-flame)')} empty="Nobody hit a limit" />
                    <table className={styles.miniTable}>
                        <tbody>
                            <tr><td>Chatters on a paid plan now</td><td><strong>{fmt(d.money.paidChatters)}</strong> of {fmt(t.chatters.value)}</td></tr>
                            <tr><td>Started free, paying now</td><td><strong>{fmt(d.money.upgradedAfterChatting)}</strong></td></tr>
                        </tbody>
                    </table>
                </section>
            </div>

            <section className={styles.card}>
                <header className={styles.cardHead}>
                    <div>
                        <h2>What they chat about</h2>
                        <p>&ldquo;Follow-up&rdquo; means the learner asked at least twice.</p>
                    </div>
                </header>
                <div className={styles.tableWrap}>
                    <SplitTable title="Kind of question" rows={d.splits.source} label={(k) => SOURCE[k] || k} />
                    <SplitTable title="Language" rows={d.splits.language} label={languageLabel} />
                    <SplitTable title="Plan" rows={d.splits.plan} />
                </div>
            </section>
            <section className={styles.card}>
                <header className={styles.cardHead}>
                    <div>
                        <h2>On the Tutor page</h2>
                        <p>Buttons and pages, from the event log.</p>
                    </div>
                </header>
                <BarList rows={eventRows(d.page, 'var(--bp-purple)')} empty="Nothing tracked yet" />
                <h3 className={styles.subHead}>How people arrived</h3>
                <BarList rows={countRows(d.pageFrom, FROM, 'var(--bp-read)')} empty="No visits tracked yet" />
            </section>

            <section className={styles.card}>
                <header className={styles.cardHead}>
                    <div>
                        <h2>Who chats the most</h2>
                        <p>By questions in this period. Click a row for the learner.</p>
                    </div>
                </header>
                {d.topLearners.length ? (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead><tr><th>Learner</th><th>Plan</th><th>Chats</th><th>Questions</th><th>Days</th><th>👍 / 👎</th><th>Used every question</th><th>Last</th></tr></thead>
                            <tbody>
                                {d.topLearners.map((u) => (
                                    <ClickRow key={u.userId} onOpen={() => onOpenUser(u.userId)}>
                                        <td><strong>{u.name}</strong><span className={styles.muted}>{u.email}</span></td>
                                        <td><span className={`${styles.chip} ${u.tier ? styles.chipPaid : ''}`}>{TIERS[u.tier] || 'Free'}</span></td>
                                        <td className={styles.num}>{fmt(u.conversations)}</td>
                                        <td className={styles.num}>{fmt(u.questions)}</td>
                                        <td className={styles.num}>{fmt(u.days)}</td>
                                        <td className={styles.num}>{fmt(u.up)} / {fmt(u.down)}</td>
                                        <td className={styles.num}>{fmt(u.capped)}</td>
                                        <td>{timeAgo(u.last)}</td>
                                    </ClickRow>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p className={styles.empty}>Nobody has chatted yet in this period.</p>}
            </section>

            <section className={styles.card}>
                <header className={styles.cardHead}>
                    <div>
                        <h2>Recent conversations</h2>
                        <p>What people asked first. Click a conversation to read it with every 👍 and 👎.</p>
                    </div>
                </header>
                {d.recent.length ? (
                    <div className={styles.tableWrap}>
                        <table className={styles.table}>
                            <thead><tr><th>Last message</th><th>Learner</th><th>First question</th><th>Kind</th><th>Questions</th><th>👍 / 👎</th><th>Rating</th></tr></thead>
                            <tbody>
                                {d.recent.map((c) => (
                                    <ClickRow key={c.conversationId} onOpen={() => setOpen(c.conversationId)}>
                                        <td>{timeAgo(c.lastUpdated)}</td>
                                        <td><strong>{c.name}</strong><span className={styles.muted}>{TIERS[c.tier] || 'Free'}</span></td>
                                        <td>{clip(c.question, 120)}{c.deleted ? <span className={styles.muted}>deleted by the learner</span> : null}</td>
                                        <td><span className={styles.muted}>{SOURCE[c.source]}{c.language ? ` · ${languageLabel(c.language)}` : ''}</span></td>
                                        <td className={styles.num}>{fmt(c.questions)}{c.capped ? ' (max)' : ''}</td>
                                        <td className={styles.num}>{fmt(c.up)} / {fmt(c.down)}</td>
                                        <td>{c.rating ? `${FACES[c.rating][0]} ${c.rating}/5` : '–'}</td>
                                    </ClickRow>
                                ))}
                            </tbody>
                        </table>
                    </div>
                ) : <p className={styles.empty}>No conversations in this period.</p>}
            </section>

            {open && <ConversationDrawer conversationId={open} onClose={() => setOpen(null)} onForbidden={onForbidden} onOpenUser={onOpenUser} />}
        </div>
    );
}

function ConversationDrawer({ conversationId, onClose, onForbidden, onOpenUser }) {
    const { data, error } = useAdminData(`/api/admin/tutor/conversations/${conversationId}`, { onForbidden });
    const closeRef = useRef(null);

    useEffect(() => {
        closeRef.current?.focus();
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const c = data?.conversation;
    const u = data?.user;
    const f = c?.feedback;
    return (
        <div className={styles.drawerOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <aside className={styles.drawer} role="dialog" aria-modal="true" aria-label="Tutor conversation">
                <header className={styles.drawerHead}>
                    <div className={styles.drawerTitle}>
                        <h2>{c ? c.title : error ? 'Could not load' : 'Loading…'}</h2>
                        {c && <span>{fmtDateTime(c.dateCreated)} · {c.userMessageCount || 0} questions{c.targetLanguage ? ` · ${languageLabel(c.targetLanguage)}` : ''}{c.isDeleted ? ' · deleted by the learner' : ''}</span>}
                    </div>
                    <button ref={closeRef} type="button" className={styles.iconButton} onClick={onClose} aria-label="Close">×</button>
                </header>
                {error && <p className={styles.sectionError}>{error}</p>}
                {c && (
                    <div className={styles.drawerBody}>
                        <div className={styles.chips}>
                            {u && <button type="button" className={styles.chip} onClick={() => onOpenUser(u.userId)}>{u.name} · {TIERS[u.tier] || 'Free'}</button>}
                            <span className={styles.chip}>{c.sentenceId ? 'About a sentence' : 'Open question'}</span>
                            {c.capped && <span className={styles.chip}>Used every question allowed</span>}
                            {f?.rating && <span className={styles.chip}>Rated {FACES[f.rating][0]} {FACES[f.rating][1]} ({f.rating}/5)</span>}
                            {!f?.rating && f?.dismissedAt && <span className={styles.chip}>Said &ldquo;Not now&rdquo; to the rating</span>}
                        </div>
                        {f?.comment && (
                            <div className={`${styles.callReport} ${styles.callComment}`}>
                                <b>About the Tutor:</b>
                                <p>&ldquo;{f.comment}&rdquo;</p>
                            </div>
                        )}
                        {c.sentence && (
                            <p><em lang="ko">&ldquo;{c.sentence.text}&rdquo;</em>{c.sentence.analysis?.translation ? <span className={styles.muted}>{c.sentence.analysis.translation}</span> : null}</p>
                        )}
                        <h3 className={styles.subHead}>Conversation</h3>
                        {data.messages.length ? (
                            <ol className={`${styles.callScript} ${styles.tutorScript}`}>
                                {data.messages.map((m) => (
                                    <li key={m.messageId} className={m.role === 'user' ? styles.callYou : ''}>
                                        <b>{m.role === 'user' ? 'Learner' : 'Horang'}</b>
                                        {m.role === 'user'
                                            ? <span className={styles.tutorText}>{m.content}</span>
                                            : <div className={styles.tutorReply}><MarkdownRenderer content={m.content} /></div>}
                                        {m.role === 'assistant' && (m.feedback || m.replyMs) && (
                                            <span className={styles.muted}>
                                                {m.feedback?.vote === 'up' ? '👍 ' : ''}
                                                {m.feedback?.vote === 'down' ? `👎 ${(m.feedback.reasons || []).map((r) => REASONS[r] || r).join(', ')}${m.feedback.note ? ` · "${m.feedback.note}"` : ''} ` : ''}
                                                {m.replyMs ? `· ${(m.replyMs / 1000).toFixed(1)}s` : ''}
                                            </span>
                                        )}
                                    </li>
                                ))}
                            </ol>
                        ) : <p className={styles.empty}>No messages saved.</p>}
                        <h3 className={styles.subHead}>What they did</h3>
                        {data.events.length ? (
                            <ul className={styles.callGoals}>
                                {data.events.map((e, i) => (
                                    <li key={i}>{new Date(e.at).toLocaleTimeString()} · {LABELS[e.type] || e.type}{e.meta?.reason ? ` (${LIMITS[e.meta.reason] || e.meta.reason})` : ''}</li>
                                ))}
                            </ul>
                        ) : <p className={styles.empty}>No tracked actions for this conversation.</p>}
                    </div>
                )}
            </aside>
        </div>
    );
}
