'use client';
import { useEffect, useMemo, useState } from 'react';
import getFontClass from '@/lib/fontClass';
import styles from '@/styles/components/grammar.module.scss';

const PROMPTS = {
    fill_gap: 'Pick the form that fits.',
    meaning: 'What does this sentence mean?',
    pick_correct: 'Which sentence is correct?',
    build: 'Put the words in order.',
};

const PRAISE = ['Correct!', 'Nice one!', 'Exactly right!', 'You got it!'];

// One practice question. Tap answers are checked right here; `onDone(correct)`
// fires when the learner presses Continue.
const QuizQuestion = ({ question, onDone, continueLabel = 'Continue' }) => {
    const { item, form, language } = question;
    const font = getFontClass(language);
    const [picked, setPicked] = useState(null);
    const [placed, setPlaced] = useState([]);
    const [checked, setChecked] = useState(null);

    useEffect(() => {
        setPicked(null);
        setPlaced([]);
        setChecked(null);
    }, [item.itemId]);

    const praise = useMemo(() => PRAISE[Math.floor(Math.random() * PRAISE.length)], [item.itemId]);
    const answered = checked !== null;

    const choose = (option) => {
        if (answered) return;
        setPicked(option);
        setChecked(option === item.answer);
    };

    const checkBuild = () => {
        const sentence = placed.map((i) => item.tiles[i]).join(' ');
        setChecked(sentence === item.answer);
    };

    // Enter continues once answered, so keyboard users can move quickly.
    useEffect(() => {
        if (!answered) return undefined;
        const onKey = (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                onDone(checked);
            }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [answered, checked, onDone]);

    const optionClass = (option) => {
        if (!answered) return styles.option;
        if (option === item.answer) return `${styles.option} ${styles.optionRight}`;
        if (option === picked) return `${styles.option} ${styles.optionWrong}`;
        return styles.option;
    };

    const targetLanguageOptions = item.type === 'fill_gap' || item.type === 'pick_correct';

    return (
        <div className={styles.quiz}>
            <span className={`${styles.pill} ${styles.pillUnd} ${styles.quizTag}`}>
                Grammar · <span className={styles.form}>{form}</span>
            </span>
            <p className={styles.quizPrompt}>
                {item.type === 'pick_correct' ? <>Which sentence uses <span className={styles.form}>{form}</span> correctly?</> : PROMPTS[item.type]}
            </p>

            {item.type === 'fill_gap' && (
                <>
                    <p className={`${styles.quizSentence} ${font}`} lang={language}>
                        {item.before}
                        <span className={styles.gap}>{answered ? item.answer : (picked || ' ')}</span>
                        {item.after}
                    </p>
                    <p className={styles.quizHint}>{item.translation}</p>
                </>
            )}
            {item.type === 'meaning' && (
                <p className={`${styles.quizSentence} ${font}`} lang={language}>{item.sentence}</p>
            )}
            {item.type === 'build' && (
                <>
                    <p className={styles.quizHint}>{item.translation}</p>
                    <div className={styles.answerLine} aria-label="Your sentence">
                        {placed.map((tileIndex, i) => (
                            <button
                                key={`${tileIndex}-${i}`}
                                type="button"
                                className={`${styles.tile} ${font}`}
                                onClick={() => !answered && setPlaced(placed.filter((_, j) => j !== i))}
                                disabled={answered}
                                lang={language}
                            >
                                {item.tiles[tileIndex]}
                            </button>
                        ))}
                    </div>
                    <div className={styles.tiles}>
                        {item.tiles.map((tile, i) => (
                            <button
                                key={`${tile}-${i}`}
                                type="button"
                                className={`${styles.tile} ${placed.includes(i) ? styles.tileUsed : ''} ${font}`}
                                onClick={() => setPlaced([...placed, i])}
                                disabled={answered || placed.includes(i)}
                                lang={language}
                            >
                                {tile}
                            </button>
                        ))}
                    </div>
                </>
            )}

            {item.options && (
                <div className={`${styles.options} ${item.type !== 'fill_gap' ? styles.optionsStack : ''}`}>
                    {item.options.map((option) => (
                        <button
                            key={option}
                            type="button"
                            className={`${optionClass(option)} ${targetLanguageOptions ? `${styles.optionKo} ${font}` : ''}`}
                            onClick={() => choose(option)}
                            disabled={answered}
                            lang={targetLanguageOptions ? language : undefined}
                        >
                            {option}
                        </button>
                    ))}
                </div>
            )}

            {answered ? (
                <div className={`${styles.feedback} ${checked ? '' : styles.feedbackWrong}`} role="status">
                    <strong>{checked ? praise : 'Not quite'}</strong>
                    {!checked && (
                        <p>
                            Answer: <span className={`${styles.correctAnswer} ${item.type === 'meaning' ? '' : font}`}>{item.answer}</span>
                        </p>
                    )}
                    {item.type !== 'fill_gap' && item.type !== 'build' && item.type !== 'meaning' && (
                        <p className={styles.quizHint} style={{ textAlign: 'left' }}>{item.translation}</p>
                    )}
                    {item.explanation && <p>{item.explanation}</p>}
                    {item.words?.length > 0 && (
                        <div className={styles.wordsUsed}>
                            Your words:
                            {item.words.map((w) => <span key={w} className={`${styles.mine} ${font}`}>{w}</span>)}
                        </div>
                    )}
                    <button type="button" className={`${checked ? styles.press : styles.pressRead} ${styles.wide}`} onClick={() => onDone(checked)}>
                        {continueLabel}
                    </button>
                </div>
            ) : item.type === 'build' ? (
                <button
                    type="button"
                    className={`${styles.press} ${styles.wide}`}
                    onClick={checkBuild}
                    disabled={placed.length !== item.tiles.length}
                >
                    Check
                </button>
            ) : null}
        </div>
    );
};

export default QuizQuestion;
