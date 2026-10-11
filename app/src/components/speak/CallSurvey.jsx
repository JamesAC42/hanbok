'use client';
import { useEffect, useState } from 'react';
import { speakEvent } from '@/lib/speakEvents';
import styles from '@/styles/pages/speakResults.module.scss';

const ISSUES = [
    { id: 'dropped', label: 'The call dropped' },
    { id: 'cant_hear', label: "I couldn't hear them" },
    { id: 'didnt_hear_me', label: "They didn't hear me" },
    { id: 'wrong_text', label: 'The words on screen were wrong' },
    { id: 'try_saying', label: '"Try saying" was wrong or missing' },
    { id: 'ended_early', label: 'It ended too early' },
    { id: 'slow', label: 'Slow or laggy' },
    { id: 'other', label: 'Something else' },
];

const minutesOf = (seconds) => Math.max(1, Math.round(seconds / 60));

// "How did the call go?" under a finished call. Speak is in beta: telling us
// a call went wrong gives its minutes back (a few calls per plan period).
export default function CallSurvey({ sessionId, seconds = 0, reason = '', beta = true, refundsLeft = 0, initial = null, onAllowance }) {
    const dropped = /^dropped/.test(reason || '');
    const [step, setStep] = useState(initial ? (initial.ok ? 'ok' : 'sent') : dropped ? 'form' : 'ask');
    const [issues, setIssues] = useState(dropped ? ['dropped'] : []);
    const [note, setNote] = useState('');
    const [sending, setSending] = useState(false);
    const [refunded, setRefunded] = useState(0);
    const [error, setError] = useState('');
    const refundable = beta && refundsLeft > 0 && seconds > 0 && !initial;

    useEffect(() => {
        if (!initial && sessionId) speakEvent('survey_view', { from: dropped ? 'dropped' : 'result' }, sessionId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!sessionId) return null;

    const send = async (ok) => {
        setSending(true);
        setError('');
        try {
            const r = await fetch(`/api/speak/session/${sessionId}/feedback`, {
                method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ok, issues: ok ? [] : issues, note: ok ? '' : note }),
            });
            const d = await r.json();
            if (!d.success) throw new Error(d.error);
            setRefunded(d.refundedSeconds || 0);
            if (d.allowance) onAllowance?.(d.allowance);
            setStep(ok ? 'ok' : 'sent');
        } catch {
            setError("That didn't send. Try again in a moment.");
        } finally {
            setSending(false);
        }
    };
    const toggle = (id) => setIssues((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

    if (step === 'ok') {
        return <p className={styles.surveyDone}>Thanks! Glad the call went well.</p>;
    }
    if (step === 'sent') {
        return (
            <p className={styles.surveyDone}>
                Thanks for telling us. {refunded > 0 ? <b>We gave you back {minutesOf(refunded)} {minutesOf(refunded) === 1 ? 'minute' : 'minutes'}. </b> : null}
                We read every report and we&apos;re on it.
            </p>
        );
    }

    return (
        <section className={styles.survey} aria-label="How did the call go?">
            <div className={styles.surveyHead}>
                <p className={styles.surveyTitle}>How did the call go? <span className={styles.betaPill}>Beta</span></p>
                {step === 'ask' && (
                    <div className={styles.surveyBtns}>
                        <button type="button" onClick={() => send(true)} disabled={sending}>👍 It worked</button>
                        <button type="button" onClick={() => setStep('form')} disabled={sending}>👎 Something went wrong</button>
                    </div>
                )}
            </div>
            {step === 'ask' && refundable && (
                <p className={styles.surveyFine}>Speak is in beta. If something broke, tell us and we&apos;ll give you this call&apos;s minutes back.</p>
            )}
            {step === 'form' && (
                <div className={styles.surveyForm}>
                    <p className={styles.surveyFine}>
                        {dropped ? 'Sorry, the call dropped. ' : 'Sorry about that. '}What went wrong? Pick any that fit.
                    </p>
                    <div className={styles.surveyChips}>
                        {ISSUES.map((i) => (
                            <button key={i.id} type="button" aria-pressed={issues.includes(i.id)} className={issues.includes(i.id) ? styles.chipOn : ''} onClick={() => toggle(i.id)}>
                                {i.label}
                            </button>
                        ))}
                    </div>
                    <textarea
                        className={styles.surveyNote}
                        value={note}
                        onChange={(e) => setNote(e.target.value)}
                        maxLength={1000}
                        rows={3}
                        placeholder="What happened? (optional) For example: Horang kept repeating himself after I answered."
                    />
                    {error && <p className={styles.surveyError}>{error}</p>}
                    <div className={styles.surveyActions}>
                        <button type="button" className={styles.surveySend} onClick={() => send(false)} disabled={sending || (!issues.length && !note.trim())}>
                            {sending ? 'Sending…' : refundable ? `Send and get ${minutesOf(seconds)} ${minutesOf(seconds) === 1 ? 'minute' : 'minutes'} back` : 'Send'}
                        </button>
                        {!dropped && <button type="button" className={styles.surveyCancel} onClick={() => setStep('ask')}>Never mind</button>}
                    </div>
                </div>
            )}
        </section>
    );
}
