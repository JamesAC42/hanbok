'use client';
import styles from "@/styles/components/sentenceanalyzer/grammarpoints.module.scss"
import { MaterialSymbolsLightKidStar } from '@/components/icons/StarFilled';
import { MaterialSymbolsLightKidStarOutline } from '@/components/icons/StarOutline';
import { useLanguage } from '@/contexts/LanguageContext';
import kpop from 'kpop';
import getFontClass from '@/lib/fontClass';
import SaveGrammarRow, { useSavedGrammar } from '@/components/grammar/SaveGrammarRow';

// Examples are one short sentence each. Now and then the model runs away and
// writes hundreds of sentences into one field; drop those rather than let
// them take over the page, and show at most a few.
const MAX_EXAMPLE_CHARS = 200;
const MAX_EXAMPLES = 4;
const usableExamples = (examples) => (Array.isArray(examples) ? examples : [])
    .filter(e => e && typeof e.original === 'string' && e.original.trim() && e.original.length <= MAX_EXAMPLE_CHARS)
    .slice(0, MAX_EXAMPLES);

const GrammarPoints = ({analysis, language, translationLanguage, sentenceId, showPronunciation}) => {
    const { t } = useLanguage();
    const savedGrammar = useSavedGrammar(sentenceId);
    
    const renderLessonDifficulty = (difficulty) => {
        return renderStars(difficulty, 5);
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

    const renderPronunciation = (example) => {
        if(!showPronunciation) return null;
        let p = example.reading;
        if(language === "ko") {
            try {
                p = kpop.romanize(example.original);
            } catch(err) {
                p = example.original;
            }
        }
        if(language === "ru") {
            p = example.transliteration;
        }
        
        if(p) {
            return (
                <div className={styles.pronunciation}>
                    {p}
                </div>
            )
        }
        return null;
    }

    const renderGrammarList = () => {
        let grammarList = [];

        analysis.grammar_points.forEach((lesson, lessonIndex) => {
            grammarList.push(
                <div 
                    key={`${lesson.pattern}-${lessonIndex}`}
                    className={styles.grammarListItem}
                >
                    <div className={`${styles.grammarListItemPattern} ${getFontClass(language)}`}>
                        {lesson.pattern}

                        <div className={styles.grammarListItemDifficulty} title={lesson.level}>
                            {renderLessonDifficulty(lesson.level)}
                        </div>
                    </div>

                    <div className={styles.grammarListItemExplanation}>
                        {lesson.explanation}
                    </div>

                    {usableExamples(lesson.examples).length > 0 && (
                        <div className={styles.grammarListItemExamples}>
                            <div className={styles.grammarListItemExamplesHeader}>
                                {t('analysis.examples')}
                            </div>
                            <div className={styles.grammarListItemExamplesContent}>
                                {usableExamples(lesson.examples).map((example, index) => (
                                    <div
                                        key={`${example.korean}-${index}`}
                                        className={styles.grammarListItemExample}
                                    >
                                        <div className={`${styles.grammarListItemExampleOriginal} ${getFontClass(language)}`}>
                                            {example.original}

                                            {renderPronunciation(example)}
                                        </div>
                                        <div className={styles.grammarListItemExampleTranslation}>
                                            {example.translation}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <SaveGrammarRow
                        point={lesson}
                        language={language}
                        translationLanguage={translationLanguage}
                        sentenceId={sentenceId}
                        examples={usableExamples(lesson.examples)}
                        state={savedGrammar}
                    />
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
                {t('analysis.grammar')}
            </div>
            <div className={styles.grammarListContainer}>
                {renderGrammarList()}
            </div>
        </div>
    )
}

export default GrammarPoints;
