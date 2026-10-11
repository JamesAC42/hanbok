'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import Link from 'next/link';
import { SpeakCall } from '@/lib/speakClient';
import { track } from '@/lib/analytics';
import { speakEvent } from '@/lib/speakEvents';
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
// Keeps showing the current picture until the next one is decoded, so
// switching faces or mouth frames never flashes blank.
function useDecodedSrc(src) {
    const [shown, setShown] = useState(src);
    useEffect(() => {
        let live = true;
        const img = new Image();
        img.src = src;
        const show = () => { if (live) setShown(src); };
        (img.decode ? img.decode() : Promise.resolve()).then(show, show);
        return () => { live = false; };
    }, [src]);
    return shown;
}

// The transcript with the character's line added, or updated when it's the
// line they're still on.
const withLine = (list, id, text) => {
    const last = list[list.length - 1];
    return last?.id === id ? [...list.slice(0, -1), { id, who: 'horang', text }] : [...list, { id, who: 'horang', text }];
};

// Rough match between two spoken lines (shared letter pairs), for telling
// whether the learner already said a scene's starter phrase.
const pairs = (t) => {
    const b = String(t || '').replace(/[\s.,!?~'"…_]/g, '');
    const out = [];
    for (let i = 0; i < b.length - 1; i += 1) out.push(b.slice(i, i + 2));
    return out;
};
const sounds = (a, b) => {
    const x = pairs(a);
    const pool = pairs(b);
    const total = x.length + pool.length;
    if (!x.length || !pool.length) return false;
    let hit = 0;
    for (const g of x) { const k = pool.indexOf(g); if (k >= 0) { hit += 1; pool.splice(k, 1); } }
    return (2 * hit) / total >= 0.5;
};

const lineSize = (text) => (text.length > 110 ? styles.lineSmall : text.length > 60 ? styles.lineMedium : '');

export default function SpeakScene({ scenario, level, assist: initialAssist, language, nativeLanguage, nativeName, tier, beta = true, onDone, onLimit }) {
    const ch = characterOf(scenario.character);
    const callRef = useRef(null);
    const micRingRef = useRef(null);
    const [status, setStatus] = useState('ready'); // ready | connecting | live | error
    const [engine, setEngine] = useState(null);
    const [ending, setEnding] = useState(false);
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
            if (d.success) setCaptions((c) => ({ ...c, [key]: { native: d.translation, roman: d.romanization, for: text } }));
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
        const sessionId = callRef.current?.sessionId || null;
        const notes = {
            goals: scenario.goals.map((g, i) => !!s.goals[i]),
            summary: s.summary,
            phrases: s.phrases.map(({ word, text }) => ({ word, text })),
            tips: s.tips.map(({ word, text, kind }) => ({ word, text, kind })),
        };
        const result = await callRef.current?.end({ goalsDone, transcript: s.transcript, reason, ...notes });
        onDone({
            sessionId,
            scenario,
            character: ch.id,
            goals: scenario.goals.map((g, i) => ({ text: g, done: !!s.goals[i] })),
            phrases: s.phrases, tips: s.tips, summary: s.summary, seconds,
            lines: s.transcript.filter((m) => m.who === 'you').length,
            transcript: s.transcript.map(({ who, text }) => ({ who, text })),
            reason,
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
                s.goals = scenario.goals.map((g, j) => j === i || !!s.goals[j]);
                setGoals((g) => g.map((v, j) => (j === i ? true : v)));
                setMood(ch.celebrate);
            }
            if (name === 'suggest_reply' && args.phrase) {
                // Keep the card still unless the phrase itself changed.
                const bare = (t) => String(t || '').replace(/[\s.,!?~'"…]/g, '');
                setSuggestion((cur) => {
                    if (cur && bare(cur.phrase) === bare(args.phrase)) return cur;
                    const key = `s${Date.now()}`;
                    if (!args.romanization) caption(key, args.phrase);
                    return { key, phrase: args.phrase, meaning: args.meaning || '', roman: args.romanization || '' };
                });
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
                setEnding(true);
                setMood(ch.celebrate);
                // Hang up only once the goodbye has actually finished playing.
                call.waitForQuiet().then(() => setTimeout(() => finish('complete'), 400));
            }
        };
        // GPT-Live can't call tools: after each line, a text model reads the
        // transcript and returns the same screen updates, plus the caption. It
        // runs as soon as the line's words are in (the audio is still playing),
        // and what the learner should say next waits until the character stops.
        const coachLine = async (id, text) => {
            if (s.coached?.id === id && s.coached.text === text) return;
            s.coached = { id, text };
            s.coachSeq = (s.coachSeq || 0) + 1;
            const seq = s.coachSeq;
            try {
                const r = await fetch('/api/speak/coach', {
                    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: call.sessionId, transcript: withLine(s.transcript, id, text), assist: s.assist }),
                });
                const d = await r.json();
                if (s.finished) return;
                if (!d.success) throw new Error(d.error || 'coach failed');
                setCaptions((c) => ({ ...c, [id]: { native: d.translation, roman: d.romanization, for: text } }));
                if (seq !== s.coachSeq) return; // a newer line has its own screen updates
                if (d.mood) onTool('set_mood', { mood: d.mood });
                (d.goals_done || []).filter((g) => !s.goals[g - 1]).forEach((g) => onTool('complete_goal', { goal: g }));
                if (d.new_phrase?.phrase && !s.phrases.some((p) => p.word === d.new_phrase.phrase)) onTool('teach_phrase', d.new_phrase);
                if (d.tip?.word && !s.tips.some((t) => t.word === d.tip.word && t.text === d.tip.tip)) onTool('pronunciation_tip', d.tip);
                s.turnScreen = { id, text, d };
                showTurn();
            } catch {
                // No coach right now: clear the caption placeholders and fall
                // back to the scene's starter phrase for the next goal.
                if (s.finished) return;
                setCaptions((c) => ({ ...c, [id]: { native: '', roman: '', for: text } }));
                if (seq !== s.coachSeq) return;
                s.turnScreen = { id, text, d: { suggestion: fallbackSuggestion() } };
                showTurn();
            }
        };
        const fallbackSuggestion = () => {
            if (s.assist === 'immersion') return null;
            const said = s.transcript.filter((m) => m.who === 'you').map((m) => m.text);
            const i = scenario.goals.findIndex((g, j) => !s.goals[j] && scenario.phrases?.[j] && !said.some((t) => sounds(t, scenario.phrases[j])));
            return i >= 0 ? { phrase: scenario.phrases[i], meaning: scenario.goals[i] } : null;
        };
        // Once the character has finished the line the coach read: the "Try
        // saying" card, and the end of the scene when it's really over (every
        // goal done and a goodbye, not a question still waiting for an answer).
        const showTurn = () => {
            const t = s.turnScreen;
            if (!t || s.talking || s.lineDone?.id !== t.id || s.lineDone.text !== t.text) return;
            s.turnScreen = null;
            if (t.d.suggestion?.phrase && !s.heardAfter) onTool('suggest_reply', t.d.suggestion);
            const allDone = scenario.goals.every((g, i) => s.goals[i]);
            if (t.d.end && allDone && !/[?？]\s*$/.test(t.text)) onTool('end_scene', t.d.end);
        };
        const call = new SpeakCall({
            onSpeaking: setSpeaking,
            onListening: (on) => { setListening(on); if (on) setYouLine('…'); },
            // A new line from the character: the last "Try saying" is stale until they finish.
            onLineStart: () => {
                s.talking = true;
                s.lineDone = null;
                s.turnScreen = null;
                s.coachSeq = (s.coachSeq || 0) + 1;
                setSuggestion(null);
            },
            onHorangText: ({ id, text, done, settled }) => {
                setLine({ id, text });
                if (call.engine !== 'live') {
                    if (done) {
                        s.transcript = withLine(s.transcript, id, text);
                        setTranscript(s.transcript);
                        caption(id, text);
                    }
                    return;
                }
                if (settled) coachLine(id, text);
                if (done) {
                    s.transcript = withLine(s.transcript, id, text);
                    setTranscript(s.transcript);
                    s.talking = false;
                    s.heardAfter = false;
                    s.lineDone = { id, text };
                    coachLine(id, text);
                    showTurn();
                }
            },
            onYouText: ({ id, text }) => {
                if (!text.trim()) return;
                setYouLine(text);
                setSuggestion(null);
                s.heardAfter = true;
                const last = s.transcript[s.transcript.length - 1];
                s.transcript = id && last?.id === id ? [...s.transcript.slice(0, -1), { id, who: 'you', text }] : [...s.transcript, { id, who: 'you', text }];
                setTranscript(s.transcript);
            },
            onTool,
            onDrop: (reason) => {
                track('speak_drop', { reason: String(reason || ''), engine: call.engine });
                if (!s.finished) { setError('The call dropped.'); finish(`dropped:${reason || ''}`.slice(0, 20)); }
            },
            onError: (err) => track('speak_error', { code: String(err?.code || err?.type || ''), engine: call.engine }),
        });
        callRef.current = call;
        call.start({ scenarioId: scenario.id, level, assist, language, nativeLanguage })
            .then((data) => {
                s.startedAt = Date.now();
                s.notes = data.assistNotes || {};
                s.assist = assist;
                setTimeLeft(data.maxSeconds);
                setEngine(data.engine);
                setStatus('live');
                track('speak_start', { scenario: scenario.id, level, assist, character: ch.id });
                speakEvent('call_connected', { scene: scenario.id, assist }, call.sessionId);
            })
            .catch((e) => {
                if (e.reachedLimit) { onLimit?.(e.allowance); return; }
                speakEvent(e.name === 'NotAllowedError' ? 'mic_denied' : 'connect_failed', { scene: scenario.id, reason: String(e.name || e.message || '').slice(0, 40) });
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

    // Countdown; the server hangs up a few seconds after zero. Near the end the
    // character is asked to wrap up, and at zero the call waits for them to
    // finish their sentence.
    useEffect(() => {
        if (status !== 'live' || timeLeft === null) return undefined;
        const s = state.current;
        if (timeLeft === 30 && !s.ending && !s.wrapAsked) {
            s.wrapAsked = true;
            callRef.current?.nudge('(Only about 30 seconds are left in this call. On your next turn, wrap up the scene warmly in one or two short sentences and say goodbye.)', { speak: false });
        }
        if (timeLeft <= 0) {
            if (!s.timeUp) {
                s.timeUp = true;
                s.ending = true;
                setEnding('time');
                const call = callRef.current;
                (call ? call.waitForQuiet({ quietMs: 700, maxMs: 4000 }) : Promise.resolve()).then(() => finish('time'));
            }
            return undefined;
        }
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

    // Every face and mouth frame, decoded up front so nothing pops in mid-call.
    useEffect(() => {
        const imgs = ch.moods.flatMap((m) => [false, true].map((t) => {
            const img = new Image();
            img.src = spriteSrc(ch.id, m, t);
            img.decode?.().catch(() => {});
            return img;
        }));
        return () => { imgs.length = 0; };
    }, [ch]);
    const sprite = useDecodedSrc(spriteSrc(ch.id, mood, speaking));

    const help = () => {
        const how = {
            guided: `tell them in ${nativeName} exactly what to say next${callRef.current?.engine === 'live' ? ', say the phrase slowly' : ', call suggest_reply with it'}, and wait for them to try`,
            hints: `give a short hint in ${nativeName} (a key word or the first part), not the whole answer`,
            immersion: 'rephrase what you said more simply, or offer two choices',
        }[assist];
        callRef.current?.nudge(`(The learner tapped Help. Briefly ${how}.)`);
        speakEvent('help_tap', { assist }, callRef.current?.sessionId);
    };
    const slower = () => {
        callRef.current?.nudge('(The learner tapped "Again, slower". Repeat your last line slowly and clearly, then wait.)');
        speakEvent('slower_tap', {}, callRef.current?.sessionId);
    };
    const changeAssist = (a) => {
        setAssist(a);
        setSheet(null);
        state.current.assist = a;
        if (a !== assist && state.current.notes[a]) callRef.current?.nudge(state.current.notes[a], { speak: callRef.current?.engine !== 'live' });
        try { localStorage.setItem('speakAssist', a); } catch { /* private mode */ }
        if (a !== assist) speakEvent('assist_change', { assist: a }, callRef.current?.sessionId);
    };

    // A caption made for an earlier, shorter version of the line waits for the new one.
    const cap = line.id && captions[line.id]?.for === line.text ? captions[line.id] : null;
    const sugCap = suggestion ? captions[suggestion.key] : null;
    const assistLabel = ASSISTS.find((a) => a.id === assist)?.label;
    const sceneStyle = { backgroundImage: `url(/images/speak/bg/${scenario.background}.webp)`, '--accent': ch.color, '--accent-soft': ch.soft };

    return (
        <div className={styles.scene} style={sceneStyle}>
            <img
                className={`${styles.sprite} ${ch.side === 'left' ? styles.spriteLeft : styles.spriteRight} ${speaking ? styles.spriteTalk : ''}`}
                src={sprite}
                alt={`${ch.name} looks ${mood}`}
            />

            <div className={styles.sceneTop}>
                <div className={styles.topRow}>
                    <button type="button" className={styles.iconBtn} onClick={() => { if (status === 'live') { speakEvent('hang_up', {}, callRef.current?.sessionId); finish('user'); } else onDone(null); }} aria-label="End the conversation">{Icon.close}</button>
                    <div className={styles.titleCard}>
                        <div className={styles.sceneTitle}>{scenario.title}{beta && <span className={styles.betaTag}>Beta</span>}</div>
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
                {ending && (
                    <div className={styles.endBanner} role="status">
                        <span className={styles.endStars} aria-hidden="true">★★★</span>
                        {ending === 'time' ? "Time's up!" : goals.every(Boolean) ? 'Scene complete!' : 'Wrapping up…'}
                        <span className={styles.endSub}>{ending === 'time' ? 'Saving your conversation' : `${ch.name} is saying goodbye`}</span>
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
                        {beta && <p className={styles.readyNote}>Speak is in beta. If anything goes wrong, tell us after the call and you&apos;ll get the minutes back.</p>}
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
                                {(suggestion.roman || sugCap?.roman) && <span className={styles.suggestRoman}>{suggestion.roman || sugCap.roman}</span>}
                                {suggestion.meaning && <span className={styles.suggestMeaning}>{suggestion.meaning}</span>}
                            </div>
                        )}
                        <div className={styles.dialogue}>
                            {youLine && <p className={styles.youLine}><span>You</span> <span lang={language}>{youLine}</span></p>}
                            <p lang={language} className={`${styles.lineTarget} ${lineSize(line.text || '')}`}>{line.text || (engine === 'live' && !youLine ? `Say hello to ${ch.name} to start!` : '…')}</p>
                            {/* Caption rows keep their space while the caption loads, so the box doesn't jump. */}
                            {showRoman && (cap ? cap.roman : true) && <p className={`${styles.lineRoman} ${cap ? '' : styles.pending}`}>{cap?.roman || '\u00a0'}</p>}
                            {showNative && (cap ? cap.native && cap.native !== line.text : true) && <p className={`${styles.lineNative} ${cap ? '' : styles.pending}`}>{cap?.native || '\u00a0'}</p>}
                            <div className={styles.lineTools}>
                                <button type="button" onClick={slower}>{Icon.slow}Slower</button>
                                <button type="button" aria-pressed={showRoman} className={showRoman ? styles.toolOn : ''} onClick={() => setShowRoman((v) => !v)}>Aa</button>
                                <button type="button" aria-pressed={showNative} className={showNative ? styles.toolOn : ''} onClick={() => { setShowNative((v) => !v); speakEvent('english_toggle', { on: !showNative }, callRef.current?.sessionId); }}>{nativeName}</button>
                                <button type="button" onClick={() => { setSheet('script'); speakEvent('script_open', {}, callRef.current?.sessionId); }}>Script</button>
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
