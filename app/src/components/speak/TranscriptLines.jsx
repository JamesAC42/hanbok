'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { speakEvent } from '@/lib/speakEvents';
import UpgradeSheet from '@/components/grammar/UpgradeSheet';
import styles from '@/styles/pages/speakResults.module.scss';

const Icons = {
    lens: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5" /><path d="m15.5 15.5 5 5" /></svg>,
    lock: <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true"><rect x="5" y="11" width="14" height="10" rx="2.5" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></svg>,
};

// The whole conversation after a call, each line with its translation and a
// "Break it down" button that opens it in the analyzer. Free accounts spend
// their weekly breakdowns on it, so the quota and the upgrade sit right here.
export default function TranscriptLines({ sessionId, transcript: initial = [], notes: initialNotes = null, character, language, from }) {
    const router = useRouter();
    const [transcript, setTranscript] = useState(initial);
    const [notes, setNotes] = useState(initialNotes);
    const [failed, setFailed] = useState(false);
    const [showAll, setShowAll] = useState(true);
    const [open, setOpen] = useState({});
    const [quota, setQuota] = useState(null);
    const [sheet, setSheet] = useState(false);

    useEffect(() => {
        if (initialNotes || !sessionId) return undefined;
        let live = true;
        fetch(`/api/speak/session/${sessionId}/lines`, { method: 'POST', credentials: 'include' })
            .then((r) => r.json())
            .then((d) => {
                if (!live) return;
                if (!d.success) { setFailed(true); return; }
                if (d.transcript?.length) setTranscript(d.transcript);
                setNotes(d.lines || []);
            })
            .catch(() => live && setFailed(true));
        return () => { live = false; };
    }, [sessionId, initialNotes]);

    useEffect(() => {
        fetch('/api/quota', { credentials: 'include' })
            .then((r) => r.json())
            .then((q) => setQuota(q))
            .catch(() => {});
    }, []);

    if (!transcript.length) return null;

    const free = quota && !quota.isPremium;
    const left = free ? (quota.remainingWeekly || 0) + (quota.remainingPurchased || 0) : null;
    const out = free && left <= 0;

    const breakDown = (text) => {
        if (out) { speakEvent('breakdown_locked', { from }, sessionId); setSheet(true); return; }
        speakEvent('breakdown', { from, ...(free ? { left } : {}) }, sessionId);
        localStorage.setItem('pendingAnalysis', text);
        localStorage.setItem('pendingAnalysisRun', '1');
        router.push('/analyze');
    };

    return (
        <section className={styles.saveBlock}>
            <div className={styles.blockRow}>
                <h2 className={styles.blockTitle}>Your conversation</h2>
                <button type="button" className={styles.linkBtn} onClick={() => { speakEvent('translations_toggle', { from, on: !showAll }, sessionId); setShowAll((v) => !v); setOpen({}); }}>
                    {showAll ? 'Hide translations' : 'Show translations'}
                </button>
            </div>

            {free && (
                <div className={`${styles.breakdownPitch} ${out ? styles.breakdownOut : ''}`}>
                    <span className={styles.pitchIcon} aria-hidden="true">🔍</span>
                    <div>
                        <p className={styles.pitchTitle}>
                            {out ? "You've used this week's free breakdowns" : `${left} free ${left === 1 ? 'breakdown' : 'breakdowns'} left this week`}
                        </p>
                        <p className={styles.pitchText}>
                            {out
                                ? <>Basic breaks down every line here and anything else you read: every word, the grammar and the audio. It also gives you 60 speaking minutes a month.</>
                                : <>Tap <b>Break it down</b> on any line to see every word, the grammar and the audio. With Basic it&apos;s unlimited, and you get 60 speaking minutes a month.</>}
                        </p>
                    </div>
                    <Link href="/pricing" className={styles.pitchBtn} onClick={() => speakEvent('upsell_click', { where: `transcript_${from}`, on: !!out }, sessionId)}>
                        {out ? 'Unlock unlimited' : 'Go unlimited'}
                    </Link>
                </div>
            )}

            <ul className={styles.script}>
                {transcript.map((m, i) => {
                    const n = notes?.[i];
                    const shown = showAll || open[i];
                    const target = n ? n.target : m.text;
                    return (
                        <li key={i} className={m.who === 'you' ? styles.scriptYou : styles.scriptChar}>
                            <span className={styles.scriptWho}>{m.who === 'you' ? 'You' : character.name}</span>
                            <span lang={language} className={styles.scriptText}>{m.text}</span>
                            {shown && n?.romanization && <span className={styles.scriptRoman}>{n.romanization}</span>}
                            {shown && n?.translation && n.translation !== m.text && <span className={styles.scriptMeaning}>{n.translation}</span>}
                            {shown && !n && !failed && <span className={styles.scriptLoading}>Translating…</span>}
                            <span className={styles.scriptTools}>
                                {!showAll && n?.translation && (
                                    <button type="button" onClick={() => { if (!open[i]) speakEvent('line_translate', { from }, sessionId); setOpen((o) => ({ ...o, [i]: !o[i] })); }}>{open[i] ? 'Hide' : 'Translate'}</button>
                                )}
                                {target && (
                                    <button type="button" className={`${styles.breakBtn} ${out ? styles.breakLocked : ''}`} onClick={() => breakDown(target)}>
                                        {out ? Icons.lock : Icons.lens}
                                        Break it down
                                    </button>
                                )}
                            </span>
                        </li>
                    );
                })}
            </ul>
            {failed && <p className={styles.noteMuted}>Translations couldn&apos;t load right now. You can still break down any line.</p>}
            {sheet && <UpgradeSheet reason="breakdown" onClose={() => setSheet(false)} />}
        </section>
    );
}
