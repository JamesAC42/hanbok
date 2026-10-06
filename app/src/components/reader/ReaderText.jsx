'use client';
import { memo, useEffect, useRef } from 'react';
import getFontClass from '@/lib/fontClass';
import { groupParagraphs, joinsWithoutSpace, segmentSentence } from './segment';
import styles from '@/styles/components/reader/readertext.module.scss';

// The passage itself. Paragraphs are kept; every word is a button that opens
// its sentence in the side panel. `mode` decides where translations show:
// 'tap' only under the open sentence, 'all' under every sentence, 'side' in a
// second column next to each paragraph.
const Sentence = memo(function Sentence({
    sentence, selected, selectedWord, highlighted, keyWords, savedWords, onSelect, showTranslation, language, labels
}) {
    const ready = Boolean(sentence.words?.length);
    const parts = ready ? segmentSentence(sentence.text, sentence.words) : null;
    const classes = [
        styles.sentence,
        selected ? styles.selected : '',
        highlighted ? styles.highlighted : '',
        sentence.translation ? '' : styles.pending
    ].join(' ');

    return (
        <span className={styles.sentenceWrap} data-index={sentence.index}>
            <span className={classes}>
                {selected && <span className={styles.number} aria-hidden="true">{sentence.index + 1}</span>}
                {ready ? parts.map((part, i) => {
                    if (part.gap !== undefined) return <span key={i}>{part.gap}</span>;
                    const word = sentence.words[part.word];
                    const isKey = keyWords.has(word.base) && !savedWords.has(word.base);
                    return (
                        <button
                            key={i}
                            type="button"
                            className={`${styles.word} ${isKey ? styles.keyWord : ''} ${selected && selectedWord === part.word ? styles.activeWord : ''}`}
                            onClick={() => onSelect(sentence.index, part.word)}
                            aria-label={`${part.text}, ${labels.sentence} ${sentence.index + 1}`}
                        >
                            {part.text}
                        </button>
                    );
                }) : (
                    // A span, not a button: a button holding a whole sentence
                    // wraps as one block instead of flowing with the paragraph.
                    <span
                        role="button"
                        tabIndex={sentence.translation || sentence.failed ? 0 : -1}
                        aria-disabled={!sentence.translation && !sentence.failed}
                        className={styles.word}
                        onClick={() => (sentence.translation || sentence.failed) && onSelect(sentence.index, null)}
                        onKeyDown={(event) => {
                            if ((event.key === 'Enter' || event.key === ' ') && (sentence.translation || sentence.failed)) {
                                event.preventDefault();
                                onSelect(sentence.index, null);
                            }
                        }}
                    >
                        {sentence.text}
                    </span>
                )}
            </span>
            {showTranslation && sentence.translation && (
                <span className={`${styles.translation} ${selected ? styles.translationSelected : ''}`} lang={labels.translationLanguage}>
                    {sentence.translation}
                </span>
            )}
            {!joinsWithoutSpace(language) && !showTranslation && ' '}
        </span>
    );
});

const ReaderText = ({
    sentences, language, mode, selected, selectedWord, highlightSet, keyWords, savedWords, onSelect, onSeen, labels
}) => {
    const fontClass = getFontClass(language);
    const containerRef = useRef(null);
    const paragraphs = groupParagraphs(sentences);

    // Count a paragraph as read once it has been on screen.
    useEffect(() => {
        const root = containerRef.current;
        if (!root || typeof IntersectionObserver === 'undefined') return undefined;
        const observer = new IntersectionObserver((entries) => {
            for (const entry of entries) {
                if (entry.isIntersecting) onSeen(Number(entry.target.dataset.last) + 1);
            }
        }, { threshold: 0.6 });
        root.querySelectorAll('[data-last]').forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, [sentences.length, mode, onSeen]);

    return (
        <article ref={containerRef} className={`${styles.text} ${mode === 'side' ? styles.sideBySide : ''}`} lang={language}>
            {paragraphs.map((group) => {
                const last = group.sentences[group.sentences.length - 1].index;
                const sentenceNodes = group.sentences.map((sentence) => (
                    <Sentence
                        key={sentence.index}
                        sentence={sentence}
                        selected={selected === sentence.index}
                        selectedWord={selectedWord}
                        highlighted={highlightSet.has(sentence.index)}
                        keyWords={keyWords}
                        savedWords={savedWords}
                        onSelect={onSelect}
                        showTranslation={mode === 'all' || (mode === 'tap' && selected === sentence.index)}
                        language={language}
                        labels={labels}
                    />
                ));
                if (mode === 'side') {
                    return (
                        <div key={group.paragraph} className={styles.sideRow} data-last={last} id={`reader-s-${group.sentences[0].index}`}>
                            <p className={`${styles.paragraph} ${fontClass}`}>{sentenceNodes}</p>
                            <p className={styles.sideTranslation} lang={labels.translationLanguage}>
                                {group.sentences.map((sentence) => (
                                    <span
                                        key={sentence.index}
                                        className={selected === sentence.index ? styles.sideSelected : ''}
                                    >
                                        {sentence.translation || '…'}{' '}
                                    </span>
                                ))}
                            </p>
                        </div>
                    );
                }
                return (
                    <p
                        key={group.paragraph}
                        className={`${styles.paragraph} ${fontClass} ${mode === 'all' ? styles.lineByLine : ''}`}
                        data-last={last}
                        id={`reader-s-${group.sentences[0].index}`}
                    >
                        {sentenceNodes}
                    </p>
                );
            })}
        </article>
    );
};

export default ReaderText;
