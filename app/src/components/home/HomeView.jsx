'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import useCardsToday from '@/hooks/useCardsToday';
import useProgress from '@/hooks/useProgress';
import Mascot from '@/components/Mascot';
import Tiger from '@/components/Tiger';
import QuotaDisplay from '@/components/QuotaDisplay';
import { WeekStrip, ActivityHeatmap, TrendChart } from '@/components/home/ActivityCharts';
import { Fa6SolidParagraph } from '@/components/icons/Paragraph';
import { stagesToday } from '@/lib/todayLoop';
import styles from '@/styles/home/dashboardhome.module.scss';

const SECONDS_PER_CARD = 8;

const greetingFor = (date) => {
    const hour = date.getHours();
    if (hour < 5) return 'Up late';
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
};

const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;

const useRecentWork = (enabled) => {
    const [items, setItems] = useState(null);
    useEffect(() => {
        if (!enabled) return;
        let cancelled = false;
        fetch('/api/user/history?page=1&limit=4')
            .then(res => (res.ok ? res.json() : null))
            .then(data => {
                if (!cancelled) setItems(data?.success ? data.items : []);
            })
            .catch(() => { if (!cancelled) setItems([]); });
        return () => { cancelled = true; };
    }, [enabled]);
    return items;
};

const QuickInput = ({ inputRef }) => {
    const router = useRouter();
    const { t, language, supportedLanguages } = useLanguage();
    const [text, setText] = useState('');
    const languageName = t(`languages.${supportedLanguages[language]}`);

    const submit = (e) => {
        e.preventDefault();
        const value = text.trim();
        if (!value) return;
        // The analyze page picks this up and fills its input.
        localStorage.setItem('pendingAnalysis', value);
        router.push('/analyze');
    };

    return (
        <form className={`${styles.card} ${styles.quickInput}`} onSubmit={submit}>
            <label htmlFor="home-quick-input" className={styles.cardTitle}>Read something new</label>
            <textarea
                id="home-quick-input"
                ref={inputRef}
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) submit(e);
                }}
                rows={2}
                placeholder={`Paste a ${languageName} sentence you want to understand…`}
            />
            <div className={styles.quickInputBar}>
                <div className={styles.quickInputLinks}>
                    <Link href="/extended-text"><Fa6SolidParagraph /> A whole paragraph</Link>
                    <Link href="/analyze">From a photo</Link>
                </div>
                <button type="submit" className={`${styles.pressButton} ${styles.press_read}`} disabled={!text.trim()}>Analyze</button>
            </div>
        </form>
    );
};

const ICONS = {
    read: <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M3 5.5C3 4.7 3.7 4 4.5 4H10a2 2 0 0 1 2 2v13a2.5 2.5 0 0 0-2.5-2H4.5A1.5 1.5 0 0 1 3 15.5zM21 5.5c0-.8-.7-1.5-1.5-1.5H14a2 2 0 0 0-2 2v13a2.5 2.5 0 0 1 2.5-2h5a1.5 1.5 0 0 0 1.5-1.5z"/></svg>,
    understand: <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6" fill="none" stroke="currentColor" strokeWidth="3"/><path d="M15 15l5 5" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round"/></svg>,
    keep: <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M6 3h12a1 1 0 0 1 1 1v17l-7-4.5L5 21V4a1 1 0 0 1 1-1z"/><path d="M12 7v6M9 10h6" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" opacity=".9"/></svg>,
    review: <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="6" width="13" height="15" rx="2.5" fill="currentColor" opacity=".55"/><rect x="8" y="3" width="13" height="15" rx="2.5" fill="currentColor"/></svg>,
    check: <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" strokeWidth="3.4" strokeLinecap="round" strokeLinejoin="round"/></svg>,
    flame: <svg viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M12.6 2.2c.4 3.1-1.3 4.6-2.8 6.1C8.4 9.7 7 11.2 7 13.9a5 5 0 0 0 10 0c0-1.7-.6-3-1.4-4.1-.2 1.2-.8 2-1.7 2.4.5-3.6-.6-7.4-1.3-10z"/></svg>,
};

const MILESTONES = [10, 25, 50, 100, 150, 200, 300, 400, 500, 750, 1000, 1500, 2000, 3000, 5000, 7500, 10000];

const nextMilestone = (n) => MILESTONES.find(m => m > n) || Math.ceil((n + 1) / 5000) * 5000;

