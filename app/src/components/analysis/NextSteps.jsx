'use client';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import useCardsToday from '@/hooks/useCardsToday';
import { PhCardsFill } from '@/components/icons/CardsFill';
import { MaterialSymbolsChatBubbleOutline } from '@/components/icons/ChatBubble';
import { Fa6SolidParagraph } from '@/components/icons/Paragraph';
import styles from '@/styles/components/sentenceanalyzer/nextsteps.module.scss';

const Step = ({ icon, title, children, href, onClick, disabled, highlight }) => {
    const body = (
        <>
            <span className={styles.icon} aria-hidden="true">{icon}</span>
            <span className={styles.text}>
                <span className={styles.title}>{title}</span>
                {children && <span className={styles.detail}>{children}</span>}
            </span>
        </>
    );
    const className = `${styles.step} ${highlight ? styles.highlight : ''}`;
    if (href) {
        return <Link href={href} className={className}>{body}</Link>;
    }
    return (
        <button type="button" className={className} onClick={onClick} disabled={disabled}>
            {body}
        </button>
    );
};

const NextSteps = ({ sentenceId, words, unsavedWords, savedLoading, addingAll, saveAll, className = '' }) => {
    const { user } = useAuth();
    const savedCount = words.length - unsavedWords.length;
    // Refetch after saving words, since new cards change today's count.
    const cardsToday = useCardsToday(!!user && !addingAll, savedCount);

    let flashcardStep;
    if (!user) {
        flashcardStep = (
            <Step icon={<PhCardsFill />} title="Turn these words into flashcards" href="/login" highlight>
                Sign in to save words and review them later.
            </Step>
        );
    } else if (!savedLoading && unsavedWords.length > 0) {
        flashcardStep = (
            <Step
                icon={<PhCardsFill />}
                title={addingAll ? 'Adding words…' : `Add ${unsavedWords.length} new ${unsavedWords.length === 1 ? 'word' : 'words'} to Flashcards`}
                onClick={saveAll}
                disabled={addingAll}
                highlight
            >
                {savedCount > 0
                    ? `${savedCount} ${savedCount === 1 ? 'is' : 'are'} already in your deck.`
                    : 'Review them with spaced repetition so they stick.'}
            </Step>
        );
    } else {
        flashcardStep = (
            <Step icon={<PhCardsFill />} title="Study your flashcards" href="/cards" highlight>
                {cardsToday
                    ? `${cardsToday} ${cardsToday === 1 ? 'card' : 'cards'} ready today. Every word here is in your deck.`
                    : 'Every word in this sentence is in your deck.'}
            </Step>
        );
    }

    return (
        <section className={`${styles.nextSteps} ${className}`} aria-label="Next steps">
            <h3 className={styles.heading}>Next steps</h3>
            {flashcardStep}
            {sentenceId && (
                <Step
                    icon={<MaterialSymbolsChatBubbleOutline />}
                    title="Ask the tutor about this sentence"
                    href={`/tutor?sentenceId=${sentenceId}`}
                >
                    Ask why it's built this way or how to say it differently.
                </Step>
            )}
            <Step icon={<Fa6SolidParagraph />} title="Analyze a whole paragraph" href="/extended-text">
                Paste the text around this sentence to read it in context.
            </Step>
            {user && unsavedWords.length > 0 && cardsToday ? (
                <Link href="/cards" className={styles.footerLink}>
                    {cardsToday} {cardsToday === 1 ? 'card' : 'cards'} ready to study today →
                </Link>
            ) : null}
        </section>
    );
};

export default NextSteps;
