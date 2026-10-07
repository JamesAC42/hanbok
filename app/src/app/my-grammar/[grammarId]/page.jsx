'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from '@/components/Dashboard';
import Tiger from '@/components/Tiger';
import Stars, { STAGE_NAMES } from '@/components/grammar/Stars';
import getFontClass from '@/lib/fontClass';
import { useGrammarGuides, findGuide } from '@/lib/grammarGuides';
import styles from '@/styles/components/grammar.module.scss';

const LEVEL_STEPS = [
    { name: 'Learned', how: 'Do the lesson or get one question right' },
    { name: 'Practiced', how: 'Get 3 questions right' },
    { name: 'Strong', how: 'Remember it a week later' },
    { name: 'Mastered', how: 'Remember it three weeks later' },
];

const formatDue = (date) => {
    if (!date) return null;
    const d = new Date(date);
    const days = Math.round((d - new Date()) / 86400000);
    if (days <= 0) return 'Due in Review today';
    if (days === 1) return 'Back in Review tomorrow';
    return `Back in Review in ${days} days`;
};

const GrammarPoint = () => {
    const { grammarId } = useParams();
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();
    const [point, setPoint] = useState(null);
    const [error, setError] = useState('');
    const [confirmRemove, setConfirmRemove] = useState(false);
    const guides = useGrammarGuides();

    useEffect(() => {
        if (!loading && !isAuthenticated) router.replace('/login');
    }, [loading, isAuthenticated, router]);

    useEffect(() => {
        if (!isAuthenticated) return;
        fetch(`/api/grammar/point/${grammarId}`)
            .then((res) => res.json())
            .then((json) => {
                if (!json.success) throw new Error(json.error);
                setPoint(json.point);
                document.title = `Hanbok - ${json.point.form}`;
            })
            .catch(() => setError('This grammar point is not on your path. It may have been removed.'));
    }, [isAuthenticated, grammarId]);

    const remove = async () => {
        const res = await fetch(`/api/grammar/point/${grammarId}`, { method: 'DELETE' });
        if (res.ok) router.push('/my-grammar');
        else setError('Could not remove it. Try again.');
    };

    if (loading || !isAuthenticated) return null;
    const font = getFontClass(point?.language);
    const guide = point ? findGuide(guides, point.form, point.language) : null;

    return (
        <Dashboard>
            <div className={styles.page}>
                <div className={`${styles.inner} ${styles.narrow}`}>
                    <Link href="/my-grammar" className={styles.label} style={{ textDecoration: 'none' }}>← My grammar</Link>
                    {error && <p className={styles.error}>{error}</p>}
                    {!point && !error && <p className={styles.loading}>Loading…</p>}
                    {point && (
                        <>
                            <div className={styles.pointHead}>
                                <div style={{ flex: 1, minWidth: 0 }}>
                                    <h1 className={font} lang={point.language}>{point.form}</h1>
                                    <p className={styles.pointName}>{point.name}</p>
                                </div>
                                <Tiger pose={point.stage === 4 ? 'celebrate' : 'teach'} size={86} />
                            </div>
                            <div className={styles.actions}>
                                <span className={`${styles.pill} ${styles.pillUnd}`}><Stars stage={point.stage} /> {STAGE_NAMES[point.stage]}</span>
                                <span className={styles.pill}>Level {point.level}</span>
                                {point.nextReviewDate && (
                                    <span className={`${styles.pill} ${point.due ? styles.pillRev : ''}`}>{formatDue(point.nextReviewDate)}</span>
                                )}
                            </div>

                            <div className={styles.actions}>
                                <Link href={`/my-grammar/${grammarId}/lesson`} className={point.lessonDone ? styles.ghostUnd : styles.press}>
                                    {point.lessonDone ? 'Lesson again' : 'Start the lesson'}
                                </Link>
                                <Link href={`/my-grammar/practice?id=${grammarId}`} className={point.lessonDone ? styles.press : styles.ghostUnd}>
                                    Practice
                                </Link>
                            </div>

                            <div className={styles.levels}>
                                {LEVEL_STEPS.map((step, i) => (
                                    <div key={step.name} className={`${styles.levelStep} ${point.stage > i ? styles.levelDone : ''}`}>
                                        <b>{point.stage > i ? '★ ' : ''}{step.name}</b>
                                        {step.how}
                                    </div>
                                ))}
                            </div>

                            {guide && (
                                <Link href={guide.href} className={styles.guideLink}>
                                    <Tiger pose="head" size={44} label="" />
                                    <span>
                                        <strong>Full guide: {guide.title}</strong>
                                        More examples, the tricky cases and a quiz in Learn.
                                    </span>
                                </Link>
                            )}

                            {(point.explanation || point.examples?.length > 0) && (
                                <section className={styles.card}>
                                    <h2 className={styles.label} style={{ marginTop: 0 }}>From your analysis</h2>
                                    {point.explanation && <p style={{ fontWeight: 600, lineHeight: 1.55 }}>{point.explanation}</p>}
                                    {point.examples?.length > 0 && (
                                        <div className={styles.examples}>
                                            {point.examples.map((e) => (
                                                <div key={e.original} className={styles.example}>
                                                    <p className={`${styles.exampleSentence} ${font}`} lang={point.language}>{e.original}</p>
                                                    {e.translation && <p className={styles.exampleTranslation}>{e.translation}</p>}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </section>
                            )}

                            {point.sources?.length > 0 && (
                                <section className={styles.card}>
                                    <h2 className={styles.label} style={{ marginTop: 0 }}>Where you found it</h2>
                                    <ul className={styles.sources}>
                                        {point.sources.map((s, i) => {
                                            const href = s.sentenceId ? `/sentence/${s.sentenceId}` : s.textId ? `/extended-text/${s.textId}` : null;
                                            const body = (
                                                <>
                                                    <span className={`${styles.sourceText} ${font}`} lang={point.language}>{s.text || s.title || 'A passage you read'}</span>
                                                    {s.translation && <span className={styles.sourceTranslation}>{s.translation}</span>}
                                                </>
                                            );
                                            return <li key={i}>{href ? <Link href={href}>{body}</Link> : <div>{body}</div>}</li>;
                                        })}
                                    </ul>
                                </section>
                            )}

                            {confirmRemove ? (
                                <div className={styles.planNote}>
                                    <span style={{ flex: 1 }}>Remove {point.form} from your path? Its review card and practice questions go too.</span>
                                    <button type="button" className={styles.ghost} onClick={() => setConfirmRemove(false)}>Keep it</button>
                                    <button type="button" className={styles.pressDanger} onClick={remove}>Remove</button>
                                </div>
                            ) : (
                                <button type="button" className={styles.removeButton} onClick={() => setConfirmRemove(true)}>
                                    Remove from my path
                                </button>
                            )}
                        </>
                    )}
                </div>
            </div>
        </Dashboard>
    );
};

export default GrammarPoint;
