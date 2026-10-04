'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import useCardsToday from '@/hooks/useCardsToday';
import useProgress from '@/hooks/useProgress';
import Mascot from '@/components/Mascot';
import QuotaDisplay from '@/components/QuotaDisplay';
import { WeekStrip, ActivityHeatmap, TrendChart } from '@/components/home/ActivityCharts';
import { MaterialSymbolsVariableAddRounded } from '@/components/icons/AddSentence';
import { MaterialSymbolsLibraryBooksSharp } from '@/components/icons/LibraryBooks';
import { PhCardsFill } from '@/components/icons/CardsFill';
import { IcSharpSchool } from '@/components/icons/School';
import { Fa6SolidParagraph } from '@/components/icons/Paragraph';
import { IcSharpQueueMusic } from '@/components/icons/MusicLyrics';
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

const QuickInput = () => {
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
        <form className={styles.quickInput} onSubmit={submit}>
            <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) submit(e);
                }}
                rows={2}
                placeholder={`Paste a ${languageName} sentence you want to understand…`}
                aria-label="Sentence to analyze"
            />
            <div className={styles.quickInputBar}>
                <div className={styles.quickInputLinks}>
                    <Link href="/extended-text"><Fa6SolidParagraph /> Paragraph</Link>
                    <Link href="/analyze">Image</Link>
                </div>
                <button type="submit" disabled={!text.trim()}>Analyze</button>
            </div>
        </form>
    );
};

const Shortcut = ({ href, color, icon, label, badge }) => (
    <Link href={href} className={styles.shortcut} style={{ '--shortcut-color': color }}>
        <span className={styles.shortcutCircle}>
            {icon}
            {badge ? <span className={styles.shortcutBadge}>{badge > 99 ? '99+' : badge}</span> : null}
        </span>
        <span className={styles.shortcutLabel}>{label}</span>
    </Link>
);

const UpNext = ({ cardsToday, progress, recent }) => {
    const totals = progress?.totals;
    const lastSentence = recent?.find(item => item.type === 'sentence');
    let card;

    if (cardsToday > 0) {
        const minutes = Math.max(1, Math.round((cardsToday * SECONDS_PER_CARD) / 60));
        card = {
            pose: 'cards',
            title: `Review ${plural(cardsToday, 'card')}`,
            detail: `About ${plural(minutes, 'minute')}. Words you saved come back right before you'd forget them.`,
            href: '/cards',
            action: 'Start review',
        };
    } else if (totals && totals.sentences === 0) {
        card = {
            pose: 'point',
            title: 'Analyze your first sentence',
            detail: 'Paste something you want to read above: a lyric, a caption, a line from a show.',
            href: '/analyze',
            action: 'Open the analyzer',
        };
    } else if (totals && totals.words === 0 && lastSentence) {
        card = {
            pose: 'point',
            title: 'Save words to start reviewing',
            detail: 'Open your last sentence and add its new words to Flashcards.',
            href: `/sentence/${lastSentence.sentenceId}`,
            action: 'Open last sentence',
        };
    } else {
        card = {
            pose: 'wave',
            title: "You're all caught up",
            detail: 'No cards left today. Read something new, or pick a song in Lyrics.',
            href: '/lyrics',
            action: 'Browse lyrics',
        };
    }

    return (
        <section className={`${styles.card} ${styles.upNext}`} aria-labelledby="up-next-heading">
            <Mascot pose={card.pose} size={64} className={styles.upNextMascot} />
            <div className={styles.upNextBody}>
                <h2 id="up-next-heading" className={styles.eyebrow}>Up next</h2>
                <div className={styles.upNextTitle}>{card.title}</div>
                <p className={styles.upNextDetail}>{card.detail}</p>
            </div>
            <Link href={card.href} className={styles.primaryButton}>{card.action}</Link>
        </section>
    );
};

