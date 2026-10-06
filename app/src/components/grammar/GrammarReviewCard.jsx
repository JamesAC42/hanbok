'use client';
import { useState } from 'react';
import Link from 'next/link';
import QuizQuestion from '@/components/grammar/QuizQuestion';
import Tiger from '@/components/Tiger';
import getFontClass from '@/lib/fontClass';
import { useGrammarGuides, findGuide } from '@/lib/grammarGuides';
import styles from '@/styles/components/grammar.module.scss';

const recordAnswer = (answer) => {
    fetch('/api/grammar/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: [{ ...answer, context: 'review' }] }),
    }).catch(() => {});
};

// A saved grammar point inside a Review session: one quiz question built from
// the learner's words, or a flip card once the day's free questions are used.
// `onRate` takes the same ratings as word cards, so scheduling is shared.
const GrammarReviewCard = ({ card, onRate, disabled }) => {
    const content = card.content || {};
    const language = content.originalLanguage || 'ko';
    const font = getFontClass(language);
    const [revealed, setRevealed] = useState(false);
    const guides = useGrammarGuides();
    const guide = findGuide(guides, content.form, language);

    if (content.mode === 'quiz' && content.item) {
        return (
            <div className={styles.reviewCard}>
                <QuizQuestion
                    question={{ form: content.form, language, item: content.item }}
                    onDone={(correct) => {
                        recordAnswer({ grammarId: content.grammarId, itemId: content.item.itemId, correct });
                        onRate(correct ? 'good' : 'again');
                    }}
                />
            </div>
        );
    }

    const rate = (rating) => {
        recordAnswer({ grammarId: content.grammarId, correct: rating !== 'again' });
        setRevealed(false);
        onRate(rating);
    };

    return (
        <div className={styles.reviewCard}>
            <div className={styles.reviewHead}>
                <span className={`${styles.pill} ${styles.pillUnd}`}>Grammar</span>
                {guide && <Link href={guide.href} className={styles.chipLink} target="_blank">Full guide</Link>}
            </div>
            <div className={styles.flipFront}>
                <span className={styles.label}>What does this grammar mean?</span>
                <p className={`${styles.flipForm} ${font}`} lang={language}>{content.form}</p>
            </div>
            {revealed ? (
                <div className={styles.flipBack}>
                    <p className={styles.pointName}>{content.name}</p>
                    {content.explanation && <p className={styles.muted}>{content.explanation}</p>}
                    {content.example?.text && (
                        <div className={styles.example}>
                            <p className={`${styles.exampleSentence} ${font}`} lang={language}>{content.example.text}</p>
                            {content.example.translation && <p className={styles.exampleTranslation}>{content.example.translation}</p>}
                        </div>
                    )}
                    <div className={styles.actions}>
                        <button type="button" className={styles.ghost} onClick={() => rate('again')} disabled={disabled}>Missed it</button>
                        <button type="button" className={styles.press} onClick={() => rate('good')} disabled={disabled}>Got it</button>
                    </div>
                </div>
            ) : (
                <button type="button" className={`${styles.press} ${styles.wide}`} onClick={() => setRevealed(true)}>
                    Show answer
                </button>
            )}
            {content.quizLimited && (
                <div className={styles.upsell}>
                    <Tiger pose="head" size={34} label="" />
                    <span>That was today&apos;s free quiz practice, so this one is a flip card. <Link href="/pricing">Basic</Link> gives you a quiz for every grammar card.</span>
                </div>
            )}
        </div>
    );
};

export default GrammarReviewCard;
