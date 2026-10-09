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

async function recordSample({ voice, character, onText }) {
    const pc = new RTCPeerConnection();
    // A silent outgoing track: the sample never needs the microphone.
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const silent = ctx.createMediaStreamDestination();
    pc.addTrack(silent.stream.getAudioTracks()[0], silent.stream);
    const dc = pc.createDataChannel('oai-events');
    const audio = new Audio();
    audio.autoplay = true;
    let recorder = null;
    const chunks = [];
    pc.ontrack = (e) => {
        audio.srcObject = e.streams[0];
        audio.play?.().catch(() => {});
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
    await pc.setRemoteDescription({ type: 'answer', sdp: data.answer });

    return new Promise((resolve) => {
        let text = '';
        let quiet = null;
        const done = () => {
            clearTimeout(retry);
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
        // GPT-Live ignores commands until session.started.
        let kicked = 0;
        const kick = () => dc.readyState === 'open' && kicked++ < 2 && dc.send(JSON.stringify({ type: 'session.commentary.append', delegation_id: null, content: '(Connected. Perform your audition lines now.)' }));
        let retry = null;
        dc.onopen = () => { retry = setTimeout(() => { if (!kicked) kick(); }, 3000); };
        dc.onmessage = (e) => {
            let ev = {};
            try { ev = JSON.parse(e.data); } catch { return; }
            if (ev.type === 'session.started' && !kicked) { kick(); retry = setTimeout(() => { if (!text) kick(); }, 5000); }
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
        try {
            const url = await recordSample({ voice, character, onText: setText });
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
                <h2 className={styles.castName}>New GPT-Live voices</h2>
                <ul className={styles.voiceList}>{NEW_VOICES.map(row)}</ul>
                <h2 className={styles.castName}>Older voices</h2>
                <ul className={styles.voiceList}>{OLD_VOICES.map(row)}</ul>
                <audio ref={player} hidden />
            </div>
        </Dashboard>
    );
}
