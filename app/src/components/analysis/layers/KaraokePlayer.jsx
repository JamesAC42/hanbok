'use client';
import { useEffect, useRef, useState } from 'react';
import { track } from '@/lib/analytics';
import { activeWordAt, shadowPhrases, repeatGapMs } from '@/lib/karaoke';
import PlusGate from '@/components/analysis/layers/PlusGate';
import styles from '@/styles/components/sentenceanalyzer/layers.module.scss';

const SPEEDS = [1, 0.75];

// Play along: the sentence is read aloud and each word lights up as it's said.
// Shadow: it's read a phrase at a time, with a pause after each one for the
// learner to say it back.
const KaraokePlayer = ({ sentenceId, hasPlus }) => {
    const [data, setData] = useState(null);
    const [status, setStatus] = useState('idle'); // idle | loading | playing | shadow | turn | error
    const [active, setActive] = useState(-1);
    const [phrase, setPhrase] = useState(null);
    const [speed, setSpeed] = useState(1);
    const [turnMs, setTurnMs] = useState(0);
    const audioRef = useRef(null);
    const runRef = useRef(0);

    const stop = () => {
        runRef.current++;
        audioRef.current?.pause();
        setStatus(s => (s === 'loading' || s === 'error' ? s : 'idle'));
        setActive(-1);
        setPhrase(null);
    };

    useEffect(() => () => { runRef.current++; audioRef.current?.pause(); }, []);
    useEffect(() => { stop(); setData(null); setStatus('idle'); }, [sentenceId]);

    if (!hasPlus) {
        return (
            <PlusGate layer="karaoke" title="Play along and shadow">
                Hear the sentence with each word lighting up as it's said, then repeat it phrase by phrase.
            </PlusGate>
        );
    }

    const load = async () => {
        if (data) return data;
        setStatus('loading');
        try {
            const res = await fetch(`/api/sentences/${encodeURIComponent(sentenceId)}/karaoke`, { credentials: 'include' });
            const body = await res.json().catch(() => ({}));
            if (!res.ok || !body.success || !Array.isArray(body.words)) throw new Error(body.error || 'Failed');
            const audio = new Audio(body.url);
            audio.preload = 'auto';
            audioRef.current = audio;
            setData(body);
            return body;
        } catch {
            setStatus('error');
            return null;
        }
    };

    // Calls tick on every frame until it returns false or the run is stopped.
    const frames = (run, tick) => new Promise(resolve => {
        const step = () => {
            if (runRef.current !== run || !tick()) return resolve(runRef.current === run);
            requestAnimationFrame(step);
        };
        requestAnimationFrame(step);
    });

    const playAlong = async (mode) => {
        stop();
        const d = await load();
        if (!d) return;
        const run = ++runRef.current;
        const audio = audioRef.current;
        audio.playbackRate = speed;
        track('layer_action', { layer: 'sound', action: mode });

        if (mode === 'karaoke') {
            setStatus('playing');
            audio.currentTime = 0;
            try { await audio.play(); } catch { return stop(); }
            await frames(run, () => {
                setActive(activeWordAt(d.words, audio.currentTime));
                return !audio.ended && !audio.paused;
            });
            if (runRef.current === run) stop();
            return;
        }

        const phrases = shadowPhrases(d.words);
        for (const p of phrases) {
            if (runRef.current !== run) return;
            setPhrase(p);
            setStatus('shadow');
            audio.currentTime = Math.max(0, p.start - 0.05);
            try { await audio.play(); } catch { return stop(); }
            const ok = await frames(run, () => {
                setActive(Math.min(p.to, activeWordAt(d.words, audio.currentTime)));
                return audio.currentTime < p.end + 0.05 && !audio.ended;
            });
            audio.pause();
            if (!ok) return;
            const gap = repeatGapMs(p, speed);
            setTurnMs(gap);
            setStatus('turn');
            await new Promise(r => setTimeout(r, gap));
        }
        if (runRef.current === run) stop();
    };

    const busy = status === 'playing' || status === 'shadow' || status === 'turn';
    const inPhrase = (i) => phrase && i >= phrase.from && i <= phrase.to;

    return (
        <div className={styles.karaoke}>
            <div className={styles.karaokeHead}>
                <b>Play along</b>
                <div className={styles.speedSwitch} role="radiogroup" aria-label="Speed">
                    {SPEEDS.map(s => (
                        <button key={s} type="button" role="radio" aria-checked={speed === s} disabled={busy}
                            className={speed === s ? styles.speedActive : ''} onClick={() => setSpeed(s)}>
                            {s === 1 ? '1×' : `${s}×`}
                        </button>
                    ))}
                </div>
            </div>

            {data && (
                <p className={`${styles.karaokeLine} korean`}>
                    {data.words.map((w, i) => (
                        <span key={i} className={[
                            i === active && busy ? styles.karaokeNow : '',
                            i < active && busy ? styles.karaokeSaid : '',
                            phrase && !inPhrase(i) ? styles.karaokeDim : '',
                        ].join(' ')}>{w.text}</span>
                    ))}
                </p>
            )}

            {status === 'turn' && (
                <div className={styles.turn} aria-live="polite">
                    <span>Your turn. Say it out loud.</span>
                    <i key={`${phrase?.from}-${turnMs}`} style={{ animationDuration: `${turnMs}ms` }} />
                </div>
            )}
            {status === 'error' && <p className={styles.muted}>Couldn't load the audio. Try again in a moment.</p>}

            <div className={styles.karaokeActions}>
                {busy ? (
                    <button type="button" className={styles.againButton} onClick={stop}>Stop</button>
                ) : (
                    <>
                        <button type="button" className={styles.startButton} disabled={status === 'loading'} onClick={() => playAlong('karaoke')}>
                            {status === 'loading' ? 'Loading…' : 'Play along'}
                        </button>
                        <button type="button" className={styles.againButton} disabled={status === 'loading'} onClick={() => playAlong('shadow')}>
                            Shadow it
                        </button>
                    </>
                )}
            </div>
        </div>
    );
};

export default KaraokePlayer;
