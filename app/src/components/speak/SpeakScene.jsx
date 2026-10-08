'use client';
import { useEffect, useRef, useState, useCallback } from 'react';
import { SpeakCall } from '@/lib/speakClient';
import { track } from '@/lib/analytics';
import styles from '@/styles/pages/speak.module.scss';

const MOODS = ['neutral', 'happy', 'amused', 'encouraging', 'explaining', 'thinking', 'shocked', 'exasperated', 'apologetic', 'proud', 'smug', 'serious'];
const horangSrc = (mood, talking) => `/images/speak/horang/${MOODS.includes(mood) ? mood : 'happy'}${talking ? '_talk' : ''}.webp`;

const fmt = (s) => `${Math.floor(Math.max(0, s) / 60)}:${String(Math.max(0, Math.floor(s)) % 60).padStart(2, '0')}`;

const Icon = {
    close: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M18 6 6 18M6 6l12 12" /></svg>,
    mic: <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><rect x="9" y="3" width="6" height="11" rx="3" /><path d="M19 11a7 7 0 0 1-14 0" /><path d="M12 18v3" /></svg>,
    micOff: <svg viewBox="0 0 24 24" width="40" height="40" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d="M15 9.3V6a3 3 0 0 0-5.7-1.3" /><path d="M9 9v2a3 3 0 0 0 5 2.2" /><path d="M19 11a7 7 0 0 1-11.6 5.3M5 11a7 7 0 0 0 .6 2.8" /><path d="M12 18v3M3 3l18 18" /></svg>,
    help: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><circle cx="12" cy="12" r="9" /><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.6.3-1 .9-1 1.6V14" /><path d="M12 17.5h.01" /></svg>,
    script: <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h10" /></svg>,
    slow: <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><path d="M11 5 6 9H2v6h4l5 4V5z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /></svg>,
    check: <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="3.2" strokeLinecap="round"><path d="M5 12l5 5 9-10" /></svg>,
};

