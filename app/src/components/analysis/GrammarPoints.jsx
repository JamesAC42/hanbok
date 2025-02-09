'use client';
import styles from "@/styles/components/sentenceanalyzer/grammarpoints.module.scss"
import { MaterialSymbolsLightKidStar } from '@/components/icons/StarFilled';
import { MaterialSymbolsLightKidStarOutline } from '@/components/icons/StarOutline';

const GrammarPoints = ({analysis}) => {
    
    const renderLessonDifficulty = (difficulty) => {
        switch(difficulty) {
            case 'beginner':
                return renderStars(1, 5);
            case 'intermediate':
                return renderStars(2, 5);
            case 'advanced':
                return renderStars(3, 5);
            default:
                return renderStars(0, 5);
        }
    }
    
    const renderStars = (count, total) => {
        let stars = [];
        for (let i = 0; i < total; i++) {
            if(i + 1 <= count) {
                stars.push(
                    <span key={`star-filled-${i}`}>
                        <MaterialSymbolsLightKidStar />
                    </span>
                );
            } else {
                stars.push(
                    <span key={`star-outline-${i}`}>
                        <MaterialSymbolsLightKidStarOutline />
                    </span>
                );
            }
        }
        return stars;
    }

    const renderGrammarList = () => {
        let grammarList = [];

        analysis.grammar_points.forEach((lesson, lessonIndex) => {
            grammarList.push(
                <div 
                    key={`${lesson.pattern}-${lessonIndex}`}
                    className={styles.grammarListItem}
                >
                    <div className={styles.grammarListItemPattern}>
                        {lesson.pattern}

                        <div className={styles.grammarListItemDifficulty} title={lesson.level}>
                            {renderLessonDifficulty(lesson.level)}
                        </div>
                    </div>

                    <div className={styles.grammarListItemExplanation}>
                        {lesson.explanation}
                    </div>

                    {lesson.examples && (
                        <div className={styles.grammarListItemExamples}>
                            <div className={styles.grammarListItemExamplesHeader}>
                                Examples
                            </div>
                            <div className={styles.grammarListItemExamplesContent}>
                                {lesson.examples.map((example, index) => (
                                    <div
                                        key={`${example.korean}-${index}`}
                                        className={styles.grammarListItemExample}
                                    >
                                        <div className={styles.grammarListItemExampleKorean}>
                                            {example.korean}
                                        </div>
                                        <div className={styles.grammarListItemExampleEnglish}>
                                            {example.english}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
        });

        return grammarList;
    } 

    if(!analysis?.grammar_points) {
        return null;
    }

    return(
        <div className={styles.grammarList}>
            <div className={styles.grammarListHeader}>
                Grammar
            </div>
            <div className={styles.grammarListContainer}>
                {renderGrammarList()}
            </div>
        </div>
    )
}

export default GrammarPoints;
