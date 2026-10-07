import Link from 'next/link';
import getFontClass from '@/lib/fontClass';
import styles from '@/styles/components/study.module.scss';
import { sentenceHref } from '@/lib/sentenceLink';

// Splits text around the first occurrence of the word so it can be marked.
const highlight = (text, surface) => {
    const at = surface ? text.indexOf(surface) : -1;
    if (at < 0) return text;
    return (
        <>
            {text.slice(0, at)}
            <mark>{surface}</mark>
            {text.slice(at + surface.length)}
        </>
    );
};

// "Where you met this word" on the answer side of a flashcard.
const SourceSentence = ({ source, language }) => {
    if (!source?.text) return null;
    return (
        <div className={styles.sourceSentence}>
            <div className={styles.sourceLabel}>From your sentence</div>
            <div className={`${styles.sourceText} ${getFontClass(language)}`} lang={language}>
                {highlight(source.text, source.surface)}
            </div>
            {source.translation && <div className={styles.sourceTranslation}>{source.translation}</div>}
            <Link
                href={sentenceHref(source)}
                target="_blank"
                rel="noopener"
                className={styles.sourceLink}
                onClick={(e) => e.stopPropagation()}
            >
                Open the full analysis ↗
            </Link>
        </div>
    );
};

export default SourceSentence;
