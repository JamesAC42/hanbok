'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Dashboard from '@/components/Dashboard';
import Tiger from '@/components/Tiger';
import getFontClass from '@/lib/fontClass';
import Stars, { STAGE_NAMES, LEVEL_STEPS } from '@/components/grammar/Stars';
import Mascot from '@/components/Mascot';
import { useGrammarGuides, findGuide } from '@/lib/grammarGuides';
import styles from '@/styles/components/grammar.module.scss';

const LEVEL_NAMES = { 1: 'Beginner', 2: 'Elementary', 3: 'Intermediate', 4: 'Upper intermediate', 5: 'Advanced' };

const DAY = 24 * 60 * 60 * 1000;
const reviewText = (p) => {
    if (p.due) return 'Due in Review';
    if (!p.nextReviewDate) return p.stage === 0 ? 'Not started' : null;
    const days = Math.max(1, Math.round((new Date(p.nextReviewDate) - Date.now()) / DAY));
    return days === 1 ? 'Next review tomorrow' : `Next review in ${days} days`;
};

// One saved point as a row on its level's path: the form on a disc (the
// path line runs through the discs), what it means, how well you know it,
// and what to do next. The whole row opens the point; the guide link sits above it.
const PointRow = ({ p, isHere, font, guide }) => {
    const review = reviewText(p);
    return (
        <li className={`${styles.pointRow} ${styles[`stage${p.stage}`]} ${p.due ? styles.rowDue : ''} ${isHere ? styles.rowHere : ''}`}>
            <span className={styles.rowRail} aria-hidden="true">
                <span className={`${styles.disc} ${p.form.length > 6 ? styles.discLong : ''} ${font}`} lang={p.language}>{p.form}</span>
            </span>
            <span className={styles.rowBody}>
                <span className={styles.rowHead}>
                    <Link href={`/my-grammar/${p.grammarId}`} className={styles.rowLink} aria-current={isHere ? 'step' : undefined}>
                        <span className={`${styles.rowForm} ${font}`} lang={p.language}>{p.form}</span>
                        <span className={styles.rowName}>{p.name}</span>
                    </Link>
                </span>
                {p.explanation && <span className={styles.rowExplain}>{p.explanation}</span>}
                <span className={styles.rowMeta}>
                    <span className={styles.rowStage}><Stars stage={p.stage} /> {STAGE_NAMES[p.stage]}</span>
                    {p.answered > 0 && <span>{p.correct} of {p.answered} right</span>}
                    {p.sourceCount > 0 && <span>In {plural(p.sourceCount, 'sentence')} you analyzed</span>}
                    {guide && <Link href={guide.href} className={styles.rowGuide}>Read the guide</Link>}
                </span>
            </span>
            <span className={styles.rowSide}>
                {isHere && <span className={styles.hereTag}>{p.due ? 'Up next' : p.stage === 0 ? 'Start here' : 'Next'}</span>}
                {p.due ? <span className={styles.nodeTag}>Due</span>
                    : p.stage === 0 ? <span className={`${styles.nodeTag} ${styles.nodeTagNew}`}>Start lesson</span>
                        : <span className={styles.rowWhen}>{review}</span>}
                <span className={styles.rowChevron} aria-hidden="true">›</span>
            </span>
        </li>
    );
};

const LevelPanel = ({ level, group, hereId, font, guides }) => {
    const learned = group.filter((p) => p.stage > 0).length;
    const due = group.filter((p) => p.due).length;
    return (
        <section className={styles.levelPanel} aria-label={`Level ${level}`}>
            <header className={styles.levelHead}>
                <span className={styles.levelNumber}>{level}</span>
                <span className={styles.levelTitle}>
                    <b>Level {level}</b>
                    {LEVEL_NAMES[level] || ''}
                </span>
                <span className={styles.levelStats}>
                    {due > 0 && <span className={styles.levelDue}>{due} due</span>}
                    <span>{learned} of {group.length} learned</span>
                </span>
            </header>
            <div className={styles.levelBar} aria-hidden="true"><i style={{ width: `${(learned / group.length) * 100}%` }} /></div>
            <ol className={styles.pointList}>
                {group.map((p) => (
                    <PointRow key={p.grammarId} p={p} isHere={p.grammarId === hereId} font={font} guide={findGuide(guides, p.form, p.language)} />
                ))}
            </ol>
        </section>
    );
};

const PathRail = ({ allowance }) => (
    <aside className={styles.pathRail} aria-label="How the path works">
        <div className={styles.railCard}>
            <p className={styles.label}>How a point grows</p>
            <ol className={styles.growList}>
                {LEVEL_STEPS.map((step, i) => (
                    <li key={step.name}>
                        <Stars stage={i + 1} />
                        <span><b>{step.name}</b>{step.how}</span>
                    </li>
                ))}
            </ol>
            <p className={styles.railFine}>Points come back in Review between your word cards, right before you would forget them.</p>
        </div>
        <PlanNote allowance={allowance} />
        <Link href="/learn" className={`${styles.railCard} ${styles.railLink}`}>
            <Mascot pose="study" size={52} label="" />
            <span>
                <strong>Full grammar guides</strong>
                Rules, tricky cases and quizzes for each point, in Learn.
            </span>
        </Link>
    </aside>
);

const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;

const PlanNote = ({ allowance }) => {
    if (!allowance || allowance.paid) return null;
    const { limits, usage } = allowance;
    return (
        <div className={`${styles.railCard} ${styles.planNote}`}>
            <Tiger pose="head" size={40} label="" />
            <span>
                Free plan: {plural(allowance.quizLeftToday, 'practice question')} left today,
                {' '}{plural(allowance.lessonsLeftThisWeek, 'lesson')} left this week,
                {' '}{usage.saves} of {limits.saves} grammar points saved.
                {' '}<Link href="/pricing">Basic</Link> makes all of it unlimited. Reviewing what you saved is always free.
            </span>
        </div>
    );
};

