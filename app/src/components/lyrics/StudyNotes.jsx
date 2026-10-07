import Link from 'next/link';
import WordList from '@/components/learn/WordList';
import Tiger from '@/components/Tiger';
import { buildStudyNotes } from '@/lib/lyricStudy';
import { languageName } from '@/lib/seo';
import styles from '@/styles/components/studynotes.module.scss';

// "Learn [language] with this song": the song's key words and grammar, drawn
// from its line analyses. Rendered on the server under the lyrics.
const StudyNotes = ({ lyric }) => {
    const notes = buildStudyNotes(lyric);
    if (!notes.vocab.length && !notes.grammar.length) return null;
    const language = languageName(lyric.language);

    return (
        <section className={styles.notes} aria-labelledby="study-notes">
            <header className={styles.head}>
                <Tiger pose="teach" size={84} />
                <div>
                    <p className={styles.label}>Study notes</p>
                    <h2 id="study-notes" className={styles.title}>Learn {language} with &ldquo;{lyric.title}&rdquo;</h2>
                    <p className={styles.dek}>
                        {notes.lineCount} lines broken down, {notes.wordCount} words and {notes.grammarCount} grammar points.
                        Here are the ones worth learning first. Tap any line in the lyrics above for its full breakdown.
                    </p>
                </div>
            </header>

            {notes.vocab.length > 0 && (
                <>
                    <h3 className={styles.sectionTitle}>Key words</h3>
                    <p className={styles.hint}>Save a word to add it to your flashcards.</p>
                    <WordList items={notes.vocab} lang={lyric.language} />
                </>
            )}

            {notes.grammar.length > 0 && (
                <>
                    <h3 className={styles.sectionTitle}>Grammar in this song</h3>
                    <ol className={styles.grammarList}>
                        {notes.grammar.map((g) => (
                            <li key={g.pattern} className={styles.grammarItem}>
                                <p className={styles.pattern} lang={lyric.language}>{g.pattern}</p>
                                <p className={styles.explanation}>{g.explanation}</p>
                                <blockquote className={styles.line}>
                                    <p lang={lyric.language}>{g.line.text}</p>
                                    {g.line.translation && <p className={styles.lineTranslation}>{g.line.translation}</p>}
                                </blockquote>
                                {g.guide && (
                                    <Link href={g.guide.href} className={styles.guideLink}>
                                        Read the guide: <span lang={lyric.language}>{g.guide.title}</span>
                                    </Link>
                                )}
                            </li>
                        ))}
                    </ol>
                </>
            )}

            <div className={styles.cta}>
                <p>Have a line from another song stuck in your head?</p>
                <Link href="/analyze" className={styles.ctaButton}>Break down any sentence</Link>
            </div>
        </section>
    );
};

export default StudyNotes;