// Today's loop: which stops are done and where the learner is now.
const useTodayPath = ({ progress, cardsToday, recent }) => {
    const [local, setLocal] = useState({});
    useEffect(() => { setLocal(stagesToday()); }, []);

    const today = progress?.days?.[progress.days.length - 1];
    const lastSentence = recent?.find(item => item.type === 'sentence');
    const sentenceHref = lastSentence ? `/sentence/${lastSentence.sentenceId}` : '/analyze';
    const read = !!today?.analyzed;
    const minutes = Math.max(1, Math.round((cardsToday * SECONDS_PER_CARD) / 60));

    const stops = [
        {
            key: 'read',
            name: 'Read',
            caption: read ? 'You read something today' : 'Paste a sentence',
            done: read,
            href: '/analyze',
            next: {
                title: 'Read something new',
                detail: 'Paste a sentence you want to understand: a lyric, a caption, a line from a show.',
                action: 'Paste a sentence',
                focusInput: true,
            },
        },
        {
            key: 'understand',
            name: 'Understand',
            caption: 'Tap the words',
            done: !!local.understand || (read && !!today?.wordsSaved),
            href: sentenceHref,
            next: {
                title: 'Study your sentence',
                detail: 'Open it and tap each word to see what it means and how it is built.',
                action: lastSentence ? 'Open my sentence' : 'Open the analyzer',
                href: sentenceHref,
            },
        },
        {
            key: 'keep',
            name: 'Keep',
            caption: today?.wordsSaved ? `${plural(today.wordsSaved, 'word')} saved` : 'Save new words',
            done: !!today?.wordsSaved,
            href: sentenceHref,
            next: {
                title: 'Keep the new words',
                detail: 'Save the words you want to remember. They turn into flashcards for you.',
                action: lastSentence ? 'Save words' : 'Open the analyzer',
                href: sentenceHref,
            },
        },
        {
            key: 'review',
            name: 'Review',
            caption: cardsToday ? `${plural(cardsToday, 'card')} waiting` : 'All caught up',
            done: cardsToday === 0,
            href: '/cards',
            badge: cardsToday,
            next: {
                title: `Review ${plural(cardsToday, 'card')}`,
                detail: `About ${plural(minutes, 'minute')}. Each word comes back right before you would forget it.`,
                action: 'Start review',
                href: '/cards',
            },
        },
    ];
    const hereIndex = stops.findIndex(stop => !stop.done);
    return { stops, hereIndex, cardsToday, minutes };
};

const DayPath = ({ path, streak, onFocusInput }) => {
    const { stops, hereIndex, cardsToday, minutes } = path;
    const here = hereIndex === -1 ? null : stops[hereIndex];
    // Review is the habit that matters most, so offer it even when the
    // learner is earlier in today's loop.
    const offerReview = here && here.key !== 'review' && cardsToday > 0;

    return (
        <section className={styles.pathCard} aria-labelledby="path-heading">
            <div className={styles.pathHead}>
                <h2 id="path-heading" className={styles.cardTitle}>Today&apos;s path</h2>
                <span className={styles.pathCount}>
                    {stops.filter(s => s.done).length} of {stops.length} done
                </span>
            </div>
            <div className={styles.path}>
                <svg className={styles.trail} viewBox="0 0 400 110" preserveAspectRatio="none" aria-hidden="true">
                    {[0, 1, 2].map(i => (
                        <line
                            key={i}
                            x1={50 + i * 100} y1={i % 2 === 0 ? 72 : 38}
                            x2={150 + i * 100} y2={i % 2 === 0 ? 38 : 72}
                            className={stops[i].done && stops[i + 1].done ? styles.trailDone : ''}
                            vectorEffect="non-scaling-stroke"
                        />
                    ))}
                </svg>
                <ol className={styles.nodes}>
                    {stops.map((stop, i) => (
                        <li key={stop.key} className={`${styles.node} ${styles[`node_${stop.key}`]} ${i === hereIndex ? styles.here : ''} ${stop.done ? styles.nodeDone : ''}`}>
                            <Link href={stop.href} className={styles.nodeLink} aria-current={i === hereIndex ? 'step' : undefined}>
                                {i === hereIndex && <span className={styles.hereTag}>You are here</span>}
                                <span className={styles.disc}>
                                    {ICONS[stop.key]}
                                    {stop.done && <span className={styles.doneTick} aria-label="done">{ICONS.check}</span>}
                                    {stop.badge && !stop.done ? <span className={styles.nodeBadge}>{stop.badge > 99 ? '99+' : stop.badge}</span> : null}
                                </span>
                                <b>{stop.name}</b>
                                <small>{stop.caption}</small>
                            </Link>
                        </li>
                    ))}
                </ol>
            </div>
            <div className={styles.nextStep}>
                {here ? (
                    <>
                        <div className={styles.nextText}>
                            <span className={styles.eyebrow}>Next</span>
                            <strong>{here.next.title}</strong>
                            <span>{here.next.detail}</span>
                        </div>
                        <div className={styles.nextActions}>
                            {offerReview && (
                                <Link href="/cards" className={styles.ghostButton}>
                                    Review {cardsToday} · {minutes} min
                                </Link>
                            )}
                            {here.next.focusInput ? (
                                <button type="button" className={`${styles.pressButton} ${styles[`press_${here.key}`]}`} onClick={onFocusInput}>
                                    {here.next.action}
                                </button>
                            ) : (
                                <Link href={here.next.href} className={`${styles.pressButton} ${styles[`press_${here.key}`]}`}>
                                    {here.next.action}
                                </Link>
                            )}
                        </div>
                    </>
                ) : (
                    <>
                        <div className={styles.nextText}>
                            <span className={styles.eyebrow}>Loop complete</span>
                            <strong>You did all four today!</strong>
                            <span>{streak?.current ? `Come back tomorrow for day ${streak.current + 1} of your streak.` : 'Come back tomorrow to start a streak.'}</span>
                        </div>
                        <div className={styles.nextActions}>
                            <Link href="/lyrics" className={styles.ghostButton}>Read a song</Link>
                        </div>
                    </>
                )}
            </div>
        </section>
    );
};

