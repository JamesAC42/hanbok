'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Dashboard from '@/components/Dashboard';
import Tiger from '@/components/Tiger';
import getFontClass from '@/lib/fontClass';
import Stars from '@/components/grammar/Stars';
import styles from '@/styles/components/grammar.module.scss';

const LEVEL_NAMES = { 1: 'Beginner', 2: 'Elementary', 3: 'Intermediate', 4: 'Upper intermediate', 5: 'Advanced' };
// Zigzag offsets so the path winds like a trail.
const SHIFTS = ['0rem', '-4.5rem', '-6rem', '-3rem', '1.5rem', '5rem', '6rem', '3rem'];

const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;

const PlanNote = ({ allowance }) => {
    if (!allowance || allowance.paid) return null;
    const { limits, usage } = allowance;
    return (
        <div className={styles.planNote}>
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

    let index = 0;
    return (
        <Dashboard>
            <div className={styles.page}>
                <div className={styles.inner}>
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

                            <PlanNote allowance={data.allowance} />

                            <div className={styles.path}>
                                {byLevel.map(([level, group]) => (
                                    <div key={level} style={{ display: 'contents' }}>
                                        <span className={styles.levelHeading}>Level {level} · {LEVEL_NAMES[level] || ''}</span>
                                        {group.map((p) => {
                                            const shift = SHIFTS[index++ % SHIFTS.length];
                                            const isHere = p.grammarId === hereId;
                                            return (
                                                <div key={p.grammarId} className={styles.pathRow}>
                                                    <Link
                                                        href={`/my-grammar/${p.grammarId}`}
                                                        className={`${styles.node} ${styles[`stage${p.stage}`]} ${isHere ? styles.nodeHere : ''} ${p.due ? styles.nodeDue : ''}`}
                                                        style={{ '--shift': shift }}
                                                        aria-current={isHere ? 'step' : undefined}
                                                    >
                                                        <span className={`${styles.disc} ${font}`} lang={p.language}>{p.form}</span>
                                                        <span className={styles.nodeName}>{p.name}</span>
                                                        <Stars stage={p.stage} />
                                                        {p.due ? <span className={styles.nodeTag}>Due in Review</span>
                                                            : p.stage === 0 ? <span className={`${styles.nodeTag} ${styles.nodeTagNew}`}>Start lesson</span> : null}
                                                    </Link>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </Dashboard>
    );
};

export default MyGrammar;