export default function SpeakScene({ scenario, level, language, nativeLanguage, nativeName, onDone, onLimit }) {
    const callRef = useRef(null);
    const [status, setStatus] = useState('connecting'); // connecting | live | error
    const [error, setError] = useState('');
    const [speaking, setSpeaking] = useState(false);
    const [listening, setListening] = useState(false);
    const [muted, setMuted] = useState(false);
    const [mood, setMood] = useState('happy');
    const [line, setLine] = useState({ id: null, text: '' });
    const [translations, setTranslations] = useState({});
    const [showEnglish, setShowEnglish] = useState(true);
    const [youLine, setYouLine] = useState('');
    const [goals, setGoals] = useState(() => scenario.goals.map(() => false));
    const [cards, setCards] = useState([]); // tips and phrases, newest first
    const [transcript, setTranscript] = useState([]);
    const [showScript, setShowScript] = useState(false);
    const [timeLeft, setTimeLeft] = useState(null);
    const state = useRef({ goals: [], transcript: [], phrases: [], tips: [], summary: '', startedAt: 0, finished: false });

    const finish = useCallback(async (reason = 'user') => {
        const s = state.current;
        if (s.finished) return;
        s.finished = true;
        const goalsDone = s.goals.filter(Boolean).length;
        const seconds = s.startedAt ? Math.round((Date.now() - s.startedAt) / 1000) : 0;
        track('speak_end', { scenario: scenario.id, seconds, goals: goalsDone, reason });
        const result = await callRef.current?.end({ goalsDone, transcript: s.transcript, reason });
        onDone({
            goals: scenario.goals.map((g, i) => ({ text: g, done: !!s.goals[i] })),
            phrases: s.phrases, tips: s.tips, summary: s.summary, seconds,
            allowance: result?.allowance || null,
        });
    }, [onDone, scenario]);

    useEffect(() => {
        state.current.goals = goals;
    }, [goals]);

    useEffect(() => {
        const s = state.current;
        const translate = async (id, text) => {
            if (!text || !callRef.current?.sessionId) return;
            try {
                const r = await fetch('/api/speak/translate', {
                    method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ sessionId: callRef.current.sessionId, text }),
                });
                const d = await r.json();
                if (d.translation) setTranslations((t) => ({ ...t, [id]: d.translation }));
            } catch { /* captions are a bonus */ }
        };
        // Tip and phrase cards float over the scene for a few seconds.
        const showCard = (card) => {
            setCards((c) => [card, ...c].slice(0, 2));
            setTimeout(() => setCards((c) => c.filter((x) => x.key !== card.key)), 9000);
        };
        const call = new SpeakCall({
            onSpeaking: setSpeaking,
            onListening: (on) => { setListening(on); if (on) setYouLine('…'); },
            onHorangText: ({ id, text, done }) => {
                setLine({ id, text });
                if (done) {
                    s.transcript = [...s.transcript, { who: 'horang', text }];
                    setTranscript(s.transcript);
                    translate(id, text);
                }
            },
            onYouText: ({ text }) => {
                if (!text.trim()) return;
                setYouLine(text);
                s.transcript = [...s.transcript, { who: 'you', text }];
                setTranscript(s.transcript);
            },
            onTool: (name, args) => {
                if (name === 'set_mood') setMood(args.mood);
                if (name === 'complete_goal') {
                    const i = Number(args.goal) - 1;
                    setGoals((g) => g.map((v, j) => (j === i ? true : v)));
                    setMood('proud');
                }
                if (name === 'pronunciation_tip' && args.word) {
                    const card = { kind: args.good ? 'good' : 'tip', word: args.word, text: args.tip, key: `${Date.now()}` };
                    s.tips = [...s.tips, card];
                    showCard(card);
                }
                if (name === 'teach_phrase' && args.phrase) {
                    const card = { kind: 'phrase', word: args.phrase, text: args.meaning, key: `${Date.now()}p` };
                    if (!s.phrases.some((p) => p.word === card.word)) s.phrases = [...s.phrases, card];
                    showCard(card);
                }
                if (name === 'end_scene') {
                    s.summary = args.summary || '';
                    // Let the goodbye finish before hanging up.
                    setTimeout(() => finish('complete'), 3500);
                }
            },
            onDrop: () => { if (!s.finished) { setError('The call dropped.'); finish('dropped'); } },
        });
        callRef.current = call;
        call.start({ scenarioId: scenario.id, level, language, nativeLanguage })
            .then((data) => {
                s.startedAt = Date.now();
                setTimeLeft(data.maxSeconds);
                setStatus('live');
                track('speak_start', { scenario: scenario.id, level });
            })
            .catch((e) => {
                if (e.reachedLimit) { onLimit?.(e.allowance); return; }
                setStatus('error');
                setError(e.name === 'NotAllowedError'
                    ? 'Hanbok needs your microphone to talk with Horang. Allow it in your browser and try again.'
                    : (e.message || 'Could not start the call.'));
            });
        const leave = () => { if (!s.finished && callRef.current?.sessionId) { s.finished = true; callRef.current.end({ beacon: true, reason: 'left', goalsDone: s.goals.filter(Boolean).length, transcript: s.transcript }); } };
        window.addEventListener('pagehide', leave);
        return () => { window.removeEventListener('pagehide', leave); leave(); call.stopLocal(); };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Countdown; the server hangs up at zero as well.
    useEffect(() => {
        if (status !== 'live' || timeLeft === null) return undefined;
        if (timeLeft <= 0) { finish('time'); return undefined; }
        const t = setTimeout(() => setTimeLeft((x) => x - 1), 1000);
        return () => clearTimeout(t);
    }, [status, timeLeft, finish]);

    useEffect(() => { callRef.current?.setMuted(muted); }, [muted]);

    // Load both mouth frames for the current mood so talking never flickers.
    useEffect(() => {
        [mood, 'proud'].forEach((m) => { [false, true].forEach((t) => { const img = new Image(); img.src = horangSrc(m, t); }); });
    }, [mood]);

    const help = () => callRef.current?.nudge(`(The learner tapped the Help button. In ${nativeName}, in one or two short sentences, tell them what they could say next and give the phrase, then wait for them to try.)`);
    const slower = () => callRef.current?.nudge('(The learner tapped "Again, slower". Repeat your last line slowly and clearly, then wait.)');

    const translation = line.id ? translations[line.id] : '';

    return (
        <div className={styles.scene} style={{ backgroundImage: `url(/images/speak/bg/${scenario.background}.webp)` }}>
            <div className={styles.sceneTop}>
                <div className={styles.topRow}>
                    <button type="button" className={styles.iconBtn} onClick={() => finish('user')} aria-label="End the conversation">{Icon.close}</button>
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

            <img
                key={`${mood}-${speaking}`}
                className={`${styles.horang} ${speaking ? styles.horangTalk : ''}`}
                src={horangSrc(mood, speaking)}
                alt={`Horang looks ${mood}`}
            />

            <div className={styles.dialogue}>
                {status === 'connecting' && <p className={styles.connecting}>Calling Horang…</p>}
                {status === 'error' && (
                    <div className={styles.errorBox}>
                        <p>{error}</p>
                        <button type="button" className={styles.primaryBtn} onClick={() => onDone(null)}>Back to scenes</button>
                    </div>
                )}
                {status === 'live' && (
                    <>
                        {youLine && <p className={styles.youLine}><span>You</span> <span lang={language}>{youLine}</span></p>}
                        <p lang={language} className={styles.lineTarget}>{line.text || '…'}</p>
                        {showEnglish && translation && <p className={styles.lineNative}>{translation}</p>}
                        <div className={styles.lineTools}>
                            <button type="button" onClick={slower}>{Icon.slow}Again, slower</button>
                            <button type="button" onClick={() => setShowEnglish((v) => !v)}>{showEnglish ? `Hide ${nativeName}` : `Show ${nativeName}`}</button>
                        </div>
                    </>
                )}
            </div>

            {status === 'live' && (
                <div className={styles.controls}>
                    {scenario.phrases?.length > 0 && (
                        <div className={styles.hints}>
                            {scenario.phrases.map((p) => <span key={p} lang={language}>{p}</span>)}
                        </div>
                    )}
                    <div className={styles.buttons}>
                        <button type="button" className={styles.sideBtn} onClick={help}>{Icon.help}Help</button>
                        <button
                            type="button"
                            className={`${styles.micBtn} ${muted ? styles.micMuted : ''} ${listening ? styles.micHearing : ''}`}
                            onClick={() => setMuted((m) => !m)}
                            aria-pressed={muted}
                            aria-label={muted ? 'Unmute your microphone' : 'Mute your microphone'}
                        >
                            {muted ? Icon.micOff : Icon.mic}
                        </button>
                        <button type="button" className={styles.sideBtn} onClick={() => setShowScript(true)}>{Icon.script}Script</button>
                    </div>
                    <p className={styles.status}>
                        {muted ? 'Muted. Tap the mic to talk again.' : speaking ? 'Horang is talking. You can cut in anytime.' : listening ? 'Listening…' : 'Your turn. Just talk.'}
                    </p>
                </div>
            )}

            {showScript && (
                <div className={styles.sheet} role="dialog" aria-label="Conversation so far">
                    <div className={styles.sheetHead}>
                        <h2>Conversation</h2>
                        <button type="button" className={styles.iconBtn} onClick={() => setShowScript(false)} aria-label="Close">{Icon.close}</button>
                    </div>
                    <ol className={styles.script}>
                        {transcript.map((m, i) => (
                            <li key={i} className={m.who === 'you' ? styles.scriptYou : styles.scriptHorang}>
                                <span className={styles.scriptWho}>{m.who === 'you' ? 'You' : 'Horang'}</span>
                                <span lang={language}>{m.text}</span>
                            </li>
                        ))}
                        {!transcript.length && <li className={styles.scriptEmpty}>Nothing yet.</li>}
                    </ol>
                </div>
            )}
        </div>
    );
}
