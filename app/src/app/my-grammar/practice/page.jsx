'use client';
import { Suspense, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import Dashboard from '@/components/Dashboard';
import Tiger from '@/components/Tiger';
import QuizQuestion from '@/components/grammar/QuizQuestion';
import UpgradeSheet from '@/components/grammar/UpgradeSheet';
import { track } from '@/lib/analytics';
import { markStage } from '@/lib/todayLoop';
import styles from '@/styles/components/grammar.module.scss';

// A short run of quiz questions from the path: one point (?id=) or a mix of
// the learner's weakest points.
const Practice = () => {
    const params = useSearchParams();
    const grammarId = params.get('id');
    const router = useRouter();
    const { isAuthenticated, loading } = useAuth();
    const [questions, setQuestions] = useState(null);
    const [index, setIndex] = useState(0);
    const [right, setRight] = useState(0);
    const [limited, setLimited] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!loading && !isAuthenticated) router.replace('/login');
        document.title = 'Hanbok - Grammar practice';
    }, [loading, isAuthenticated, router]);

    useEffect(() => {
        if (!isAuthenticated) return;
        fetch('/api/grammar/practice', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(grammarId ? { grammarId: Number(grammarId) } : {}),
        })
            .then((res) => res.json())
            .then((json) => {
                if (!json.success) throw new Error(json.error);
                if (json.limited) setLimited(true);
                setQuestions(json.questions);
                if (json.questions.length) track('grammar_practice_start', { single: !!grammarId });
            })
            .catch((e) => setError(e.message || 'Horangi could not make your questions right now. Try again in a minute.'));
    }, [isAuthenticated, grammarId]);

    const onDone = useCallback((correct) => {
        const q = questions[index];
        fetch('/api/grammar/answers', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ answers: [{ grammarId: q.grammarId, itemId: q.item.itemId, correct, context: 'path' }] }),
        }).catch(() => {});
        markStage('review');
        if (correct) setRight((n) => n + 1);
        setIndex((i) => i + 1);
    }, [questions, index]);

    if (loading || !isAuthenticated) return null;

    const back = grammarId ? `/my-grammar/${grammarId}` : '/my-grammar';
    const total = questions?.length || 0;
    const finished = questions && index >= total;
    const pct = total ? Math.round((index / total) * 100) : 0;

    return (
        <Dashboard>
            <div className={styles.page}>
                <div className={`${styles.inner} ${styles.narrow}`}>
                    <div className={styles.lessonTop}>
                        <Link href={back} className={styles.closeButton} aria-label="Stop practice">✕</Link>
                        <div className={styles.progress} role="progressbar" aria-valuemin={0} aria-valuemax={100} aria-valuenow={pct}>
                            <i style={{ width: `${Math.max(pct, 4)}%` }} />
                        </div>
                    </div>

                    {error && <p className={styles.error}>{error}</p>}
                    {!questions && !error && (
                        <div className={styles.loading}>
                            <Tiger pose="study" size={90} motion="bob" />
                            Horangi is writing questions with your words…
                        </div>
                    )}

                    {questions && !finished && (
                        <div className={styles.card}>
                            <QuizQuestion
                                question={questions[index]}
                                onDone={onDone}
                                continueLabel={index + 1 === total ? 'Finish' : 'Continue'}
                            />
                        </div>
                    )}

                    {finished && total > 0 && (
                        <div className={`${styles.card} ${styles.celebrate}`}>
                            <Tiger pose={right >= total / 2 ? 'celebrate' : 'think'} size={130} motion="hop" />
                            <h2>{right} of {total} right</h2>
                            <p className={styles.muted}>
                                {right === total ? 'Perfect run. ' : ''}These points come back in Review right before you would forget them.
                            </p>
                            <div className={styles.actions} style={{ justifyContent: 'center' }}>
                                <Link href="/my-grammar" className={styles.ghost}>Back to my grammar</Link>
                                <Link href="/analyze" className={styles.pressRead}>Read something new</Link>
                            </div>
                        </div>
                    )}

                    {finished && total === 0 && !limited && (
                        <div className={`${styles.card} ${styles.celebrate}`}>
                            <Tiger pose="think" size={110} />
                            <h2>No questions yet</h2>
                            <p className={styles.muted}>Save a grammar point from a sentence first, then come back to practice it.</p>
                            <Link href="/analyze" className={styles.pressRead}>Analyze a sentence</Link>
                        </div>
                    )}

                    {limited && <UpgradeSheet reason="quiz" onClose={() => router.push(back)} />}
                </div>
            </div>
        </Dashboard>
    );
};

const PracticePage = () => (
    <Suspense fallback={null}>
        <Practice />
    </Suspense>
);

export default PracticePage;
