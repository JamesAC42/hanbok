'use client';
import styles from '@/styles/components/sentenceanalyzer/sentencenotes.module.scss';

const SentenceNotes = ({analysis}) => {
    return (
        


        <div className={styles.sentenceNotes}>
            <div className={styles.sentenceNotesHeader}>
                About the Sentence
            </div>
            <div className={styles.sentenceNotesGrid}>
            {analysis.sentence.formality && (
                <>
                <div className={styles.sentenceNoteLabel}>
                    Formality:
                </div>
                <div className={styles.sentenceNoteValue}>
                    {analysis.sentence.formality}
                </div>
                </>
            )}
            {analysis.sentence.context && (
                <>
                <div className={styles.sentenceNoteLabel}>
                    Example Context:
                </div>
                <div className={styles.sentenceNoteValue}>
                    {analysis.sentence.context}
                </div>
                </>
            )}
            </div>
        </div>
    )

}

export default SentenceNotes;
