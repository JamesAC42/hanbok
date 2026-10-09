'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { addWord } from '@/api/words';
import { track } from '@/lib/analytics';
import UpgradeSheet from '@/components/grammar/UpgradeSheet';
import { characterOf } from '@/components/speak/characters';
import styles from '@/styles/pages/speakResults.module.scss';

const fmtTime = (s) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, Math.round(s)) % 60).padStart(2, '0')}`;

// 3 stars for every goal, 2 for half or more, 1 for showing up and talking.
export const starsFor = (goals) => {
    const done = goals.filter((g) => g.done).length;
    if (goals.length && done === goals.length) return 3;
    if (done * 2 >= goals.length && done > 0) return 2;
    return 1;
};

// The notes made from the transcript once the call ends.
export function useRecap(sessionId, initial = null) {
    const [recap, setRecap] = useState(initial);
    const [failed, setFailed] = useState(false);
    useEffect(() => {
        if (initial || !sessionId) return undefined;
        let live = true;
        fetch(`/api/speak/session/${sessionId}/recap`, { method: 'POST', credentials: 'include' })
            .then((r) => r.json())
            .then((d) => { if (!live) return; if (d.success) setRecap(d); else setFailed(true); })
            .catch(() => live && setFailed(true));
        return () => { live = false; };
    }, [sessionId, initial]);
    return { recap, loading: !recap && !failed, failed };
}

// Counts up from 0 so the numbers land one after another.
function CountUp({ to, delay = 0, format = (n) => n }) {
    const [n, setN] = useState(0);
    useEffect(() => {
        const reduce = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
        if (reduce || !to) { setN(to); return undefined; }
        let raf;
        const t = setTimeout(() => {
            const start = performance.now();
            const step = (now) => {
                const p = Math.min(1, (now - start) / 700);
                setN(Math.round(to * (1 - (1 - p) ** 3)));
                if (p < 1) raf = requestAnimationFrame(step);
            };
            raf = requestAnimationFrame(step);
        }, delay);
        return () => { clearTimeout(t); cancelAnimationFrame(raf); };
    }, [to, delay]);
    return <>{format(n)}</>;
}

function Confetti({ colors }) {
    const pieces = useMemo(() => Array.from({ length: 34 }, (_, i) => ({
        left: Math.random() * 100,
        delay: Math.random() * 0.5,
        drift: (Math.random() - 0.5) * 160,
        spin: (Math.random() - 0.5) * 900,
        color: colors[i % colors.length],
        size: 7 + Math.random() * 7,
        round: i % 3 === 0,
    })), [colors]);
    return (
        <div className={styles.confetti} aria-hidden="true">
            {pieces.map((p, i) => (
                <span key={i} style={{
                    left: `${p.left}%`, animationDelay: `${p.delay}s`, background: p.color, width: p.size, height: p.round ? p.size : p.size * 0.5,
                    borderRadius: p.round ? '50%' : 2, '--drift': `${p.drift}px`, '--spin': `${p.spin}deg`,
                }} />
            ))}
        </div>
    );
}

function Shimmer({ rows = 2 }) {
    return <div className={styles.shimmerBox}>{Array.from({ length: rows }, (_, i) => <span key={i} style={{ width: `${85 - i * 20}%` }} />)}</div>;
}

// Grammar and phrase saving, and the notes, shared by the results screen and
// the call history.
export function RecapNotes({ recap, loading, failed, phrases = [], tips = [], language, nativeLanguage, delay = 0 }) {
    const [savedWords, setSavedWords] = useState({});
    const [savedGrammar, setSavedGrammar] = useState({});
    const [limitHit, setLimitHit] = useState(false);

    const savePhrase = async (p) => {
        if (savedWords[p.word]) return;
        setSavedWords((s) => ({ ...s, [p.word]: 'saving' }));
        try {
            const r = await addWord({ originalWord: p.word, translatedWord: p.text, originalLanguage: language, translationLanguage: nativeLanguage });
            setSavedWords((s) => ({ ...s, [p.word]: r?.reachedLimit ? 'limit' : 'saved' }));
        } catch {
            setSavedWords((s) => ({ ...s, [p.word]: 'error' }));
        }
    };
    const saveAllPhrases = () => phrases.reduce((chain, p) => chain.then(() => savePhrase(p)), Promise.resolve());

    const saveGrammar = async (g) => {
        if (savedGrammar[g.pattern]) return;
        setSavedGrammar((s) => ({ ...s, [g.pattern]: { state: 'saving' } }));
        try {
            const r = await fetch('/api/grammar/save', {
                method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originalLanguage: language, translationLanguage: nativeLanguage,
                    pattern: g.pattern, explanation: g.explanation, level: g.level,
                    examples: g.example?.original ? [g.example] : [],
                }),
            });
            const d = await r.json();
            if (d.reachedLimit) { setLimitHit(true); setSavedGrammar((s) => ({ ...s, [g.pattern]: null })); return; }
            if (!d.success) throw new Error();
            setSavedGrammar((s) => ({ ...s, [g.pattern]: { state: 'saved', grammarId: d.grammarId } }));
            track('grammar_save', { language, already: !!d.alreadySaved, from: 'speak' });
        } catch {
            setSavedGrammar((s) => ({ ...s, [g.pattern]: { state: 'error' } }));
        }
    };

    // Tips said during the call come first; the recap adds any it spotted.
    const callTips = tips.filter((t) => t.kind !== 'good');
    const pron = [...callTips.map((t) => ({ word: t.word, tip: t.text })), ...(recap?.pronunciation || [])]
        .filter((t, i, all) => all.findIndex((x) => x.word === t.word) === i).slice(0, 4);
    const good = tips.filter((t) => t.kind === 'good');
    const at = (i) => ({ animationDelay: `${delay + i * 0.12}s` });

    return (
        <div className={styles.notes}>
            {failed && !recap && <p className={styles.noteMuted}>The notes for this call couldn&apos;t load. Your transcript is still saved.</p>}
            <div className={styles.noteGrid}>
                <section className={`${styles.noteCard} ${styles.noteWell}`} style={at(0)}>
                    <h3><span aria-hidden="true">👏</span> What went well</h3>
                    {loading ? <Shimmer rows={3} /> : (
                        <ul>{(recap?.well || []).map((t) => <li key={t}>{t}</li>)}{good.map((t) => <li key={t.key || t.word}><b lang={language}>{t.word}</b> sounded great.</li>)}</ul>
                    )}
                    {recap?.best && (
                        <p className={styles.bestLine}>
                            <span className={styles.noteLabel}>Your best line</span>
                            <span lang={language} className={styles.target}>{recap.best.text}</span>
                            <span className={styles.meaning}>{recap.best.translation}</span>
                        </p>
                    )}
                </section>
                <section className={`${styles.noteCard} ${styles.noteWork}`} style={at(1)}>
                    <h3><span aria-hidden="true">🎯</span> To work on</h3>
                    {loading ? <Shimmer rows={2} /> : (
                        <ul>{(recap?.improve || []).map((t) => <li key={t}>{t}</li>)}</ul>
                    )}
                    {(recap?.fixes || []).length > 0 && (
                        <ul className={styles.fixList}>
                            {recap.fixes.map((f) => (
                                <li key={f.said}>
                                    <span lang={language} className={styles.said}>{f.said}</span>
                                    <span lang={language} className={styles.better}>{f.better}</span>
                                    <span className={styles.meaning}>{f.why}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                </section>
                {(loading || pron.length > 0) && (
                    <section className={`${styles.noteCard} ${styles.notePron}`} style={at(2)}>
                        <h3><span aria-hidden="true">🗣️</span> Pronunciation</h3>
                        {loading && !pron.length ? <Shimmer rows={2} /> : (
                            <ul>{pron.map((t) => <li key={t.word}><b lang={language}>{t.word}</b> {t.tip}</li>)}</ul>
                        )}
                    </section>
                )}
            </div>

            {(loading || (recap?.grammar || []).length > 0) && (
                <section className={styles.saveBlock} style={at(3)}>
                    <h3 className={styles.blockTitle}>Grammar from this conversation</h3>
                    {loading ? <Shimmer rows={3} /> : (
                        <ul className={styles.grammarList}>
                            {recap.grammar.map((g) => {
                                const st = savedGrammar[g.pattern];
                                return (
                                    <li key={g.pattern}>
                                        <div className={styles.grammarHead}>
                                            <span lang={language} className={styles.pattern}>{g.pattern}</span>
                                            <span className={styles.grammarName}>{g.name}</span>
                                        </div>
                                        <p className={styles.grammarText}>{g.explanation}</p>
                                        {g.example?.original && (
                                            <p className={styles.example}><span lang={language}>{g.example.original}</span> <span className={styles.meaning}>{g.example.translation}</span></p>
                                        )}
                                        {st?.state === 'saved' ? (
                                            <Link className={styles.savedLink} href={`/my-grammar/${st.grammarId}`}>✓ On your grammar path</Link>
                                        ) : (
                                            <button type="button" className={styles.saveBtn} disabled={st?.state === 'saving'} onClick={() => saveGrammar(g)}>
                                                {st?.state === 'saving' ? 'Saving…' : st?.state === 'error' ? 'Try again' : '+ Save grammar'}
                                            </button>
                                        )}
                                    </li>
                                );
                            })}
                        </ul>
                    )}
                </section>
            )}

            {phrases.length > 0 && (
                <section className={styles.saveBlock} style={at(4)}>
                    <div className={styles.blockRow}>
                        <h3 className={styles.blockTitle}>Phrases you learned</h3>
                        {phrases.length > 1 && <button type="button" className={styles.linkBtn} onClick={saveAllPhrases}>Save all</button>}
                    </div>
                    <ul className={styles.phraseList}>
                        {phrases.map((p) => (
                            <li key={p.word}>
                                <span lang={language} className={styles.target}>{p.word}</span>
                                <span className={styles.meaning}>{p.text}</span>
                                <button type="button" className={styles.saveBtn} disabled={!!savedWords[p.word] && savedWords[p.word] !== 'error'} onClick={() => savePhrase(p)}>
                                    {savedWords[p.word] === 'saved' ? '✓ Saved' : savedWords[p.word] === 'limit' ? 'Library full' : savedWords[p.word] === 'saving' ? 'Saving…' : savedWords[p.word] === 'error' ? 'Try again' : '+ Save'}
                                </button>
                            </li>
                        ))}
                    </ul>
                </section>
            )}
            {limitHit && <UpgradeSheet reason="save" onClose={() => setLimitHit(false)} />}
        </div>
    );
}

// The screen right after a call: a short celebration, then the numbers, the
// notes and what to save.
export default function SpeakResults({ result, language, nativeLanguage, tier, allowance, onAgain, onBack }) {
    const ch = characterOf(result.character);
    const { recap, loading, failed } = useRecap(result.sessionId);
    const stars = starsFor(result.goals);
    const done = result.goals.filter((g) => g.done).length;
    const complete = done === result.goals.length;
    const minutesLeft = allowance ? Math.floor(allowance.leftSeconds / 60) : null;
    const title = complete ? 'Scene complete!' : done ? 'Nice practice!' : 'Good start!';

    useEffect(() => { window.scrollTo?.(0, 0); }, []);

    return (
        <div className={styles.results} style={{ '--accent': ch.color, '--accent-soft': ch.soft }}>
            <section className={styles.hero}>
                <div className={styles.heroBg} style={{ backgroundImage: `url(/images/speak/bg/${result.scenario.background}.webp)` }} />
                <Confetti colors={[ch.color, '#FFB020', '#13B5A6', '#8E6CF0', '#F06CB4']} />
                <img className={styles.heroSprite} src={`/images/speak/${ch.id}/${ch.celebrate}.webp`} alt="" />
                <div className={styles.heroText}>
                    <p className={styles.kicker}>{result.scenario.title}</p>
                    <h1 className={styles.heroTitle}>{title}</h1>
                    <div className={styles.stars} aria-label={`${stars} of 3 stars`}>
                        {[0, 1, 2].map((i) => <span key={i} className={i < stars ? styles.starOn : styles.starOff} style={{ animationDelay: `${0.5 + i * 0.25}s` }}>★</span>)}
                    </div>
                    {result.summary && (
                        <p className={styles.bubble}>&ldquo;{result.summary}&rdquo;<span>{ch.name}</span></p>
                    )}
                </div>
            </section>

            <ul className={styles.stats}>
                <li style={{ animationDelay: '.9s' }}><b><CountUp to={done} delay={1000} />/{result.goals.length}</b><span>Goals</span></li>
                <li style={{ animationDelay: '1s' }}><b><CountUp to={result.seconds} delay={1100} format={fmtTime} /></b><span>Talking</span></li>
                <li style={{ animationDelay: '1.1s' }}><b><CountUp to={result.lines || 0} delay={1200} /></b><span>Lines you said</span></li>
                <li style={{ animationDelay: '1.2s' }}><b><CountUp to={result.phrases.length} delay={1300} /></b><span>New phrases</span></li>
            </ul>

            <ul className={styles.goalList}>
                {result.goals.map((g, i) => (
                    <li key={g.text} className={g.done ? styles.goalDone : ''} style={{ animationDelay: `${1.3 + i * 0.15}s` }}>
                        <span className={styles.goalMark} aria-hidden="true">{g.done ? '✓' : ''}</span>{g.text}
                    </li>
                ))}
            </ul>

            <RecapNotes recap={recap} loading={loading} failed={failed} phrases={result.phrases} tips={result.tips} language={language} nativeLanguage={nativeLanguage} delay={1.6} />

            {tier < 1 && minutesLeft !== null && (
                <p className={styles.upsell}>
                    {minutesLeft > 0 ? `${minutesLeft} free ${minutesLeft === 1 ? 'minute' : 'minutes'} left this week. ` : 'That was your free time for this week. '}
                    <Link href="/pricing" onClick={() => track('speak_upsell', { where: 'result' })}>Basic gives you 60 minutes a month for $4.</Link>
                </p>
            )}

            <div className={styles.actions}>
                <button type="button" className={styles.againBtn} onClick={onAgain}>Play this scene again</button>
                <button type="button" className={styles.backBtn} onClick={onBack}>More scenes</button>
                <Link className={styles.historyLink} href="/speak/history">See all your conversations</Link>
            </div>
        </div>
    );
}
