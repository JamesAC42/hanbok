'use client';
import getFontClass from '@/lib/fontClass';
import styles from '@/styles/components/sentenceanalyzer/streamingpreview.module.scss';

// While the analysis is still being written: the translation and each word
// as soon as it is ready, so the wait shows progress instead of a spinner.
// `status` replaces the dots once the analysis is complete and its page is opening.
const StreamingPreview = ({ analysis, language, original, status }) => {
    const words = analysis?.components || [];
    const translation = analysis?.sentence?.translation;
    return (
        <div className={styles.preview} aria-live="polite">
            <p className={`${styles.original} ${getFontClass(language)}`}>{analysis?.sentence?.original || original}</p>
            {translation
                ? <p className={styles.translation}>{translation}</p>
                : <p className={styles.placeholder} aria-hidden="true" />}
            <div className={styles.words}>
                {words.filter(w => w.type !== 'punctuation').map((w, i) => (
                    <span key={`${w.text}-${i}`} className={styles.word} data-role={String(w.type || '').toLowerCase()}>
                        <b className={getFontClass(language)}>{w.text}</b>
                        {w.meaning?.description && <small>{w.meaning.description}</small>}
                    </span>
                ))}
                {status
                    ? <span className={styles.status} role="status">{status}</span>
                    : <span className={styles.more} aria-label="Still analyzing">
                        <i /><i /><i />
                    </span>}
            </div>
        </div>
    );
};

export default StreamingPreview;
