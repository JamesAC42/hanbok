'use client';
import styles from '@/styles/components/sentenceanalyzer/sentencenotes.module.scss';
import { useLanguage } from '@/contexts/LanguageContext';

const SentenceNotes = ({analysis}) => {
    const { t } = useLanguage();
    
    return (
        <div className={styles.sentenceNotes}>
            <div className={styles.sentenceNotesHeader}>
                {t('analysis.sentenceNotes.title')}
            </div>
            <div className={styles.sentenceNotesGrid}>
            {analysis.sentence.formality && (
                <>
                <div className={styles.sentenceNoteLabel}>
                    {t('analysis.sentenceNotes.formality')}
                </div>
                <div className={styles.sentenceNoteValue}>
                    {analysis.sentence.formality}
                </div>
                </>
            )}
            {analysis.sentence.context && (
                <>
                <div className={styles.sentenceNoteLabel}>
                    {t('analysis.sentenceNotes.context')}
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
