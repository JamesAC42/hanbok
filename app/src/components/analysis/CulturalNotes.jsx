'use client';
import { CarbonWarningFilled } from '@/components/icons/Warning';
import { RiBrain2Fill } from '@/components/icons/Brain';
import { MajesticonsLightbulbShine } from '@/components/icons/Lightbulb';
import styles from '@/styles/components/sentenceanalyzer/culturalnotes.module.scss';

const CulturalNotes = ({analysis}) => {

    const getCulturalNoteImportanceClass = (importance) => {
        if (!importance) {

            return '';
        }
        switch(importance) {
            case 'high':
                return styles.highImportance;
            case 'medium':
                return styles.mediumImportance;
            default:
                return styles.lowImportance;
        }
    }
    
    const renderNoteImportanceIcon = (importance) => {
        return (
            <div className={`${styles.culturalNoteIcon} ${getCulturalNoteImportanceClass(importance)}`}>
                {importance === 'high' 
                ? <CarbonWarningFilled /> 
                : importance === 'medium' 
                ? <RiBrain2Fill /> 
                : <MajesticonsLightbulbShine />
                }
            </div>
        )
    }

    if(!analysis || !analysis.cultural_notes || analysis.cultural_notes.length === 0) {
        return null;
    }

    return (
        <div className={styles.culturalNotes}>
            {
            analysis.cultural_notes.map((note, index) => (
                <div className={styles.culturalNotesItem} key={index}>
                
                {renderNoteImportanceIcon(note.importance)}
                <div className={styles.culturalNoteText}>
                    {note.note}
                </div>
                </div>
            ))
            }
        </div>
    )
}

export default CulturalNotes;