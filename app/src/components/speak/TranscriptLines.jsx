'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { track } from '@/lib/analytics';
import UpgradeSheet from '@/components/grammar/UpgradeSheet';
import styles from '@/styles/pages/speakResults.module.scss';

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
        track('speak_breakdown', { from, free: !!free, left });
        if (out) { setSheet(true); return; }
        localStorage.setItem('pendingAnalysis', text);
        localStorage.setItem('pendingAnalysisRun', '1');
        router.push('/analyze');
    };

    return (
        <section className={styles.saveBlock}>
            <div className={styles.blockRow}>
                <h2 className={styles.blockTitle}>Your conversation</h2>
                <button type="button" className={styles.linkBtn} onClick={() => { setShowAll((v) => !v); setOpen({}); }}>
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
                    <Link href="/pricing" className={styles.pitchBtn} onClick={() => track('speak_upsell', { where: `transcript_${from}`, out })}>
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
                                    <button type="button" onClick={() => setOpen((o) => ({ ...o, [i]: !o[i] }))}>{open[i] ? 'Hide' : 'Translate'}</button>
                                )}
                                {target && (
                                    <button type="button" className={styles.breakBtn} onClick={() => breakDown(target)}>
                                        {out ? '🔒 Break it down' : 'Break it down'}
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