const RecentWork = ({ items }) => (
    <section className={styles.card} aria-labelledby="recent-heading">
        <div className={styles.cardHeader}>
            <h2 id="recent-heading" className={styles.cardTitle}>Pick up where you left off</h2>
            <Link href="/library" className={styles.cardLink}>Library</Link>
        </div>
        {items === null ? (
            <div className={styles.muted}>Loading…</div>
        ) : items.length === 0 ? (
            <div className={styles.emptyState}>
                <Mascot pose="sleep" size={64} />
                <span>Things you read will show up here so you can pick them back up.</span>
            </div>
        ) : (
            <ul className={styles.recentList}>
                {items.map(item => {
                    const isSentence = item.type === 'sentence';
                    const href = isSentence ? `/sentence/${item.sentenceId}` : `/extended-text/${item.textId}`;
                    return (
                        <li key={`${item.type}-${item.sentenceId || item.textId}`}>
                            <Link href={href} className={styles.recentItem}>
                                <span className={styles.recentText}>{isSentence ? item.text : (item.title || item.text)}</span>
                                <span className={styles.recentMeta}>
                                    {isSentence ? (item.translation || 'Sentence') : `Paragraph · ${plural(item.sentenceCount || 0, 'sentence')}`}
                                </span>
                            </Link>
                        </li>
                    );
                })}
            </ul>
        )}
    </section>
);

const WordsCard = ({ totals }) => {
    const goal = nextMilestone(totals.words);
    const prev = [...MILESTONES].reverse().find(m => m <= totals.words) || 0;
    const pct = Math.max(4, Math.min(100, ((totals.words - prev) / (goal - prev)) * 100));
    return (
        <section className={`${styles.card} ${styles.wordsCard}`} aria-labelledby="words-heading">
            <h2 id="words-heading" className={styles.eyebrow}>Words saved</h2>
            <div className={styles.bigRow}>
                <span className={styles.bigNumber}>{totals.words.toLocaleString()}</span>
                {totals.wordsThisWeek ? <span className={styles.delta}>+{totals.wordsThisWeek} this week</span> : null}
            </div>
            <div className={styles.xpBar} role="progressbar" aria-valuemin={prev} aria-valuemax={goal} aria-valuenow={totals.words}>
                <i style={{ width: `${pct}%` }} />
            </div>
            <div className={styles.xpCaption}>
                <span>{(goal - totals.words).toLocaleString()} more to reach {goal.toLocaleString()}</span>
                <span>{totals.masteredWords.toLocaleString()} remembered well</span>
            </div>
        </section>
    );
};

const StreakCard = ({ progress }) => {
    const { streak, days } = progress;
    return (
        <section className={`${styles.card} ${styles.streakCard}`} aria-labelledby="streak-heading">
            <div className={styles.streakTop}>
                <span className={`${styles.streakFlame} ${streak.activeToday ? '' : styles.streakIdle}`}>{ICONS.flame}</span>
                <div>
                    <h2 id="streak-heading" className={styles.streakTitle}>{streak.current}-day streak</h2>
                    <span className={styles.streakSub}>
                        {streak.activeToday
                            ? `Best: ${plural(streak.best, 'day')}`
                            : streak.current ? 'Do one thing today to keep it going' : 'Read or review today to start one'}
                    </span>
                </div>
            </div>
            <WeekStrip days={days} />
        </section>
    );
};

