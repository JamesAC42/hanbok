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

export const FACES = [
    { score: 1, face: '😖', label: 'Not for me' },
    { score: 2, face: '😕', label: 'Meh' },
    { score: 3, face: '😐', label: 'Okay' },
    { score: 4, face: '🙂', label: 'Good' },
    { score: 5, face: '😍', label: 'Loved it' },
];

const minutesOf = (seconds) => Math.max(1, Math.round(seconds / 60));

const post = async (sessionId, body) => {
    const r = await fetch(`/api/speak/session/${sessionId}/feedback`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!d.success) throw new Error(d.error);
    return d;
};

// Under a finished call. Always: "did anything go wrong?" (Speak is in beta,
// and a reported problem gives the call's minutes back, a few calls per plan
// period). On some calls (the server decides, askRating) it leads with "How
// did you like this call?" on a 1-5 face scale instead.
export default function CallSurvey({ sessionId, seconds = 0, reason = '', beta = true, refundsLeft = 0, initial = null, askRating = false, characterName = '', canReport = true, onAllowance }) {
    const dropped = /^dropped/.test(reason || '');
    const answered = typeof initial?.ok === 'boolean' ? (initial.ok ? 'ok' : 'sent') : null;
    const rateMode = askRating && !initial && !dropped;
    const [step, setStep] = useState(answered || (dropped ? 'form' : 'ask'));
    const [issues, setIssues] = useState(dropped ? ['dropped'] : []);
    const [note, setNote] = useState('');
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [commentSent, setCommentSent] = useState(false);
    const [sending, setSending] = useState(false);
    const [refunded, setRefunded] = useState(0);
    const [error, setError] = useState('');
    const refundable = beta && refundsLeft > 0 && seconds > 0 && !initial;

    useEffect(() => {
        if (!initial && sessionId) speakEvent('survey_view', { from: dropped ? 'dropped' : rateMode ? 'rating' : 'result' }, sessionId);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    if (!sessionId) return null;

    const run = async (body, after) => {
        setSending(true);
        setError('');
        try {
            const d = await post(sessionId, body);
            if (d.allowance) onAllowance?.(d.allowance);
            after(d);
        } catch {
            setError("That didn't send. Try again in a moment.");
        } finally {
            setSending(false);
        }
    };
    const send = (ok) => run({ ok, issues: ok ? [] : issues, note: ok ? '' : note }, (d) => {
        setRefunded(d.refundedSeconds || 0);
        setStep(ok ? 'ok' : 'sent');
    });
    const rate = (score) => {
        setRating(score);
        run({ rating: score }, () => {});
    };
    const sendComment = () => run({ rating, comment }, () => setCommentSent(true));
    const toggle = (id) => setIssues((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));

    const ratedLine = initial?.rating ? (
        <p className={styles.surveyFine}>
            You rated this call {FACES[initial.rating - 1].face} {FACES[initial.rating - 1].label}.
        </p>
    ) : null;

    if (!answered && !canReport) return ratedLine;
    if (step === 'ok') {
        return <>{ratedLine}<p className={styles.surveyDone}>Thanks! Glad the call went well.</p></>;
    }
    if (step === 'sent') {
        return (
            <>
                {ratedLine}
                <p className={styles.surveyDone}>
                    Thanks for telling us. {refunded > 0 ? <b>We gave you back {minutesOf(refunded)} {minutesOf(refunded) === 1 ? 'minute' : 'minutes'}. </b> : null}
                    We read every report and we&apos;re on it.
                </p>
            </>
        );
    }

    const problemLink = (
        <button type="button" className={styles.surveyCancel} onClick={() => setStep('form')}>
            Something went wrong?{refundable ? ' Tell us and get the minutes back' : ' Tell us'}
        </button>
    );

    return (
        <section className={styles.survey} aria-label={rateMode ? 'How did you like this call?' : 'How did the call go?'}>
            {rateMode && step === 'ask' ? (
                <>
                    <div className={styles.surveyHead}>
                        <p className={styles.surveyTitle}>
                            {rating ? 'Thanks for rating!' : `How did you like talking with ${characterName || 'them'}?`} <span className={styles.betaPill}>Beta</span>
                        </p>
                    </div>
                    <div className={styles.faces} role="radiogroup" aria-label="Rate this call">
                        {FACES.map((f) => (
                            <button
                                key={f.score}
                                type="button"
                                role="radio"
                                aria-checked={rating === f.score}
                                className={rating === f.score ? styles.faceOn : rating ? styles.faceDim : ''}
                                onClick={() => rate(f.score)}
                                disabled={sending}
                            >
                                <span className={styles.faceEmoji} aria-hidden="true">{f.face}</span>
                                <span className={styles.faceLabel}>{f.label}</span>
                            </button>
                        ))}
                    </div>
                    {rating > 0 && !commentSent && (
                        <div className={styles.rateComment}>
                            <input
                                className={styles.surveyNote}
                                value={comment}
                                onChange={(e) => setComment(e.target.value)}
                                maxLength={1000}
                                placeholder={rating >= 4 ? 'What did you like most? (optional)' : 'What would make it better? (optional)'}
                                onKeyDown={(e) => { if (e.key === 'Enter' && comment.trim()) sendComment(); }}
                            />
                            <button type="button" className={styles.surveySend} onClick={sendComment} disabled={sending || !comment.trim()}>Send</button>
                        </div>
                    )}
                    {commentSent && <p className={styles.surveyFine}>Got it, thank you. We read every one.</p>}
                    {error && <p className={styles.surveyError}>{error}</p>}
                    <div className={styles.surveyActions}>{problemLink}</div>
                </>
            ) : (
                <>
                    {ratedLine}
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
                </>
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
