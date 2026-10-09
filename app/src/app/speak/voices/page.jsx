'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Dashboard from '@/components/Dashboard';
import { CHARACTERS } from '@/components/speak/characters';
import styles from '@/styles/pages/speak.module.scss';

// Admin page for picking each character's voice by ear. Each sample is a short
// GPT-Live call where the character performs an audition line; it is recorded
// in the browser so replays are instant and free.
const OLD_VOICES = ['cedar', 'ash', 'echo', 'verse', 'ballad', 'alloy', 'marin', 'coral', 'sage', 'shimmer'];
const NEW_VOICES = ['beacon', 'bossa', 'cinder', 'delta', 'gleam', 'meridian', 'quartz', 'ripple', 'stone', 'tempo', 'vesper', 'willow'];
const DEFAULTS = { horang: 'cedar', sora: 'marin' };
const SILENCE_END_MS = 2000;
const MAX_MS = 25000;

const pickKey = (ch) => `speakVoice.${ch}`;
const readPick = (ch) => { try { return localStorage.getItem(pickKey(ch)) || ''; } catch { return ''; } };

async function recordSample({ voice, character, onText, log }) {
    const t0 = Date.now();
    const note = (m) => log(`${((Date.now() - t0) / 1000).toFixed(1)}s ${m}`);
    const pc = new RTCPeerConnection();
    pc.onconnectionstatechange = () => note(`connection: ${pc.connectionState}`);
    pc.oniceconnectionstatechange = () => note(`ice: ${pc.iceConnectionState}`);
    // A silent outgoing track: the sample never needs the microphone.
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const silent = ctx.createMediaStreamDestination();
    pc.addTrack(silent.stream.getAudioTracks()[0], silent.stream);
    const dc = pc.createDataChannel('oai-events');
    dc.addEventListener('open', () => note('data channel open'));
    dc.addEventListener('close', () => note('data channel closed'));
    const audio = new Audio();
    audio.autoplay = true;
    let recorder = null;
    const chunks = [];
    let meter = null;
    pc.ontrack = (e) => {
        note('audio track arrived');
        audio.srcObject = e.streams[0];
        audio.play?.().then(() => note('audio playing'), (err) => note(`audio blocked: ${err.name}`));
        // Logs when sound actually comes in, to tell "silent" from "no captions".
        try {
            const an = ctx.createAnalyser();
            ctx.createMediaStreamSource(e.streams[0]).connect(an);
            const buf = new Uint8Array(an.fftSize);
            let heard = false;
            meter = setInterval(() => {
                an.getByteTimeDomainData(buf);
                const loud = buf.some((v) => Math.abs(v - 128) > 6);
                if (loud && !heard) note('sound is coming in');
                heard = heard || loud;
            }, 200);
        } catch { /* meter is optional */ }
        try {
            recorder = new MediaRecorder(e.streams[0]);
            recorder.ondataavailable = (ev) => { if (ev.data.size) chunks.push(ev.data); };
            recorder.start();
        } catch { /* playback still works without a recording */ }
    };
    await pc.setLocalDescription(await pc.createOffer());
    await new Promise((r) => { if (pc.iceGatheringState === 'complete') r(); else { pc.onicegatheringstatechange = () => pc.iceGatheringState === 'complete' && r(); setTimeout(r, 2500); } });
    const res = await fetch('/api/speak/voice-sample', {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ voice, character, sdp: pc.localDescription.sdp }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.success) { pc.close(); ctx.close(); throw new Error(data.error || `HTTP ${res.status}`); }
    note(`session ${data.callId}`);
    await pc.setRemoteDescription({ type: 'answer', sdp: data.answer });
    ctx.resume?.();

    return new Promise((resolve) => {
        let text = '';
        let quiet = null;
        const done = () => {
            clearTimeout(retry);
            clearInterval(meter);
            note('finished');
            clearTimeout(quiet);
            clearTimeout(cap);
            const finish = () => {
                try { dc.close(); pc.close(); } catch { /* closed */ }
                ctx.close().catch(() => {});
                resolve(chunks.length ? URL.createObjectURL(new Blob(chunks, { type: chunks[0].type || 'audio/webm' })) : null);
            };
            if (recorder && recorder.state !== 'inactive') { recorder.onstop = finish; recorder.stop(); } else finish();
        };
        const cap = setTimeout(done, MAX_MS);
        // The server seeds a "connected" turn, so the voice should start on its
        // own; if it's still quiet after session.started, nudge it (twice at most).
        let kicked = 0;
        const kick = () => {
            if (text || dc.readyState !== 'open' || kicked++ >= 2) return;
            note('sent start nudge');
            dc.send(JSON.stringify({ type: 'session.commentary.append', delegation_id: null, content: '(Connected. Perform your audition lines now.)' }));
        };
        let retry = null;
        dc.onmessage = (e) => {
            let ev = {};
            try { ev = JSON.parse(e.data); } catch { return; }
            if (ev.type !== 'session.output_transcript.delta' || !text) note(`event: ${ev.type}${ev.error ? ` ${ev.error.message || ev.error.code}` : ''}${ev.reason ? ` (${ev.reason})` : ''}${ev.message ? ` ${ev.message}` : ''}`);
            if (ev.type === 'session.started') retry = setTimeout(() => { kick(); retry = setTimeout(kick, 5000); }, 3000);
            if (ev.type === 'error') onText(`Error: ${ev.error?.message || ev.error?.code || 'unknown'}`);
            if (ev.type === 'session.output_transcript.delta') {
                text += ev.delta || '';
                onText(text);
                clearTimeout(quiet);
                quiet = setTimeout(done, SILENCE_END_MS);
            }
            if (ev.type === 'session.closed') done();
        };
    });
}