const RecentWork = ({ items }) => (
    <section className={styles.card} aria-labelledby="recent-heading">
        <div className={styles.cardHeader}>
            <h2 id="recent-heading" className={styles.cardTitle}>Continue</h2>
            <Link href="/history" className={styles.cardLink}>See all in Library</Link>
        </div>
        {items === null ? (
            <div className={styles.muted}>Loading…</div>
        ) : items.length === 0 ? (
            <div className={styles.emptyState}>
                <Mascot pose="sleep" size={48} />
                <span>Things you analyze will show up here so you can pick them back up.</span>
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

const StatTile = ({ value, label, detail, tone }) => (
    <div className={styles.statTile} style={tone ? { '--tile-color': tone } : undefined}>
        <div className={styles.statValue}>{value}</div>
        <div className={styles.statLabel}>{label}</div>
        {detail ? <div className={styles.statDetail}>{detail}</div> : null}
    </div>
);

const ProgressPanel = ({ progress, loading }) => {
    if (loading && !progress) {
        return <section className={`${styles.card} ${styles.progressCard}`}><div className={styles.muted}>Loading your progress…</div></section>;
    }
    if (!progress) return null;

    const { totals, streak, days } = progress;
    const hasActivity = days.some(d => d.analyzed || d.wordsSaved || d.reviews);
    return (
        <section className={`${styles.card} ${styles.progressCard}`} aria-labelledby="progress-heading">
            <div className={styles.cardHeader}>
                <h2 id="progress-heading" className={styles.cardTitle}>Your progress</h2>
            </div>
            <div className={styles.statGrid}>
                <StatTile
                    value={totals.words.toLocaleString()}
                    label="Words saved"
                    detail={totals.wordsThisWeek ? `+${totals.wordsThisWeek} this week` : 'None yet this week'}
                    tone="var(--chart-words)"
                />
                <StatTile
                    value={totals.masteredWords.toLocaleString()}
                    label="Words remembered"
                    detail="Reviewed well for 3+ weeks"
                    tone="var(--chart-reviews)"
                />
                <StatTile
                    value={totals.sentences.toLocaleString()}
                    label="Sentences analyzed"
                    detail={totals.analyzedThisWeek ? `+${totals.analyzedThisWeek} this week` : 'None yet this week'}
                    tone="var(--chart-analyzed)"
                />
                <StatTile
                    value={plural(streak.best, 'day')}
                    label="Best streak"
                    detail={streak.current ? `Current: ${plural(streak.current, 'day')}` : 'Start a new one today'}
                    tone="#e5484d"
                />
            </div>
            {hasActivity ? (
                <>
                    <h3 className={styles.chartTitle}>Last 4 weeks</h3>
                    <TrendChart days={days.slice(-28)} />
                    <h3 className={styles.chartTitle}>Activity</h3>
                    <ActivityHeatmap days={days} />
                </>
            ) : (
                <div className={`${styles.emptyState} ${styles.progressEmpty}`}>
                    <Mascot pose="point" size={56} />
                    <span>Your charts fill in as you analyze sentences, save words and review them. Come back after your first session.</span>
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

    const firstName = user?.name ? user.name.split(' ')[0] : '';
    const streak = progress?.streak;

    let subline = 'What do you want to read today?';
    if (streak?.current) {
        subline = `Day ${streak.current} of your streak.`;
        if (!streak.activeToday) subline += ' Do one thing today to keep it going.';
    }
    if (cardsToday) subline += ` ${plural(cardsToday, 'card is', 'cards are')} waiting.`;

    return (
        <div className={styles.home}>
            <header className={styles.greeting}>
                <Mascot pose="wave" size={76} className={styles.greetingMascot} />
                <div className={styles.greetingText}>
                    <h1>{greetingFor(now)}{firstName ? `, ${firstName}` : ''}</h1>
                    <p>{subline}</p>
                </div>
                {progress && <WeekStrip days={progress.days} />}
            </header>

            <QuickInput />
            <QuotaDisplay smallScreensOnly />

            <nav className={styles.shortcuts} aria-label="Shortcuts">
                <Shortcut href="/analyze" color="#3d64e8" icon={<MaterialSymbolsVariableAddRounded />} label="Analyze" />
                <Shortcut href="/history" color="#0f9f8f" icon={<MaterialSymbolsLibraryBooksSharp />} label="Library" />
                <Shortcut href="/cards" color="#e5484d" icon={<PhCardsFill />} label="Review" badge={cardsToday} />
                <Shortcut href="/tutor" color="#7c4ddb" icon={<IcSharpSchool />} label="Tutor" />
                <Shortcut href="/lyrics" color="#e08a1e" icon={<IcSharpQueueMusic />} label="Lyrics" />
            </nav>

            <div className={styles.columns}>
                <div className={styles.column}>
                    <UpNext cardsToday={cardsToday} progress={progress} recent={recent} />
                    <RecentWork items={recent} />
                </div>
                <div className={styles.column}>
                    <ProgressPanel progress={progress} loading={loading} />
                </div>
            </div>
        </div>
    );
};

export default HomeView;
