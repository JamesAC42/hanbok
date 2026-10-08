'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import useCardsToday from '@/hooks/useCardsToday';
import Mascot from '@/components/Mascot';
import GoogleSignInButton from '@/components/GoogleSignInButton';
import { loginHref } from '@/lib/anonSentences';
import Tiger from '@/components/Tiger';
import { Fa6SolidParagraph } from '@/components/icons/Paragraph';
import { markStage } from '@/lib/todayLoop';
import styles from '@/styles/components/sentenceanalyzer/nextsteps.module.scss';

const plural = (n, word, many = `${word}s`) => `${n} ${n === 1 ? word : many}`;

// The Keep step: pick the new words from this sentence and turn them into
// flashcards in one press.
const KeepBox = ({ user, words, unsavedWords, savedLoading, addingAll, saveAll, cardsToday, onKept }) => {
    const [unchecked, setUnchecked] = useState(() => new Set());
    const savedCount = words.length - unsavedWords.length;
    const chosen = useMemo(
        () => unsavedWords.filter(word => !unchecked.has(word.originalWord)),
        [unsavedWords, unchecked]
    );

    const toggle = (word) => setUnchecked(prev => {
        const next = new Set(prev);
        if (next.has(word.originalWord)) next.delete(word.originalWord);
        else next.add(word.originalWord);
        return next;
    });

    const keep = async () => {
        const count = chosen.length;
        await saveAll(chosen);
        markStage('keep');
        onKept(count);
    };

    if (!user) {
        return (
            <section className={styles.keep}>
                <h3 className={styles.keepTitle}>Save this breakdown</h3>
                <p className={styles.keepText}>
                    Make a free account to keep this sentence in your Library and turn its
                    {words.length ? ` ${plural(words.length, 'word')}` : ' words'} into flashcards.
                    Free accounts get 10 breakdowns a week. No card needed.
                </p>
                <div className={styles.keepGoogle}>
                    <GoogleSignInButton text="signup_with" />
                </div>
                <Link href={loginHref(true)} className={styles.keepEmail}>Sign up with email</Link>
            </section>
        );
    }

    if (savedLoading) {
        return <section className={styles.keep}><p className={styles.keepText}>Checking your flashcards…</p></section>;
    }

    if (unsavedWords.length === 0) {
        return (
            <section className={`${styles.keep} ${styles.keepDone}`}>
                <h3 className={styles.keepTitle}>All {plural(words.length, 'word')} kept</h3>
                <p className={styles.keepText}>
                    Every word in this sentence is in your flashcards.
                    {cardsToday ? ` ${plural(cardsToday, 'card is', 'cards are')} ready for review today.` : ''}
                </p>
                <Link href="/cards" className={styles.reviewButton}>
                    {cardsToday ? `Review ${plural(cardsToday, 'card')}` : 'Open flashcards'}
                </Link>
            </section>
        );
    }

    return (
        <section className={styles.keep}>
            <h3 className={styles.keepTitle}>
                Keep {plural(unsavedWords.length, 'new word')}
            </h3>
            <p className={styles.keepText}>
                {savedCount > 0
                    ? `${savedCount} ${savedCount === 1 ? 'is' : 'are'} already in your flashcards. Untick any you already know.`
                    : 'They become flashcards. Untick any you already know.'}
            </p>
            <ul className={styles.checklist}>
                {unsavedWords.map(word => (
                    <li key={word.originalWord}>
                        <label className={styles.check}>
                            <input
                                type="checkbox"
                                checked={!unchecked.has(word.originalWord)}
                                onChange={() => toggle(word)}
                                disabled={addingAll}
                            />
                            <span className={styles.checkWord}>{word.originalWord}</span>
                            <span className={styles.checkGloss}>{word.translatedWord}</span>
                        </label>
                    </li>
                ))}
            </ul>
            <button
                type="button"
                className={styles.keepButton}
                onClick={keep}
                disabled={addingAll || chosen.length === 0}
            >
                {addingAll ? 'Keeping…' : chosen.length === 0 ? 'Pick a word to keep' : `Keep ${plural(chosen.length, 'word')}`}
            </button>
        </section>
    );
};

const NextSteps = ({ sentenceId, words, unsavedWords, savedLoading, addingAll, saveAll, className = '', compact = false, showParagraphLink = true }) => {
    const { user } = useAuth();
    const savedCount = words.length - unsavedWords.length;
    // Refetch after saving words, since new cards change today's count.
    const cardsToday = useCardsToday(!!user && !addingAll, savedCount);
    const [toast, setToast] = useState(null);

    useEffect(() => {
        if (!toast) return;
        const timer = setTimeout(() => setToast(null), 2800);
        return () => clearTimeout(timer);
    }, [toast]);

    return (
        <section className={`${styles.nextSteps} ${className}`} aria-label="Next steps">
            {!compact && (
                <div className={styles.railHead}>
                    <Mascot pose="point" size={88} />
                    <p className={styles.bubble}>
                        Tap any word to see what it means and how it is built.
                    </p>
                </div>
            )}

            <KeepBox
                user={user}
                words={words}
                unsavedWords={unsavedWords}
                savedLoading={savedLoading}
                addingAll={addingAll}
                saveAll={saveAll}
                cardsToday={cardsToday}
                onKept={(count) => count && setToast(`${plural(count, 'word')} added to your flashcards!`)}
            />

            {sentenceId && (
                <Link href={`/tutor?sentenceId=${sentenceId}`} className={styles.alt}>
                    <Tiger size={48} />
                    <span>
                        <b>Ask Horangi about this sentence</b>
                        <small>Why is it built this way? How else could I say it?</small>
                    </span>
                </Link>
            )}
            {showParagraphLink && (
                <Link href="/extended-text" className={styles.alt}>
                    <span className={styles.altIcon}><Fa6SolidParagraph /></span>
                    <span>
                        <b>Read a whole paragraph</b>
                        <small>Paste the text around this sentence to read it in context.</small>
                    </span>
                </Link>
            )}

            {toast && <div className={styles.toast} role="status">{toast}</div>}
        </section>
    );
};

export default NextSteps;