export default function SpeakVoicesPage() {
    const [character, setCharacter] = useState('horang');
    const [samples, setSamples] = useState({}); // `${character}:${voice}` -> blob url
    const [busy, setBusy] = useState(null);
    const [text, setText] = useState('');
    const [error, setError] = useState('');
    const [debug, setDebug] = useState([]);
    const [picks, setPicks] = useState({ horang: '', sora: '' });
    const player = useRef(null);

    useEffect(() => { setPicks({ horang: readPick('horang'), sora: readPick('sora') }); }, []);

    const play = async (voice) => {
        const key = `${character}:${voice}`;
        setError('');
        if (samples[key]) { player.current.src = samples[key]; player.current.play(); return; }
        if (busy) return;
        setBusy(key);
        setText('');
        setDebug([]);
        try {
            const url = await recordSample({ voice, character, onText: setText, log: (m) => setDebug((d) => [...d, m]) });
            if (url) setSamples((s) => ({ ...s, [key]: url }));
        } catch (e) {
            setError(e.message === 'Unauthorized access' ? 'This page is for Hanbok admins.' : e.message);
        }
        setBusy(null);
    };

    const choose = (voice) => {
        try { localStorage.setItem(pickKey(character), voice); } catch { /* private mode */ }
        setPicks((p) => ({ ...p, [character]: voice }));
    };

    const ch = CHARACTERS[character];
    const row = (voice) => {
        const key = `${character}:${voice}`;
        const picked = (picks[character] || DEFAULTS[character]) === voice;
        return (
            <li key={voice} className={`${styles.voiceRow} ${picked ? styles.voiceRowOn : ''}`}>
                <span className={styles.voiceName}>{voice}{voice === DEFAULTS[character] ? <em> default</em> : null}</span>
                <button type="button" className={styles.voicePlay} onClick={() => play(voice)} disabled={!!busy && busy !== key}>
                    {busy === key ? 'Playing…' : samples[key] ? 'Replay' : 'Play'}
                </button>
                <button type="button" className={styles.voiceUse} onClick={() => choose(voice)} aria-pressed={picked}>
                    {picked ? 'Using' : 'Use'}
                </button>
            </li>
        );
    };

    return (
        <Dashboard>
            <div className={styles.page}>
                <p className={styles.label}>Speak · admin</p>
                <h1 className={styles.title}>Pick the voices</h1>
                <p className={styles.dek}>
                    Each Play opens a short GPT-Live call where {ch.name} reads an audition line in that voice (about a cent each).
                    Replays are free. &ldquo;Use&rdquo; saves the voice in this browser, so your next call on <Link href="/speak">Speak</Link> uses it.
                    Tell Claude your picks to make them the default for everyone.
                </p>
                <div className={styles.levelRow} role="radiogroup" aria-label="Character" style={{ margin: '1rem 0' }}>
                    {Object.values(CHARACTERS).map((c) => (
                        <button key={c.id} type="button" role="radio" aria-checked={character === c.id}
                            className={`${styles.levelBtn} ${character === c.id ? styles.levelOn : ''}`} onClick={() => setCharacter(c.id)}>
                            {c.name}{picks[c.id] ? ` (${picks[c.id]})` : ''}
                        </button>
                    ))}
                </div>
                {(busy || text) && <p className={styles.voiceText}>{busy ? '🔊 ' : ''}{text || 'Connecting…'}</p>}
                {error && <p className={styles.voiceError}>{error}</p>}
                {debug.length > 0 && (
                    <details className={styles.voiceDebug} open>
                        <summary>Connection log (send this to Claude if it gets stuck)</summary>
                        <pre>{debug.join('\n')}</pre>
                    </details>
                )}
                <h2 className={styles.castName}>New GPT-Live voices</h2>
                <ul className={styles.voiceList}>{NEW_VOICES.map(row)}</ul>
                <h2 className={styles.castName}>Older voices</h2>
                <ul className={styles.voiceList}>{OLD_VOICES.map(row)}</ul>
                <audio ref={player} hidden />
            </div>
        </Dashboard>
    );
}