const TutorCard = () => (
    <section className={`${styles.card} ${styles.tutorCard}`} aria-labelledby="tutor-heading">
        <Tiger size={64} />
        <div>
            <h2 id="tutor-heading" className={styles.cardTitle}>Practice with Horangi</h2>
            <p>Chat with your tutor in Korean. Ask anything about the sentences you read.</p>
            <Link href="/tutor" className={styles.tutorButton}>Start a chat</Link>
        </div>
    </section>
);

const ProgressPanel = ({ progress }) => {
    const { totals, days } = progress;
    const hasActivity = days.some(d => d.analyzed || d.wordsSaved || d.reviews);
    return (
        <section className={`${styles.card} ${styles.progressCard}`} aria-labelledby="progress-heading">
            <div className={styles.cardHeader}>
                <h2 id="progress-heading" className={styles.cardTitle}>Your progress</h2>
            </div>
            <div className={styles.statGrid}>
                <div className={styles.statTile} style={{ '--tile-color': 'var(--bp-read)' }}>
                    <span>Sentences read</span>
                    <b>{totals.sentences.toLocaleString()}</b>
                    <small>{totals.analyzedThisWeek ? `+${totals.analyzedThisWeek} this week` : 'None yet this week'}</small>
                </div>
                <div className={styles.statTile} style={{ '--tile-color': 'var(--bp-keep-d)' }}>
                    <span>Cards reviewed</span>
                    <b>{totals.reviewsThisWeek.toLocaleString()}</b>
                    <small>this week</small>
                </div>
                <div className={styles.statTile} style={{ '--tile-color': 'var(--bp-und-d)' }}>
                    <span>Remembered</span>
                    <b>{totals.masteredWords.toLocaleString()}</b>
                    <small>reviewed well for 3+ weeks</small>
                </div>
            </div>
            {hasActivity ? (
                <div className={styles.charts}>
                    <div>
                        <h3 className={styles.chartTitle}>Last 4 weeks</h3>
                        <TrendChart days={days.slice(-28)} />
                    </div>
                    <div>
                        <h3 className={styles.chartTitle}>Every day you showed up</h3>
                        <ActivityHeatmap days={days} />
                    </div>
                </div>
            ) : (
                <div className={`${styles.emptyState} ${styles.progressEmpty}`}>
                    <Mascot pose="point" size={64} />
                    <span>Your charts fill in as you read sentences, save words and review them. Come back after your first session.</span>
                </div>
            )}
        </section>
    );
};

const HomeView = () => {
    const { user } = useAuth();
    const cardsToday = useCardsToday(!!user);
    const { progress, loading } = useProgress(!!user, 84);
    const recent = useRecentWork(!!user);
    const [now] = useState(() => new Date());
    const inputRef = useRef(null);
    const path = useTodayPath({ progress, cardsToday: cardsToday || 0, recent });

    const firstName = user?.name ? user.name.split(' ')[0] : '';
    const streak = progress?.streak;

    let subline = 'What do you want to read today?';
    if (path.hereIndex === -1 && progress) {
        subline = 'You finished today\'s loop. Nice work!';
    } else if (streak?.current && streak.activeToday) {
        subline = `Day ${streak.current} of your streak. Keep walking the path.`;
    } else if (streak?.current) {
        subline = `Your ${plural(streak.current, 'day')} streak is waiting. One step keeps it alive.`;
    }

    const focusInput = () => {
        inputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        inputRef.current?.focus({ preventScroll: true });
    };

    return (
        <div className={styles.home}>
            <header className={styles.greeting}>
                <Mascot pose="wave" size={110} motion="bob" className={styles.greetingMascot} />
                <div className={styles.speech}>
                    <h1>{greetingFor(now)}{firstName ? `, ${firstName}` : ''}!</h1>
                    <p>{subline}</p>
                </div>
            </header>

            {progress || !loading ? (
                <DayPath path={path} streak={streak} onFocusInput={focusInput} />
            ) : (
                <section className={styles.pathCard}><div className={styles.muted}>Loading your day…</div></section>
            )}

            <div className={styles.columns}>
                <div className={styles.column}>
                    <QuickInput inputRef={inputRef} />
                    <QuotaDisplay smallScreensOnly />
                    <RecentWork items={recent} />
                </div>
                <div className={styles.column}>
                    {progress && <WordsCard totals={progress.totals} />}
                    {progress && <StreakCard progress={progress} />}
                    <TutorCard />
                </div>
            </div>

            {progress && <ProgressPanel progress={progress} />}
        </div>
    );
};

export default HomeView;