const EmptyPath = () => (
    <div className={`${styles.card} ${styles.empty}`}>
        <Tiger pose="teach" size={130} motion="bob" />
        <h2>Your grammar path starts with one sentence</h2>
        <p className={styles.muted}>
            Analyze a sentence, open its Grammar section and tap Save grammar. Each point you save shows up here with a short lesson from Horangi, and comes back in your Review as quick questions built from words you saved.
        </p>
        <ol className={styles.steps}>
            <li><b>1 · Save</b>Tap Save grammar under any grammar point in an analysis.</li>
            <li><b>2 · Learn</b>Horangi explains it in four short screens.</li>
            <li><b>3 · Review</b>It comes back in Review with questions that use your own words.</li>
        </ol>
        <Link href="/analyze" className={styles.pressRead}>Analyze a sentence</Link>
    </div>
);

const MyGrammar = () => {
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();
    const { language: currentLanguage } = useLanguage();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [language, setLanguage] = useState(null);
    const guides = useGrammarGuides();

    useEffect(() => {
        if (!loading && !isAuthenticated) router.replace('/login');
        document.title = 'Hanbok - My grammar';
    }, [loading, isAuthenticated, router]);

    useEffect(() => {
        if (!isAuthenticated) return;
        fetch('/api/grammar')
            .then((res) => res.json())
            .then((json) => {
                if (!json.success) throw new Error(json.error);
                setData(json);
                const langs = json.languages || [];
                setLanguage(langs.includes(currentLanguage) ? currentLanguage : langs[0] || currentLanguage);
            })
            .catch(() => setError('Your grammar path could not load. Refresh to try again.'));
    }, [isAuthenticated, currentLanguage]);

    const points = useMemo(
        () => (data?.points || []).filter((p) => !language || p.language === language),
        [data, language]
    );
    const due = points.filter((p) => p.due).length;
    const learned = points.filter((p) => p.stage > 0).length;
    const answered = points.reduce((n, p) => n + (p.answered || 0), 0);
    const correct = points.reduce((n, p) => n + (p.correct || 0), 0);
    const sentences = points.reduce((n, p) => n + (p.sourceCount || 0), 0);
    const hereId = (points.find((p) => p.stage === 0) || points.find((p) => p.due))?.grammarId;
    const font = getFontClass(language);

    const byLevel = useMemo(() => {
        const groups = new Map();
        points.forEach((p) => {
            if (!groups.has(p.level)) groups.set(p.level, []);
            groups.get(p.level).push(p);
        });
        return [...groups.entries()].sort((a, b) => a[0] - b[0]);
    }, [points]);

    if (loading || !isAuthenticated) return null;

    return (
        <Dashboard>
            <div className={styles.page}>
                <div className={`${styles.inner} ${styles.innerWide}`}>
                    <h1 className={styles.pageTitle}>My grammar</h1>
                    {error && <p className={styles.error}>{error}</p>}
                    {!data && !error && <p className={styles.loading}>Loading your grammar…</p>}
                    {data && data.points.length === 0 && <EmptyPath />}
                    {data && data.points.length > 0 && (
                        <>
                            <section className={styles.hero}>
                                <Tiger pose={due ? 'study' : 'celebrate'} size={92} />
                                <div>
                                    <h2>{plural(points.length, 'grammar point')} on your path</h2>
                                    <p className={styles.muted}>
                                        {due
                                            ? `${plural(due, 'point is', 'points are')} due today. They come up in Review between your word cards.`
                                            : 'Nothing due today. Each point comes back in Review right before you would forget it.'}
                                    </p>
                                </div>
                                <div className={styles.heroActions}>
                                    {due > 0 && <Link href="/cards" className={styles.pressRead}>Review now</Link>}
                                    <Link href="/my-grammar/practice" className={due ? styles.ghostUnd : styles.press}>Practice weak spots</Link>
                                </div>
                                <dl className={styles.heroStats}>
                                    <div><dt>Learned</dt><dd>{learned}<small> of {points.length}</small></dd></div>
                                    <div><dt>Due today</dt><dd className={due ? styles.statDue : undefined}>{due}</dd></div>
                                    <div><dt>Questions right</dt><dd>{answered ? `${Math.round((correct / answered) * 100)}%` : '–'}{answered > 0 && <small> of {answered}</small>}</dd></div>
                                    <div><dt>Found in</dt><dd>{sentences}<small> {sentences === 1 ? 'sentence' : 'sentences'}</small></dd></div>
                                </dl>
                            </section>

                            {data.languages.length > 1 && (
                                <div className={styles.actions} role="tablist" aria-label="Language">
                                    {data.languages.map((lang) => (
                                        <button
                                            key={lang}
                                            type="button"
                                            role="tab"
                                            aria-selected={lang === language}
                                            className={`${styles.pill} ${lang === language ? styles.pillUnd : ''}`}
                                            onClick={() => setLanguage(lang)}
                                        >
                                            {lang.toUpperCase()}
                                        </button>
                                    ))}
                                </div>
                            )}

                            <div className={styles.pathCols}>
                                <div className={styles.path}>
                                    {byLevel.map(([level, group]) => (
                                        <LevelPanel key={level} level={level} group={group} hereId={hereId} font={font} guides={guides} />
                                    ))}
                                </div>
                                <PathRail allowance={data.allowance} />
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Dashboard>
    );
};

export default MyGrammar;
