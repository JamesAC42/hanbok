'use client';
import { useEffect, useState } from 'react';
import { FACES } from '@/components/speak/CallSurvey';
import { tutorEvent } from '@/lib/tutorEvents';
import styles from '@/styles/components/tutorFeedback.module.scss';

const post = async (conversationId, body) => {
    const r = await fetch(`/api/conversations/${conversationId}/feedback`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!d.success) throw new Error(d.error);
    return d;
};

// "How is Horang helping?" under a conversation. The server decides when to
// ask (the learner's first conversation with a couple of answers, then every
// few conversations), so most chats never show it.
export default function TutorRating({ conversationId, onDone }) {
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [commentSent, setCommentSent] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (conversationId) tutorEvent('survey_view', {}, conversationId);
    }, [conversationId]);

    if (!conversationId) return null;

    const run = async (body, after) => {
        setSending(true);
        setError('');
        try {
            await post(conversationId, body);
            after();
        } catch {
            setError("That didn't send. Try again in a moment.");
        } finally {
            setSending(false);
        }
    };
    const rate = (score) => {
        setRating(score);
        run({ rating: score }, () => {});
    };
    const sendComment = () => run({ rating, comment }, () => setCommentSent(true));
    const dismiss = () => run({ dismiss: true }, () => onDone?.());

    return (
        <section className={styles.rating} aria-label="How is Horang helping?">
            <div className={styles.ratingHead}>
                <p className={styles.ratingTitle}>{rating ? 'Thanks for rating!' : 'How is Horang helping you so far?'}</p>
                {!rating && <button type="button" className={styles.cancel} onClick={dismiss} disabled={sending}>Not now</button>}
                {commentSent && <button type="button" className={styles.cancel} onClick={() => onDone?.()}>Close</button>}
            </div>
            <div className={styles.faces} role="radiogroup" aria-label="Rate the tutor">
                {FACES.map((f) => (
                    <button key={f.score} type="button" role="radio" aria-checked={rating === f.score}
                        className={rating === f.score ? styles.faceOn : rating ? styles.faceDim : ''}
                        onClick={() => rate(f.score)} disabled={sending}>
                        <span className={styles.faceEmoji} aria-hidden="true">{f.face}</span>
                        <span className={styles.faceLabel}>{f.label}</span>
                    </button>
                ))}
            </div>
            {rating > 0 && !commentSent && (
                <div className={styles.comment}>
                    <input className={styles.note} value={comment} onChange={(e) => setComment(e.target.value)} maxLength={1000}
                        placeholder={rating >= 4 ? 'What helps most? (optional)' : 'What would make Horang more helpful? (optional)'}
                        onKeyDown={(e) => { if (e.key === 'Enter' && comment.trim()) sendComment(); }} />
                    <button type="button" className={styles.send} onClick={sendComment} disabled={sending || !comment.trim()}>Send</button>
                </div>
            )}
            {commentSent && <p className={styles.fine}>Got it, thank you. We read every one.</p>}
            {error && <p className={styles.error}>{error}</p>}
        </section>
    );
}
