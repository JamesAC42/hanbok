'use client';
import { useEffect, useState } from 'react';
import Mascot from '@/components/Mascot';
import { useLanguage } from '@/contexts/LanguageContext';
import { track } from '@/lib/analytics';
import styles from '@/styles/components/reader/quiz.module.scss';

// A short comprehension check on the passage, one question at a time.
const PassageQuiz = ({ quiz, onClose, onShowSentence, translationLanguage }) => {
    const { t } = useLanguage();
    const [step, setStep] = useState(0);
    const [picked, setPicked] = useState(null);
    const [score, setScore] = useState(0);
    const done = step >= quiz.length;
    const question = quiz[step];

    useEffect(() => {
        const onKey = (event) => {
            if (event.key === 'Escape') onClose();
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    useEffect(() => {
        if (done) track('passage_quiz_done', { score, total: quiz.length });
    }, [done, score, quiz.length]);

    const choose = (index) => {
        if (picked !== null) return;
        setPicked(index);
        if (index === question.answer) setScore((s) => s + 1);
    };

    const next = () => {
        setPicked(null);
        setStep((s) => s + 1);
    };

    const restart = () => {
        setPicked(null);
        setScore(0);
        setStep(0);
    };

    return (
        <div className={styles.backdrop} onClick={onClose}>
            <div className={styles.dialog} role="dialog" aria-modal="true" aria-label={t('reader.quiz_title')} onClick={(e) => e.stopPropagation()} lang={translationLanguage}>
                <div className={styles.top}>
                    <div className={styles.bar} aria-hidden="true"><span style={{ width: `${(Math.min(step, quiz.length) / quiz.length) * 100}%` }} /></div>
                    <button type="button" className={styles.close} onClick={onClose} aria-label={t('extended_text.close')}>
                        <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
                    </button>
                </div>

                {done ? (
                    <div className={styles.result}>
                        <Mascot pose={score === quiz.length ? 'celebrate' : 'think'} size={120} motion="hop" />
                        <h2>{score === quiz.length ? t('reader.quiz_perfect') : t('reader.quiz_score', { score, total: quiz.length })}</h2>
                        <p>{score === quiz.length ? t('reader.quiz_perfect_note') : t('reader.quiz_retry_note')}</p>
                        <div className={styles.resultButtons}>
                            {score < quiz.length && <button type="button" className={styles.ghost} onClick={restart}>{t('reader.quiz_again')}</button>}
                            <button type="button" className={styles.primary} onClick={onClose}>{t('reader.quiz_done')}</button>
                        </div>
                    </div>
                ) : (
                    <>
                        <span className={styles.count}>{t('reader.question_of', { current: step + 1, total: quiz.length })}</span>
                        <h2 className={styles.question}>{question.question}</h2>
                        <div className={styles.options}>
                            {question.options.map((option, index) => {
                                const state = picked === null
                                    ? ''
                                    : index === question.answer
                                        ? styles.correct
                                        : index === picked ? styles.wrong : styles.dim;
                                return (
                                    <button key={index} type="button" className={`${styles.option} ${state}`} onClick={() => choose(index)} disabled={picked !== null && index !== picked && index !== question.answer}>
                                        <span className={styles.optionKey}>{index + 1}</span>
                                        <span>{option}</span>
                                    </button>
                                );
                            })}
                        </div>
                        {picked !== null && (
                            <div className={picked === question.answer ? styles.feedbackGood : styles.feedbackBad}>
                                <div>
                                    <strong>{picked === question.answer ? t('reader.quiz_correct') : t('reader.quiz_not_quite')}</strong>
                                    {question.explanation && <p>{question.explanation}</p>}
                                    {question.sentence && (
                                        <button type="button" className={styles.linkButton} onClick={() => onShowSentence(question.sentence - 1)}>
                                            {t('reader.quiz_show_sentence', { number: question.sentence })}
                                        </button>
                                    )}
                                </div>
                                <button type="button" className={picked === question.answer ? styles.primaryGood : styles.primaryBad} onClick={next}>
                                    {t('reader.quiz_continue')}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
};

export default PassageQuiz;
