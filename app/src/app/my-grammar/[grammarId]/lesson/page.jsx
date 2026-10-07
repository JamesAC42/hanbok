'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from '@/components/Dashboard';
import Tiger from '@/components/Tiger';
import Highlight from '@/components/grammar/Highlight';
import UpgradeSheet from '@/components/grammar/UpgradeSheet';
import getFontClass from '@/lib/fontClass';
import { useGrammarGuides, findGuide } from '@/lib/grammarGuides';
import { track } from '@/lib/analytics';
import styles from '@/styles/components/grammar.module.scss';

// Horangi's lesson, one screen at a time: what it does, how it's built,
// examples (then the learner's own), the common mistake, and a check.
const GrammarLesson = () => {
    const { grammarId } = useParams();
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();
    const [data, setData] = useState(null);
    const [error, setError] = useState('');
    const [limited, setLimited] = useState(false);
    const [step, setStep] = useState(0);
    const [picked, setPicked] = useState(null);
    const guides = useGrammarGuides();

    useEffect(() => {
        if (!loading && !isAuthenticated) router.replace('/login');
        document.title = 'Hanbok - Lesson';
    }, [loading, isAuthenticated, router]);

    useEffect(() => {
        if (!isAuthenticated) return;
        fetch(`/api/grammar/point/${grammarId}/lesson`)
            .then((res) => res.json())
            .then((json) => {
                if (json.reachedLimit) {
                    setLimited(true);
                    return;
                }
                if (!json.success) throw new Error(json.error);
                setData(json);
                track('grammar_lesson_start', { language: json.point.language });
            })
            .catch((e) => setError(e.message || 'Horangi could not write this lesson right now. Try again in a minute.'));
    }, [isAuthenticated, grammarId]);

    if (loading || !isAuthenticated) return null;

    const back = `/my-grammar/${grammarId}`;
    if (limited) {
        return (
            <Dashboard>
                <div className={styles.page}>
                    <div className={`${styles.inner} ${styles.narrow}`}>
                        <Link href={back} className={styles.label} style={{ textDecoration: 'none' }}>← Back</Link>
                    </div>
                    <UpgradeSheet reason="lesson" onClose={() => router.push(back)} />
                </div>
            </Dashboard>
        );
    }

    const lesson = data?.lesson;
    const point = data?.point;
    const font = getFontClass(point?.language);
    const mine = data?.yourExamples || [];
    const screens = lesson ? ['intro', 'examples', ...(mine.length ? ['mine'] : []), ...(lesson.mistake ? ['mistake'] : []), ...(lesson.check ? ['check'] : []), 'done'] : [];
    const screen = screens[step];
    const pct = screens.length ? Math.round((step / (screens.length - 1)) * 100) : 0;
    const guide = point ? findGuide(guides, point.form, point.language) : null;

    const next = async () => {
        const nextStep = step + 1;
        setStep(nextStep);
        setPicked(null);
        if (screens[nextStep] === 'done') {
            await fetch(`/api/grammar/point/${grammarId}/lesson/complete`, { method: 'POST' }).catch(() => {});
            track('grammar_lesson_done', { language: point.language });
        }
    };

    const say = (pose, children) => (
        <div className={styles.speaker}>
            <Tiger pose={pose} size={84} />
            <div className={styles.bubble}>{children}</div>
        </div>
    );

    return (
        <Dashboard>
            <div className={styles.page}>
                <div className={`${styles.inner} ${styles.narrow}`}>
                    <div className={styles.lessonTop}>
                        <Link href={back} className={styles.closeButton} aria-label="Close lesson">✕</Link>
                        <div className={styles.progress} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
                            <i style={{ width: `${Math.max(pct, 4)}%` }} />
                        </div>
                    </div>

                    {error && <p className={styles.error}>{error}</p>}
                    {!data && !error && (
                        <div className={styles.loading}>
                            <Tiger pose="study" size={90} motion="bob" />
                            Horangi is writing your lesson…
                        </div>
                    )}

                    {screen === 'intro' && (
                        <>
                            <span className={`${styles.pill} ${styles.pillUnd}`} style={{ alignSelf: 'flex-start' }}>
                                <span className={`${styles.form} ${font}`}>{point.form}</span> · {point.name}
                            </span>
                            {say('teach', lesson.intro)}
                            <div className={styles.card}>
                                <span className={styles.label}>How to build it</span>
                                <div className={styles.formula}>
                                    {lesson.formula.map((part, i) => (/^(\+|plus)$/i.test(part.text)
                                        ? <span key={i} className={styles.plus}>+</span>
                                        : <span key={i} className={`${styles.block} ${part.grammar ? `${styles.blockGrammar} ${font}` : ''}`}>{part.text}</span>))}
                                </div>
                                {lesson.formulaNote && <p className={styles.muted} style={{ textAlign: 'center' }}>{lesson.formulaNote}</p>}
                            </div>
                        </>
                    )}

                    {screen === 'examples' && (
                        <>
                            {say('speak', 'Here it is in real sentences. Read each one out loud.')}
                            <div className={styles.examples}>
                                {lesson.examples.map((e) => (
                                    <div key={e.sentence} className={styles.example}>
                                        <p className={`${styles.exampleSentence} ${font}`} lang={point.language}>{e.sentence}</p>
                                        <p className={styles.exampleTranslation}>{e.translation}</p>
                                        {e.note && <p className={styles.exampleNote}>{e.note}</p>}
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {screen === 'mine' && (
                        <>
                            {say('wave', 'Now with words you saved. These are yours, so they stick better.')}
                            <div className={styles.examples}>
                                {mine.map((e) => (
                                    <div key={e.sentence} className={styles.example}>
                                        <p className={`${styles.exampleSentence} ${font}`} lang={point.language}>
                                            <Highlight text={e.sentence} words={e.words} className={styles.mine} />
                                        </p>
                                        <p className={styles.exampleTranslation}>{e.translation}</p>
                                    </div>
                                ))}
                            </div>
                        </>
                    )}

                    {screen === 'mistake' && (
                        <>
                            {say('think', 'Watch out for this one. Learners mix it up all the time.')}
                            <div className={styles.card}>
                                <div className={styles.mistakeRow}>
                                    <span className={styles.wrongMark} aria-label="Wrong">✕</span>
                                    <p className={`${styles.exampleSentence} ${styles.strike} ${font}`} lang={point.language}>{lesson.mistake.wrong}</p>
                                    <span className={styles.rightMark} aria-label="Right">✓</span>
                                    <p className={`${styles.exampleSentence} ${font}`} lang={point.language}>{lesson.mistake.right}</p>
                                </div>
                                <p className={styles.exampleNote}>{lesson.mistake.why}</p>
                            </div>
                        </>
                    )}

                    {screen === 'check' && (
                        <div className={styles.quiz}>
                            {say('teach', lesson.check.question)}
                            <div className={`${styles.options} ${styles.optionsStack}`}>
                                {lesson.check.options.map((option) => {
                                    let cls = styles.option;
                                    if (picked !== null && option === lesson.check.answer) cls += ` ${styles.optionRight}`;
                                    else if (picked === option) cls += ` ${styles.optionWrong}`;
                                    return (
                                        <button key={option} type="button" className={`${cls} ${font}`} disabled={picked !== null} onClick={() => setPicked(option)}>
                                            {option}
                                        </button>
                                    );
                                })}
                            </div>
                            {picked !== null && (
                                <div className={`${styles.feedback} ${picked === lesson.check.answer ? '' : styles.feedbackWrong}`} role="status">
                                    <strong>{picked === lesson.check.answer ? 'Correct!' : 'Not quite'}</strong>
                                    <p>{lesson.check.explanation}</p>
                                </div>
                            )}
                        </div>
                    )}

                    {screen === 'done' && (
                        <div className={`${styles.card} ${styles.celebrate}`}>
                            <Tiger pose="celebrate" size={130} motion="hop" />
                            <h2>Lesson done!</h2>
                            <p className={styles.muted}>
                                <span className={font}>{point.form}</span> is on your path. Try a few questions now, and it will come back in Review so you keep it.
                            </p>
                            <div className={styles.actions} style={{ justifyContent: 'center' }}>
                                <Link href="/my-grammar" className={styles.ghost}>Back to my grammar</Link>
                                <Link href={`/my-grammar/practice?id=${grammarId}`} className={styles.press}>Practice now</Link>
                            </div>
                            {guide && <Link href={guide.href} className={styles.chipLink}>Read the full guide →</Link>}
                        </div>
                    )}

                    {screen && screen !== 'done' && (
                        <div className={styles.lessonFoot}>
                            <button
                                type="button"
                                className={styles.press}
                                onClick={next}
                                disabled={screen === 'check' && picked === null}
                            >
                                {screen === 'check' ? 'Finish' : 'Continue'}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </Dashboard>
    );
};

export default GrammarLesson;
