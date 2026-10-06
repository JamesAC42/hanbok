'use client';
import { useState } from 'react';
import Link from 'next/link';
import Mascot from '@/components/Mascot';
import Confetti from '@/components/celebrate/Confetti';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/styles/pages/learn.module.scss';

// A short check at the end of an article: one question at a time, instant
// feedback with the reason, then confetti and one next step.
const Quiz = ({ questions, lang = 'ko' }) => {
    const { user } = useAuth();
    const [index, setIndex] = useState(0);
    const [picked, setPicked] = useState(null);
    const [score, setScore] = useState(0);
    const done = index >= questions.length;
    const q = questions[index];

    const pick = (i) => {
        if (picked !== null) return;
        setPicked(i);
        if (i === q.answer) setScore((s) => s + 1);
    };

    const next = () => {
        setPicked(null);
        setIndex((i) => i + 1);
    };

    if (done) {
        return (
            <section className={`${styles.quiz} ${styles.quizDone}`} aria-live="polite">
                <Confetti />
                <Mascot pose="celebrate" size={120} motion="hop" />
                <h3>{score} of {questions.length} right!</h3>
                <p>{score === questions.length ? 'Perfect. You have this one down.' : 'Nice work. Read the examples again, then try a real sentence.'}</p>
                <div className={styles.quizActions}>
                    <Link href="/analyze" className={styles.primaryButton}>Break down a sentence</Link>
                    {!user && <Link href="/login" className={styles.ghostButton}>Save your progress</Link>}
                    <button type="button" className={styles.ghostButton} onClick={() => { setIndex(0); setScore(0); }}>
                        Try again
                    </button>
                </div>
            </section>
        );
    }

    return (
        <section className={styles.quiz} aria-live="polite">
            <div className={styles.quizHead}>
                <Mascot pose="think" size={56} />
                <span className={styles.label}>Quick check · {index + 1} of {questions.length}</span>
            </div>
            <div className={styles.quizBar}><i style={{ width: `${(index / questions.length) * 100}%` }} /></div>
            <p className={styles.quizPrompt} lang={lang}>{q.prompt}</p>
            {q.hint && <p className={styles.quizHint}>{q.hint}</p>}
            <div className={styles.quizChoices}>
                {q.choices.map((c, i) => {
                    const state = picked === null ? '' : i === q.answer ? styles.right : i === picked ? styles.wrong : styles.dim;
                    return (
                        <button key={i} type="button" lang={lang} className={`${styles.choice} ${state}`} onClick={() => pick(i)}>
                            {c}
                        </button>
                    );
                })}
            </div>
            {picked !== null && (
                <div className={`${styles.quizFeedback} ${picked === q.answer ? styles.right : styles.wrong}`}>
                    <strong>{picked === q.answer ? 'Correct!' : 'Not quite.'}</strong> {q.why}
                    <button type="button" className={styles.primaryButton} onClick={next}>
                        {index + 1 < questions.length ? 'Next' : 'Finish'}
                    </button>
                </div>
            )}
        </section>
    );
};

export default Quiz;
