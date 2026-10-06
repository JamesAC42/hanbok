'use client';
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Dashboard from '@/components/Dashboard';
import Mascot from '@/components/Mascot';
import Analysis from '@/components/analysis/Analysis';
import ExtendedTextSaveButton from '@/components/ExtendedTextSaveButton';
import ReaderText from '@/components/reader/ReaderText';
import SentencePanel from '@/components/reader/SentencePanel';
import PassageNotes from '@/components/reader/PassageNotes';
import PassageQuiz from '@/components/reader/PassageQuiz';
import useReaderWords from '@/components/reader/useReaderWords';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import getFontClass from '@/lib/fontClass';
import { readProgress, saveProgress, readPreference, savePreference } from '@/lib/readerProgress';
import { markStage } from '@/lib/todayLoop';
import { track } from '@/lib/analytics';
import styles from '@/styles/pages/extendedtextanalysis.module.scss';

const TRANSLATION_MODES = ['tap', 'all', 'side'];

const parseEvent = (event) => {
    try {
        return JSON.parse(event.data);
    } catch {
        return null;
    }
};

function ExtendedTextReader() {
    const { textId } = useParams();
    const searchParams = useSearchParams();
    const jobId = searchParams.get('job');
    const router = useRouter();
    const { isAuthenticated, loading: authLoading, updateExtendedTextQuota } = useAuth();
    const { t, supportedLanguages, supportedAnalysisLanguages } = useLanguage();

    const [text, setText] = useState(null); // title, languages, overview, analyses
    const [sentences, setSentences] = useState([]);
    const [live, setLive] = useState(null); // { processed, total } while the reading pass runs
    const [error, setError] = useState(null);
    const [selected, setSelected] = useState(null);
    const [selectedWord, setSelectedWord] = useState(null);
    const [mode, setMode] = useState('tap');
    const [highlightPattern, setHighlightPattern] = useState(null);
    const [breakdown, setBreakdown] = useState({}); // index -> 'loading' | 'error'
    const [flyoutOpen, setFlyoutOpen] = useState(false);
    const [quizOpen, setQuizOpen] = useState(false);
    const [progress, setProgress] = useState(0);
    const [showAllWords, setShowAllWords] = useState(false);
    const panelRef = useRef(null);

    useEffect(() => {
        setMode(readPreference('translation', 'tap'));
        setProgress(readProgress(textId));
    }, [textId]);

    const loadText = useCallback(async () => {
        try {
            const response = await fetch(`/api/extended-text/${textId}`, { credentials: 'include' });
            const data = await response.json();
            if (!data.success) {
                setError(data.error || t('extended_text.fetch_error'));
                return;
            }
            const { reader, ...rest } = data.extendedText;
            setText(rest);
            setSentences(reader);
            setLive(null);
        } catch (err) {
            console.error('Error fetching extended text:', err);
            setError(t('extended_text.fetch_error'));
        }
    }, [textId, t]);

    // While the reading pass runs, show the passage at once and fill in each
    // sentence as it is read; load the finished text when it completes.
    useEffect(() => {
        if (authLoading) return undefined;
        if (!isAuthenticated) {
            setError(t('extended_text.login_required'));
            return undefined;
        }
        if (!jobId) {
            loadText();
            return undefined;
        }

        const source = new EventSource(`/api/extended-text/progress/${jobId}`);
        source.addEventListener('init', (event) => {
            const data = parseEvent(event);
            if (!data) return;
            if (data.status === 'completed') return;
            setText((prev) => prev || {
                title: data.title,
                originalLanguage: data.originalLanguage,
                translationLanguage: data.translationLanguage,
                sentenceCount: data.totalSentences,
                overallAnalysis: null,
                analyses: {}
            });
            setSentences(data.sentences || []);
            setLive({ processed: data.processedSentences || 0, total: data.totalSentences || 0 });
        });
        source.addEventListener('sentences', (event) => {
            const data = parseEvent(event);
            if (!data?.sentences) return;
            setSentences((prev) => {
                const next = [...prev];
                for (const sentence of data.sentences) next[sentence.index] = sentence;
                return next;
            });
        });
        source.addEventListener('progress', (event) => {
            const data = parseEvent(event);
            if (!data) return;
            setLive((prev) => ({ ...(prev || {}), processed: data.processedSentences, total: data.totalSentences }));
        });
        source.addEventListener('completed', (event) => {
            const data = parseEvent(event);
            source.close();
            const quota = data?.weeklyQuota;
            if (quota && updateExtendedTextQuota) {
                updateExtendedTextQuota(quota.weekAnalysesUsed ?? 0, quota.weekAnalysesTotal ?? 0, quota.weekAnalysesRemaining ?? 0);
            }
            track('paragraph_ready', { sentences: data?.sentenceCount });
            // Dropping ?job reloads the finished text through the effect below.
            router.replace(`/extended-text/${textId}`, { scroll: false });
        });
        source.addEventListener('jobError', (event) => {
            const data = parseEvent(event);
            source.close();
            setError(data?.message || t('extended_text.progress_error'));
        });
        source.onerror = () => {
            // The browser reconnects on its own; a refused stream (finished or
            // unknown job) is closed, so load whatever was saved.
            if (source.readyState === EventSource.CLOSED) loadText();
        };
        return () => source.close();
    }, [authLoading, isAuthenticated, jobId, textId, loadText, router, t, updateExtendedTextQuota]);

    const language = text?.originalLanguage;
    const translationLanguage = text?.translationLanguage;
    const overview = text?.overallAnalysis && Object.keys(text.overallAnalysis).length > 0 ? text.overallAnalysis : null;
    const total = sentences.length;
    const fontClass = getFontClass(language);
    const isLive = Boolean(live);

    const keyVocabulary = overview?.keyVocabulary || [];
    const keyWords = useMemo(() => new Set(keyVocabulary.map((word) => word.word)), [keyVocabulary]);
    const words = useReaderWords({ sentences, keyVocabulary, originalLanguage: language, translationLanguage });
    const unsavedKeyWords = keyVocabulary.filter((word) => !words.saved.has(word.word));

    // Sentences that use the highlighted grammar pattern: from the overview's
    // sentence list and from each sentence's own grammar tags.
    const highlightSet = useMemo(() => {
        const set = new Set();
        if (!highlightPattern) return set;
        const point = (overview?.keyGrammarPatterns || []).find((p) => p.pattern === highlightPattern);
        (point?.sentences || []).forEach((n) => set.add(n - 1));
        sentences.forEach((sentence) => {
            if ((sentence.grammar || []).some((g) => g.pattern === highlightPattern)) set.add(sentence.index);
        });
        return set;
    }, [highlightPattern, overview, sentences]);

    const onSeen = useCallback((count) => {
        setProgress((prev) => {
            if (count <= prev) return prev;
            saveProgress(textId, count);
            return count;
        });
    }, [textId]);

    const select = useCallback((index, wordIndex = null) => {
        setSelected(index);
        setSelectedWord(wordIndex);
        onSeen(index + 1);
        markStage('read');
    }, [onSeen]);

    const closeSentence = useCallback(() => {
        setSelected(null);
        setSelectedWord(null);
    }, []);

    const scrollToSentence = useCallback((index) => {
        const el = document.querySelector(`[data-index="${index}"]`);
        el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }, []);

    const jump = useCallback((index) => {
        select(index);
        scrollToSentence(index);
    }, [select, scrollToSentence]);

    useEffect(() => {
        if (selected === null) return undefined;
        const onKey = (event) => {
            if (flyoutOpen || quizOpen) return;
            const tag = event.target?.tagName;
            if (tag === 'INPUT' || tag === 'TEXTAREA') return;
            if (event.key === 'Escape') closeSentence();
            if (event.key === 'ArrowRight' && selected < total - 1) jump(selected + 1);
            if (event.key === 'ArrowLeft' && selected > 0) jump(selected - 1);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [selected, total, flyoutOpen, quizOpen, closeSentence, jump]);

    const changeMode = (next) => {
        setMode(next);
        savePreference('translation', next);
    };

    const analysisFor = (index) => text?.analyses?.[index] || null;

    // Full breakdown: made on first open, then kept with the text.
    const openBreakdown = async () => {
        if (selected === null) return;
        const index = selected;
        if (analysisFor(index)) {
            setFlyoutOpen(true);
            return;
        }
        setBreakdown((prev) => ({ ...prev, [index]: 'loading' }));
        setFlyoutOpen(true);
        try {
            const response = await fetch(`/api/extended-text/${textId}/sentences/${index}/analysis`, {
                method: 'POST',
                credentials: 'include'
            });
            const data = await response.json();
            if (!data.success) throw new Error(data.error);
            setText((prev) => ({ ...prev, analyses: { ...(prev.analyses || {}), [index]: data.sentence } }));
            setBreakdown((prev) => ({ ...prev, [index]: undefined }));
            track('paragraph_breakdown', { language });
        } catch (err) {
            console.error('Error loading breakdown:', err);
            setBreakdown((prev) => ({ ...prev, [index]: 'error' }));
            setFlyoutOpen(false);
        }
    };

    useEffect(() => {
        if (!flyoutOpen) return undefined;
        const onKey = (event) => {
            if (event.key === 'Escape') setFlyoutOpen(false);
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [flyoutOpen]);

    useEffect(() => {
        if (text?.title) document.title = `${text.title} | Hanbok`;
    }, [text?.title]);

    if (error) {
        return (
            <Dashboard>
                <div className={styles.error}>
                    <Mascot pose="think" size={96} />
                    <p>{error}</p>
                    <Link href="/extended-text" className={styles.errorAction}>{t('reader.back_to_paste')}</Link>
                </div>
            </Dashboard>
        );
    }

    if (!text || sentences.length === 0) {
        return (
            <Dashboard>
                <div className={styles.loading}>
                    <Mascot pose="study" size={96} motion="bob" />
                    <p>{t('extended_text.loading')}</p>
                </div>
            </Dashboard>
        );
    }

    const languageName = (code) => {
        const key = supportedAnalysisLanguages[code] || supportedLanguages[code];
        return key ? t(`languages.${key}`) : (code || '').toUpperCase();
    };
    const minutes = Math.max(1, Math.round(sentences.reduce((sum, s) => sum + s.text.length, 0) / (language === 'ko' ? 250 : 300)));
    const current = selected !== null ? sentences[selected] : null;
    const currentAnalysis = selected !== null ? analysisFor(selected) : null;
    const readCount = Math.min(progress, total);
    const finished = !isLive && readCount >= total;
    const shownKeyWords = showAllWords ? keyVocabulary : keyVocabulary.slice(0, 6);
    const quiz = overview?.quiz || [];

    return (
        <Dashboard>
            <div className={styles.page}>
                <div className={styles.toolbar}>
                    <Link href="/extended-text" className={styles.back}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="m15 18-6-6 6-6" /></svg>
                        {t('reader.passages')}
                    </Link>
                    <div className={styles.modeSwitch} role="group" aria-label={t('reader.translation_label')}>
                        {TRANSLATION_MODES.map((option) => (
                            <button
                                key={option}
                                type="button"
                                className={mode === option ? styles.modeActive : styles.mode}
                                onClick={() => changeMode(option)}
                                aria-pressed={mode === option}
                            >
                                {t(`reader.mode_${option}`)}
                            </button>
                        ))}
                    </div>
                    {!isLive && <ExtendedTextSaveButton textId={text.textId} />}
                </div>

                <header className={styles.header}>
                    {text.title && <h1 className={`${styles.title} ${fontClass}`} lang={language}>{text.title}</h1>}
                    {!text.title && <h1 className={styles.title}>{t('reader.untitled')}</h1>}
                    <div className={styles.chips}>
                        {overview?.level?.label && (
                            <span className={styles.levelChip}>
                                {overview.level.label}{overview.level.scale ? ` · ${overview.level.scale}` : ''}
                            </span>
                        )}
                        <span className={styles.chip}>{languageName(language)} → {languageName(translationLanguage)}</span>
                        <span className={styles.chip}>{t('reader.sentences_minutes', { count: total, minutes })}</span>
                        {overview?.tone && <span className={styles.chip}>{overview.tone}</span>}
                        <span className={styles.spacer} />
                        {isLive ? (
                            <span className={styles.liveStatus} role="status">
                                {t('reader.reading_now', { processed: live.processed || 0, total: live.total || total })}
                            </span>
                        ) : (
                            <span className={styles.readStatus}>{t('reader.read_of', { read: readCount, total })}</span>
                        )}
                        <span className={styles.headerBar} aria-hidden="true">
                            <span
                                className={isLive ? styles.headerBarLive : ''}
                                style={{ width: `${isLive ? ((live.processed || 0) / (live.total || total)) * 100 : (readCount / total) * 100}%` }}
                            />
                        </span>
                    </div>
                </header>

                <div className={styles.layout}>
                    <div className={styles.readingColumn}>
                        {(overview || isLive) && (
                            <section className={styles.beforeCard}>
                                <Mascot pose={isLive ? 'study' : 'think'} size={68} motion={isLive ? 'bob' : undefined} className={styles.beforeMascot} />
                                <div className={styles.beforeBody}>
                                    <span className={styles.label}>{t('reader.before_you_read')}</span>
                                    {overview?.summary
                                        ? <p className={styles.summary} lang={translationLanguage}>{overview.summary}</p>
                                        : <p className={styles.summaryMuted}>{t('reader.kkachi_reading')}</p>}
                                    {keyVocabulary.length > 0 && (
                                        <span className={styles.keyWordsLabel}>{t('reader.key_words_label')}</span>
                                    )}
                                    {keyVocabulary.length > 0 && (
                                        <div className={styles.keyWords}>
                                            {shownKeyWords.map((word) => {
                                                const isSaved = words.saved.has(word.word);
                                                return (
                                                    <button
                                                        key={word.word}
                                                        type="button"
                                                        className={isSaved ? styles.keyWordSaved : styles.keyWord}
                                                        onClick={() => (word.sentence ? jump(word.sentence - 1) : null)}
                                                    >
                                                        <span className={fontClass} lang={language}>{word.word}</span>
                                                        <span className={styles.keyMeaning}>{word.meaning}</span>
                                                    </button>
                                                );
                                            })}
                                            {keyVocabulary.length > 6 && (
                                                <button type="button" className={styles.moreWords} onClick={() => setShowAllWords((v) => !v)}>
                                                    {showAllWords ? t('reader.fewer') : t('reader.more_words', { count: keyVocabulary.length - 6 })}
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </section>
                        )}

                        <div className={styles.legend}>
                            {keyVocabulary.length > 0 && (
                                <span><i className={styles.legendKey} aria-hidden="true" />{t('reader.legend_key_words')}</span>
                            )}
                            {highlightPattern && (
                                <span>
                                    <i className={styles.legendGrammar} aria-hidden="true" />
                                    {t('reader.legend_grammar', { pattern: highlightPattern })}
                                    <button type="button" className={styles.clearHighlight} onClick={() => setHighlightPattern(null)}>{t('reader.clear')}</button>
                                </span>
                            )}
                        </div>

                        <ReaderText
                            sentences={sentences}
                            language={language}
                            mode={mode}
                            selected={selected}
                            selectedWord={selectedWord}
                            highlightSet={highlightSet}
                            keyWords={keyWords}
                            savedWords={words.saved}
                            onSelect={select}
                            onSeen={onSeen}
                            labels={{ sentence: t('reader.sentence'), keyWord: t('reader.key_word_title'), translationLanguage }}
                        />

                        {!isLive && (
                            <section className={`${styles.finishCard} ${finished ? styles.finishDone : ''}`}>
                                <Mascot pose="celebrate" size={92} className={styles.finishMascot} />
                                <div className={styles.finishCopy}>
                                    <h2>{finished ? t('reader.finished_title') : t('reader.finish_title')}</h2>
                                    <p>{t('reader.finish_subtitle')}</p>
                                </div>
                                <div className={styles.finishButtons}>
                                    {quiz.length > 0 && (
                                        <button type="button" className={styles.quizButton} onClick={() => { setQuizOpen(true); track('passage_quiz_open'); }}>
                                            {t('reader.quiz_button', { count: quiz.length })}
                                        </button>
                                    )}
                                    {unsavedKeyWords.length > 0 && (
                                        <button
                                            type="button"
                                            className={styles.keepButton}
                                            disabled={words.busy}
                                            onClick={() => words.saveMany(unsavedKeyWords.map((w) => ({ base: w.word, meaning: w.meaning })))}
                                        >
                                            {words.busy ? t('reader.saving') : t('reader.save_key_words', { count: unsavedKeyWords.length })}
                                        </button>
                                    )}
                                    <Link href="/extended-text" className={styles.anotherButton}>{t('reader.read_another')}</Link>
                                </div>
                            </section>
                        )}
                    </div>

                    <aside ref={panelRef} className={`${styles.panel} ${current ? styles.panelOpen : ''}`} aria-label={current ? t('reader.sentence_of', { current: selected + 1, total }) : t('reader.about_passage')}>
                        {current ? (
                            <SentencePanel
                                sentence={current}
                                total={total}
                                language={language}
                                translationLanguage={translationLanguage}
                                selectedWord={selectedWord}
                                onSelectWord={setSelectedWord}
                                savedWords={words.saved}
                                onToggleWord={words.toggle}
                                highlightPattern={highlightPattern}
                                onHighlightPattern={setHighlightPattern}
                                onOpenBreakdown={openBreakdown}
                                breakdownState={breakdown[selected]}
                                onPrev={() => jump(selected - 1)}
                                onNext={() => jump(selected + 1)}
                                onClose={closeSentence}
                                sentenceId={currentAnalysis?.sentenceId}
                            />
                        ) : (
                            <PassageNotes
                                overview={overview}
                                language={language}
                                translationLanguage={translationLanguage}
                                highlightPattern={highlightPattern}
                                onHighlightPattern={setHighlightPattern}
                                onJump={jump}
                                loading={isLive && !overview}
                            />
                        )}
                    </aside>
                </div>

                <div className={`${styles.analysisBackdrop} ${flyoutOpen ? styles.open : ''}`} onClick={() => setFlyoutOpen(false)} aria-hidden="true" />
                <aside className={`${styles.analysisFlyout} ${flyoutOpen ? styles.open : ''}`} role="dialog" aria-modal={flyoutOpen} aria-hidden={!flyoutOpen}>
                    <div className={styles.flyoutMobileDragBar} onClick={() => setFlyoutOpen(false)}>
                        <div className={styles.dragHandle} />
                    </div>
                    <div className={styles.flyoutHeader}>
                        <div className={styles.flyoutHeaderContent}>
                            <h2>{selected !== null ? t('reader.breakdown_title', { number: selected + 1 }) : t('extended_text.sentence_analysis')}</h2>
                            <button type="button" className={styles.closeButton} onClick={() => setFlyoutOpen(false)} aria-label={t('extended_text.close')}>
                                <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><path d="M18 6 6 18M6 6l12 12" /></svg>
                            </button>
                        </div>
                    </div>
                    <div className={styles.flyoutBody}>
                        {flyoutOpen && currentAnalysis ? (
                            <Analysis
                                analysis={currentAnalysis.analysis}
                                originalLanguage={language}
                                translationLanguage={translationLanguage}
                                sentenceId={currentAnalysis.sentenceId}
                                voice1={currentAnalysis.voice1Key}
                                voice2={currentAnalysis.voice2Key}
                                voice1Slow={currentAnalysis.voice1SlowKey}
                                voice2Slow={currentAnalysis.voice2SlowKey}
                                inParagraph
                            />
                        ) : flyoutOpen ? (
                            <div className={styles.breakdownLoading} role="status">
                                <Mascot pose="think" size={110} motion="bob" />
                                <p>{t('reader.breaking_down_long')}</p>
                            </div>
                        ) : null}
                    </div>
                </aside>

                {quizOpen && quiz.length > 0 && (
                    <PassageQuiz
                        quiz={quiz}
                        translationLanguage={translationLanguage}
                        onClose={() => setQuizOpen(false)}
                        onShowSentence={(index) => {
                            setQuizOpen(false);
                            jump(index);
                        }}
                    />
                )}
            </div>
        </Dashboard>
    );
}

export default function ExtendedTextReaderPage() {
    return (
        <Suspense fallback={null}>
            <ExtendedTextReader />
        </Suspense>
    );
}
