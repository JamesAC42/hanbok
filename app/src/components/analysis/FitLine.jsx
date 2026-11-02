'use client';
import { useAuth } from '@/contexts/AuthContext';
import { useEncounters, fitSummary } from '@/lib/encounters';
import styles from '@/styles/components/sentenceanalyzer/encounters.module.scss';

// "Just right for you · 2 new words, 1 new grammar point", from the learner's
// own history. Shown once they have analyzed a handful of sentences.
const FitLine = ({ sentenceId }) => {
    const { user } = useAuth();
    const data = useEncounters(sentenceId, !!user);
    const fit = fitSummary(data?.fit);
    if (!fit) return null;
    const newWords = data.fit.newWords || [];
    return (
        <p className={`${styles.fit} ${styles[`fit_${fit.verdict}`]}`}>
            <b>{fit.headline}</b>
            <span>{fit.detail}</span>
            {newWords.length > 0 && newWords.length <= 4 && (
                <span className={styles.fitWords} lang="ko">{newWords.join(', ')}</span>
            )}
        </p>
    );
};

export default FitLine;
