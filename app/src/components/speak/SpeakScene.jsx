'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { SpeakCall } from '@/lib/speakClient';
import { track } from '@/lib/analytics';
import { characterOf, spriteSrc, ASSISTS } from '@/components/speak/characters';
import styles from '@/styles/pages/speak.module.scss';

const fmt = (s) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, Math.floor(s)) % 60).padStart(2, '0')}`;

const Icon = {
    close: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>,
    mic: <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M19 11a7 7 0 0 1-14 0" /><path d="M12 18v3" /></svg>,
    micOff: <svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M15 9.3V6a3 3 0 0 0-5.7-1.3" /><path d="M9 9v2a3 3 0 0 0 5 2.2" /><path d="M19 11a7 7 0 0 1-11.6 5.3M5 11a7 7 0 0 0 .6 2.8" /><path d="M12 18v3M3 3l18 18" /></svg>,
    help: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14" /><path d="M12 17.5h.01" /></svg>,
    script: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h10" /></svg>,
    slow: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /></svg>,
    check: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round"><path d="M5 12l5 5 9-10" /></svg>,
    tune: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 7h10M18 7h2M4 17h4M12 17h8" /><circle cx="16" cy="7" r="2" /><circle cx="10" cy="17" r="2" /></svg>,
};

// Long lines get a smaller size so they fit without scrolling.
const lineSize = (text) => (text.length > 110 ? styles.lineSmall : text.length > 60 ? styles.lineMedium : '');

export default function SpeakScene({ scenario, level, assist: initialAssist, language, nativeLanguage, nativeName, tier, onDone, onLimit }) {
    const ch = characterOf(scenario.character);
    const callRef = useRef(null);
    const micRingRef = useRef(null);
    const [status, setStatus] = useState('ready'); // ready | connecting | live | error
    const [error, setError] = useState('');
    const [speaking, setSpeaking] = useState(false);
    const [listening, setListening] = useState(false);
    const [muted, setMuted] = useState(false);
    const [mood, setMood] = useState(ch.rest);
    const [line, setLine] = useState({ id: null, text: '' });
    const [captions, setCaptions] = useState({});
    const [showNative, setShowNative] = useState(true);
    const [showRoman, setShowRoman] = useState(level === 'beginner');
    const [youLine, setYouLine] = useState('');
    const [goals, setGoals] = useState(() => scenario.goals.map(() => false));
    const [cards, setCards] = useState([]);
    const [suggestion, setSuggestion] = useState(null);
    const [transcript, setTranscript] = useState([]);
    const [sheet, setSheet] = useState(null); // 'script' | 'assist'
    const [assist, setAssist] = useState(initialAssist);
    const [timeLeft, setTimeLeft] = useState(null);
    const state = useRef({ goals: [], transcript: [], phrases: [], tips: [], summary: '', startedAt: 0, finished: false, notes: {} });

    const caption = useCallback(async (key, text) => {
        if (!text || !callRef.current?.sessionId) return null;
        try {
            const r = await fetch('/api/speak/translate', {
                method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ sessionId: callRef.current.sessionId, text }),
            });
            const d = await r.json();
            if (d.success) setCaptions((c) => ({ ...c, [key]: { native: d.translation, roman: d.romanization } }));
            return d;
        } catch { return null; }
    }, []);

    const finish = useCallback(async (reason = 'user') => {
        const s = state.current;
        if (s.finished) return;
        s.finished = true;
        const goalsDone = s.goals.filter(Boolean).length;
        const seconds = s.startedAt ? Math.round((Date.now() - s.startedAt) / 1000) : 0;
        track('speak_end', { scenario: scenario.id, seconds, goals: goalsDone, reason });
        const result = await callRef.current?.end({ goalsDone, transcript: s.transcript, reason });
        onDone({
            character: ch.id,
            goals: scenario.goals.map((g, i) => ({ text: g, done: !!s.goals[i] })),
            phrases: s.phrases, tips: s.tips, summary: s.summary, seconds,
            allowance: result?.allowance || null,
        });
    }, [onDone, scenario, ch.id]);

    useEffect(() => { state.current.goals = goals; }, [goals]);

    const start = () => {
        const s = state.current;
        setStatus('connecting');
        const showCard = (card) => {
            setCards((c) => [card, ...c].slice(0, 2));
            setTimeout(() => setCards((c) => c.filter((x) => x.key !== card.key)), 9000);
        };
        const onTool = (name, args) => {
            if (name === 'set_mood') setMood(args.mood);
            if (name === 'complete_goal') {
                const i = Number(args.goal) - 1;
                setGoals((g) => g.map((v, j) => (j === i ? true : v)));
                setMood(ch.celebrate);
            }
            if (name === 'suggest_reply' && args.phrase) {
                const key = `s${Date.now()}`;
                setSuggestion({ key, phrase: args.phrase, meaning: args.meaning || '' });
                caption(key, args.phrase);
            }
            if (name === 'pronunciation_tip' && args.word) {
                const card = { kind: args.good ? 'good' : 'tip', word: args.word, text: args.tip, key: `${Date.now()}t` };
                s.tips = [...s.tips, card];
                showCard(card);
            }
            if (name === 'teach_phrase' && args.phrase) {
                const card = { kind: 'phrase', word: args.phrase, text: args.meaning, key: `${Date.now()}p` };
                if (!s.phrases.some((p) => p.word === card.word)) s.phrases = [...s.phrases, card];
                showCard(card);
            }
            if (name === 'end_scene' && !s.ending) {
                s.ending = true;
                s.summary = args.summary || '';
                setTimeout(() => finish('complete'), 3500); // let the goodbye finish
            }
        };
        // GPT-Live can't call tools: after each line, a text model reads the
        // transcript and returns the same screen updates, plus the caption.
        const coachLine = async (id) => {
            s.coachSeq = (s.coachSeq || 0) + 1;
            const seq = s.coachSeq;
            try {
                const r = await fetch('/api/speak/coach', {
                    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: call.sessionId, transcript: s.transcript, assist: s.assist }),
                });
                const d = await r.json();
                if (!d.success || s.finished) return;
                setCaptions((c) => ({ ...c, [id]: { native: d.translation, roman: d.romanization } }));
                if (seq !== s.coachSeq) return; // a newer line has its own screen updates
                if (d.mood) onTool('set_mood', { mood: d.mood });
                (d.goals_done || []).filter((g) => !s.goals[g - 1]).forEach((g) => onTool('complete_goal', { goal: g }));
                if (d.suggestion?.phrase) onTool('suggest_reply', d.suggestion);
                if (d.new_phrase?.phrase && !s.phrases.some((p) => p.word === d.new_phrase.phrase)) onTool('teach_phrase', d.new_phrase);
                if (d.tip?.word && !s.tips.some((t) => t.word === d.tip.word && t.text === d.tip.tip)) onTool('pronunciation_tip', d.tip);
                if (d.end) onTool('end_scene', d.end);
            } catch { /* the call goes on without screen updates */ }
        };
        const call = new SpeakCall({
            onSpeaking: setSpeaking,
            onListening: (on) => { setListening(on); if (on) setYouLine('…'); },
            onHorangText: ({ id, text, done }) => {
                setLine({ id, text });
                if (done) {
                    s.transcript = [...s.transcript, { who: 'horang', text }];
                    setTranscript(s.transcript);
                    if (call.engine === 'live') coachLine(id); else caption(id, text);
                }
            },
            onYouText: ({ text }) => {
                if (!text.trim()) return;
                setYouLine(text);
                setSuggestion(null);
                s.transcript = [...s.transcript, { who: 'you', text }];
                setTranscript(s.transcript);
            },
            onTool,
            onDrop: () => { if (!s.finished) { setError('The call dropped.'); finish('dropped'); } },
        });
        callRef.current = call;
        call.start({ scenarioId: scenario.id, level, assist, language, nativeLanguage })
            .then((data) => {
                s.startedAt = Date.now();
                s.notes = data.assistNotes || {};
                s.assist = assist;
                setTimeLeft(data.maxSeconds);
                setStatus('live');
                track('speak_start', { scenario: scenario.id, level, assist, character: ch.id });
            })
            .catch((e) => {
                if (e.reachedLimit) { onLimit?.(e.allowance); return; }
                setStatus('error');
                setError(e.name === 'NotAllowedError'
                    ? 'Hanbok needs your microphone for this. Allow it in your browser (the icon next to the address bar) and try again.'
                    : (e.message || 'Could not start the call.'));
            });
    };

    // Leaving the page ends the call.
    useEffect(() => {
        const s = state.current;
        const leave = () => {
            if (!s.finished && callRef.current?.sessionId) {
                s.finished = true;
                callRef.current.end({ beacon: true, reason: 'left', goalsDone: s.goals.filter(Boolean).length, transcript: s.transcript });
            }
        };
        window.addEventListener('pagehide', leave);
        return () => { window.removeEventListener('pagehide', leave); leave(); callRef.current?.stopLocal(); };
    }, []);

    // Countdown; the server hangs up at zero as well.
    useEffect(() => {
        if (status !== 'live' || timeLeft === null) return undefined;
        if (timeLeft <= 0) { finish('time'); return undefined; }
        const t = setTimeout(() => setTimeLeft((x) => x - 1), 1000);
        return () => clearTimeout(t);
    }, [status, timeLeft, finish]);

    useEffect(() => { callRef.current?.setMuted(muted); }, [muted]);

    // Mic level ring: shows the learner their voice is getting through.
    useEffect(() => {
        if (status !== 'live') return undefined;
        let raf;
        const tick = () => {
            const v = callRef.current?.level() || 0;
            if (micRingRef.current) micRingRef.current.style.setProperty('--level', String(v));
            raf = requestAnimationFrame(tick);
        };
        raf = requestAnimationFrame(tick);
        return () => cancelAnimationFrame(raf);
    }, [status]);

    // Both mouth frames for the current mood, so talking never flickers.
    useEffect(() => {
        [mood, ch.celebrate].forEach((m) => [false, true].forEach((t) => { const img = new Image(); img.src = spriteSrc(ch.id, m, t); }));
    }, [mood, ch]);

    const help = () => {
        const how = {
            guided: `tell them in ${nativeName} exactly what to say next${callRef.current?.engine === 'live' ? ', say the phrase slowly' : ', call suggest_reply with it'}, and wait for them to try`,
            hints: `give a short hint in ${nativeName} (a key word or the first part), not the whole answer`,
            immersion: 'rephrase what you said more simply, or offer two choices',
        }[assist];
        callRef.current?.nudge(`(The learner tapped Help. Briefly ${how}.)`);
        track('speak_help', { assist });
    };
    const slower = () => callRef.current?.nudge('(The learner tapped "Again, slower". Repeat your last line slowly and clearly, then wait.)');
    const changeAssist = (a) => {
        setAssist(a);
        setSheet(null);
        state.current.assist = a;
        if (a !== assist && state.current.notes[a]) callRef.current?.nudge(state.current.notes[a], { speak: callRef.current?.engine !== 'live' });
        try { localStorage.setItem('speakAssist', a); } catch { /* private mode */ }
        track('speak_assist', { assist: a });
    };

    const cap = line.id ? captions[line.id] : null;
    const sugCap = suggestion ? captions[suggestion.key] : null;
    const assistLabel = ASSISTS.find((a) => a.id === assist)?.label;
    const sceneStyle = { backgroundImage: `url(/images/speak/bg/${scenario.background}.webp)`, '--accent': ch.color, '--accent-soft': ch.soft };

    return (
        <div className={styles.scene} style={sceneStyle}>
            <img
                key={`${mood}-${speaking}`}
                className={`${styles.sprite} ${ch.side === 'left' ? styles.spriteLeft : styles.spriteRight} ${speaking ? styles.spriteTalk : ''}`}
                src={spriteSrc(ch.id, mood, speaking)}
                alt={`${ch.name} looks ${mood}`}
            />

            <div className={styles.sceneTop}>
                <div className={styles.topRow}>
                    <button type="button" className={styles.iconBtn} onClick={() => (status === 'live' ? finish('user') : onDone(null))} aria-label="End the conversation">{Icon.close}</button>
                    <div className={styles.titleCard}>
                        <div className={styles.sceneTitle}>{scenario.title}</div>
                        <div className={styles.progress}><div style={{ width: `${(goals.filter(Boolean).length / goals.length) * 100}%` }} /></div>
                    </div>
                    {timeLeft !== null && <div className={`${styles.timer} ${timeLeft <= 60 ? styles.timerLow : ''}`} aria-label="Time left">{fmt(timeLeft)}</div>}
                </div>
                <ul className={styles.goals}>
                    {scenario.goals.map((g, i) => (
                        <li key={g} className={goals[i] ? styles.goalDone : ''}>{goals[i] && Icon.check}{g}</li>
                    ))}
                </ul>
                {status === 'live' && timeLeft !== null && timeLeft <= 60 && timeLeft > 0 && (
                    <div className={styles.lowTime}>
                        {fmt(timeLeft)} left in this call.
                        {tier < 1 && <> <Link href="/pricing">Basic gets 60 minutes a month</Link></>}
                    </div>
                )}
                <div className={styles.cards} aria-live="polite">
                    {cards.map((c) => (
                        <div key={c.key} className={`${styles.card} ${styles[`card_${c.kind}`]}`}>
                            <span className={styles.cardLabel}>{c.kind === 'phrase' ? 'New phrase' : c.kind === 'good' ? 'Sounded great' : 'Pronunciation tip'}</span>
                            <span lang={language} className={styles.cardWord}>{c.word}</span>
                            <span className={styles.cardText}>{c.text}</span>
                        </div>
                    ))}
                </div>
            </div>

            <div className={styles.sceneBottom}>
                {status === 'ready' && (
                    <div className={styles.readyCard}>
                        <p className={styles.readyKicker}>With {ch.name}</p>
                        <h2 className={styles.readyTitle}>{scenario.title}</h2>
                        <p className={styles.readyText}>
                            {ch.name} will start talking. Answer out loud, there&apos;s nothing to press. Tap <strong>Help</strong> anytime and {ch.name} will help in {nativeName}.
                        </p>
                        <div className={styles.assistPick} role="radiogroup" aria-label="How much help">
                            {ASSISTS.map((a) => (
                                <button key={a.id} type="button" role="radio" aria-checked={assist === a.id}
                                    className={assist === a.id ? styles.assistOn : ''} onClick={() => setAssist(a.id)}>
                                    <span>{a.label}</span>
                                </button>
                            ))}
                        </div>
                        <p className={styles.assistBlurb}>{ASSISTS.find((a) => a.id === assist)?.blurb}</p>
                        <button type="button" className={styles.startBtn} onClick={start}>{Icon.mic} Start talking</button>
                        <p className={styles.readyNote}>Headphones help {ch.name} hear you clearly.</p>
                    </div>
                )}

                {status === 'connecting' && <div className={styles.dialogue}><p className={styles.connecting}>Calling {ch.name}…</p></div>}

                {status === 'error' && (
                    <div className={styles.dialogue}>
                        <p className={styles.errorText}>{error}</p>
                        <button type="button" className={styles.startBtn} onClick={() => onDone(null)}>Back to scenes</button>
                    </div>
                )}

                {status === 'live' && (
                    <>
                        {suggestion && (
                            <div className={styles.suggest}>
                                <span className={styles.suggestLabel}>Try saying</span>
                                <span lang={language} className={styles.suggestPhrase}>{suggestion.phrase}</span>
                                {sugCap?.roman && <span className={styles.suggestRoman}>{sugCap.roman}</span>}
                                {suggestion.meaning && <span className={styles.suggestMeaning}>{suggestion.meaning}</span>}
                            </div>
                        )}
                        <div className={styles.dialogue}>
                            {youLine && <p className={styles.youLine}><span>You</span> <span lang={language}>{youLine}</span></p>}
                            <p lang={language} className={`${styles.lineTarget} ${lineSize(line.text || '')}`}>{line.text || '…'}</p>
                            {showRoman && cap?.roman && <p className={styles.lineRoman}>{cap.roman}</p>}
                            {showNative && cap?.native && cap.native !== line.text && <p className={styles.lineNative}>{cap.native}</p>}
                            <div className={styles.lineTools}>
                                <button type="button" onClick={slower}>{Icon.slow}Slower</button>
                                <button type="button" aria-pressed={showRoman} className={showRoman ? styles.toolOn : ''} onClick={() => setShowRoman((v) => !v)}>Aa</button>
                                <button type="button" aria-pressed={showNative} className={showNative ? styles.toolOn : ''} onClick={() => setShowNative((v) => !v)}>{nativeName}</button>
                                <button type="button" onClick={() => setSheet('script')}>Script</button>
                            </div>
                        </div>
                        <div className={styles.controls}>
                            <button type="button" className={styles.sideBtn} onClick={help}>{Icon.help}Help</button>
                            <button
                                ref={micRingRef}
                                type="button"
                                className={`${styles.micBtn} ${muted ? styles.micMuted : ''} ${listening ? styles.micHearing : ''}`}
                                onClick={() => setMuted((m) => !m)}
                                aria-pressed={muted}
                                aria-label={muted ? 'Unmute your microphone' : 'Mute your microphone'}
                            >
                                {muted ? Icon.micOff : Icon.mic}
                            </button>
                            <button type="button" className={styles.sideBtn} onClick={() => setSheet('assist')}>{Icon.tune}{assistLabel}</button>
                        </div>
                        <p className={styles.status}>
                            {muted ? 'Muted. Tap the mic to talk again.' : speaking ? `${ch.name} is talking. You can cut in anytime.` : listening ? 'Listening…' : 'Your turn. Just talk.'}
                        </p>
                    </>
                )}
            </div>

            {sheet === 'script' && (
                <div className={styles.sheet} role="dialog" aria-label="Conversation so far">
                    <div className={styles.sheetHead}>
                        <h2>Conversation</h2>
                        <button type="button" className={styles.iconBtn} onClick={() => setSheet(null)} aria-label="Close">{Icon.close}</button>
                    </div>
                    <ol className={styles.script}>
                        {transcript.map((m, i) => (
                            <li key={i} className={m.who === 'you' ? styles.scriptYou : styles.scriptChar}>
                                <span className={styles.scriptWho}>{m.who === 'you' ? 'You' : ch.name}</span>
                                <span lang={language}>{m.text}</span>
                            </li>
                        ))}
                        {!transcript.length && <li className={styles.scriptEmpty}>Nothing yet.</li>}
                    </ol>
                </div>
            )}

            {sheet === 'assist' && (
                <div className={styles.sheet} role="dialog" aria-label="How much help">
                    <div className={styles.sheetHead}>
                        <h2>How much help?</h2>
                        <button type="button" className={styles.iconBtn} onClick={() => setSheet(null)} aria-label="Close">{Icon.close}</button>
                    </div>
                    <div className={styles.assistList}>
                        {ASSISTS.map((a) => (
                            <button key={a.id} type="button" className={`${styles.assistRow} ${assist === a.id ? styles.assistRowOn : ''}`} onClick={() => changeAssist(a.id)}>
                                <strong>{a.label}</strong>
                                <span>{a.blurb}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
