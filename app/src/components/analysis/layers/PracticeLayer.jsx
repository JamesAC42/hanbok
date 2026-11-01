'use client';
import { useMemo, useState } from 'react';
import { buildPractice, canPractice, notePracticeStarted, PRACTICE_PER_DAY } from '@/lib/practice';
import { track } from '@/lib/analytics';
import getFontClass from '@/lib/fontClass';
import Mascot from '@/components/Mascot';
import PlusGate from '@/components/analysis/layers/PlusGate';
import styles from '@/styles/components/sentenceanalyzer/layers.module.scss';

const OrderStep = ({ ex, font, onDone }) => {
    const [picked, setPicked] = useState([]);
    const [result, setResult] = useState(null);
    const built = picked.map(i => ex.tiles[i]);

    const check = () => {
        const ok = built.join(' ') === ex.answer.join(' ');
        setResult(ok ? 'right' : 'wrong');
    };

    return (
        <>
            <p className={styles.drillPrompt}><b>Put it in order:</b> {ex.prompt}</p>
            <div className={`${styles.slots} ${font}`} aria-label="Your answer">
                {picked.map((t, pos) => (
                    <button key={pos} type="button" className={styles.tile} disabled={!!result}
                        onClick={() => setPicked(picked.filter((_, i) => i !== pos))}>{ex.tiles[t]}</button>
                ))}
            </div>
            <div className={`${styles.tiles} ${font}`}>
                {ex.tiles.map((t, i) => (
                    <button key={i} type="button" className={styles.tile} disabled={picked.includes(i) || !!result}
                        onClick={() => setPicked([...picked, i])}>{t}</button>
                ))}
            </div>
            {result === 'wrong' && (
                <p className={styles.wrong}>Not quite. It goes: <span className={font}>{ex.answer.join(' ')}</span></p>
            )}
            {result === 'right' && <p className={styles.right}>That's it!</p>}
            <div className={styles.drillActions}>
                {result
                    ? <button type="button" className={styles.drillNext} onClick={() => onDone(result === 'right')}>Next</button>
                    : <button type="button" className={styles.drillNext} onClick={check} disabled={picked.length < ex.tiles.length}>Check</button>}
            </div>
        </>
    );
};

const ChoiceStep = ({ ex, font, onDone }) => {
    const [choice, setChoice] = useState(null);
    const done = choice !== null;
    const right = choice === ex.answer;

    return (
        <>
            {ex.kind === 'particle' ? (
                <>
                    <p className={styles.drillPrompt}><b>Pick the missing particle.</b> {ex.prompt}</p>
                    <p className={`${styles.blankLine} ${font}`}>
                        {ex.before}<span className={styles.blank}>{done ? ex.answer : ' ? '}</span>{ex.after}
                    </p>
                </>
            ) : (
                <p className={styles.drillPrompt}>
                    <b>What does <span className={font}>{ex.word}</span> mean here?</b>
                </p>
            )}
            <div className={`${styles.options} ${ex.kind === 'particle' ? font : ''}`}>
                {ex.options.map(o => (
                    <button
                        key={o}
                        type="button"
                        className={`${styles.option} ${done && o === ex.answer ? styles.optionRight : ''} ${done && o === choice && !right ? styles.optionWrong : ''}`}
                        disabled={done}
                        onClick={() => setChoice(o)}
                    >{o}</button>
                ))}
            </div>
            {done && (
                <p className={right ? styles.right : styles.wrong}>
                    {right ? 'Right!' : 'Not this time.'} {ex.note ? <span className={styles.muted}>{ex.note}</span> : null}
                </p>
            )}
            {done && (
                <div className={styles.drillActions}>
                    <button type="button" className={styles.drillNext} onClick={() => onDone(right)}>Next</button>
                </div>
            )}
        </>
    );
};

// "Practice it": a one-minute drill made from this sentence.
const PracticeLayer = ({ analysis, language, sentenceKey, tier }) => {
    const exercises = useMemo(() => buildPractice(analysis, language), [analysis, language]);
    const [started, setStarted] = useState(false);
    const [step, setStep] = useState(0);
    const [score, setScore] = useState(0);
    const [round, setRound] = useState(0);
    const allowed = canPractice(tier, sentenceKey);
    const font = getFontClass(language);

    if (!exercises.length) {
        return <div className={styles.layerBody}><p className={styles.muted}>This sentence is too short to practice. Try a longer one.</p></div>;
    }

    const start = () => {
        notePracticeStarted(sentenceKey);
        track('practice_start', { language, steps: exercises.length });
        setStarted(true);
        setStep(0);
        setScore(0);
        setRound(r => r + 1);
    };

    const next = (ok) => {
        const total = score + (ok ? 1 : 0);
        setScore(total);
        if (step + 1 >= exercises.length) track('practice_complete', { language, score: total, steps: exercises.length });
        setStep(step + 1);
    };

    if (!started) {
        if (!allowed) {
            const perDay = PRACTICE_PER_DAY[tier] ?? 1;
            return (
                <div className={styles.layerBody}>
                    <PlusGate layer="practice" title={`You've used today's ${perDay === 1 ? 'free practice' : `${perDay} practices`}`}>
                        Plus lets you practice every sentence you analyze, as often as you like.
                    </PlusGate>
                </div>
            );
        }
        return (
            <div className={`${styles.layerBody} ${styles.practiceIntro}`}>
                <p className={styles.layerLead}>
                    A quick drill made from this sentence: {exercises.length} {exercises.length === 1 ? 'question' : 'questions'}, about a minute.
                </p>
                <button type="button" className={styles.startButton} onClick={start}>Start practice</button>
                {tier < 2 && <small className={styles.muted}>Free: {PRACTICE_PER_DAY[tier] ?? 1} a day. Plus: unlimited.</small>}
            </div>
        );
    }

    if (step >= exercises.length) {
        return (
            <div className={`${styles.layerBody} ${styles.practiceDone}`}>
                <Mascot pose="celebrate" size={84} />
                <div>
                    <b className={styles.doneTitle}>{score} of {exercises.length} right</b>
                    <p className={styles.muted}>{score === exercises.length ? 'Perfect. This sentence is yours now.' : 'Run it again to lock it in.'}</p>
                    <button type="button" className={styles.againButton} onClick={start}>Practice again</button>
                </div>
            </div>
        );
    }

    const ex = exercises[step];
    return (
        <div className={styles.layerBody}>
            <div className={styles.steps} aria-label={`Question ${step + 1} of ${exercises.length}`}>
                {exercises.map((_, i) => <i key={i} className={i < step ? styles.stepDone : i === step ? styles.stepNow : ''} />)}
            </div>
            {ex.kind === 'order'
                ? <OrderStep key={`${round}-${step}`} ex={ex} font={font} onDone={next} />
                : <ChoiceStep key={`${round}-${step}`} ex={ex} font={font} onDone={next} />}
        </div>
    );
};

export default PracticeLayer;
