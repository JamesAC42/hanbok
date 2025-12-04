'use client';
import styles from '@/styles/components/sentenceanalyzer/sentencenotes.module.scss';
import { useLanguage } from '@/contexts/LanguageContext';
import LyricalDevices from '@/components/analysis/LyricalDevices';
import CulturalNotes from '@/components/analysis/CulturalNotes';
import Variants from '@/components/analysis/Variants';

const SentenceNotes = ({analysis, originalLanguage, showPronunciation}) => {
    const { t } = useLanguage();
    
    return (
        <div className={styles.sentenceNotesContainer}>
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

            {/* Lyrical Devices */}
            {analysis.lyrical_devices && analysis.lyrical_devices.length > 0 && (
                <LyricalDevices analysis={analysis}/>
            )}

            {/* Cultural Notes */}
            {analysis.cultural_notes && analysis.cultural_notes.length > 0 && (
                <CulturalNotes analysis={analysis} />
            )}

            {/* Variants */}
            <Variants 
                analysis={analysis} 
                language={originalLanguage}
                showPronunciation={showPronunciation} />
            </div>
        </div>
    )
}

export default SentenceNotes;
