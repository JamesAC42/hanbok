'use client';
import { useState } from 'react';
import styles from '@/styles/components/tutorFeedback.module.scss';

const REASONS = [
    { id: 'wrong', label: 'Something was wrong' },
    { id: 'confusing', label: 'Confusing' },
    { id: 'not_answered', label: "Didn't answer my question" },
    { id: 'too_long', label: 'Too long' },
    { id: 'too_short', label: 'Not enough detail' },
    { id: 'language', label: 'Wrong language' },
    { id: 'other', label: 'Something else' },
];

const post = async (conversationId, messageId, body) => {
    const r = await fetch(`/api/conversations/${conversationId}/messages/${messageId}/feedback`, {
        method: 'POST', credentials: 'include', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
    });
    const d = await r.json();
    if (!d.success) throw new Error(d.error);
    return d;
};

// 👍/👎 under one of Horang's replies. A 👎 asks why (optional).
export default function ReplyFeedback({ conversationId, messageId, initial = null }) {
    const [vote, setVote] = useState(initial?.vote || null);
    const [open, setOpen] = useState(false);
    const [reasons, setReasons] = useState(initial?.reasons || []);
    const [note, setNote] = useState('');
    const [thanks, setThanks] = useState(false);
    const [sending, setSending] = useState(false);
    const [error, setError] = useState('');

    if (!conversationId || !Number.isInteger(messageId)) return null;

    const save = async (body, after) => {
        setSending(true);
        setError('');
        try {
            await post(conversationId, messageId, body);
            after();
        } catch {
            setError("That didn't send. Try again in a moment.");
        } finally {
            setSending(false);
        }
    };

    const tap = (next) => {
        if (next === vote) {
            // Tapping the same thumb again takes the vote back.
            save({ vote: null }, () => { setVote(null); setOpen(false); setThanks(false); });
            return;
        }
        save({ vote: next }, () => {
            setVote(next);
            setOpen(next === 'down');
            setThanks(next === 'up');
        });
    };
    const toggle = (id) => setReasons((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
    const sendWhy = () => save({ vote: 'down', reasons, note }, () => { setOpen(false); setThanks(true); });

    return (
        <>
            <div className={styles.votes}>
                <button type="button" className={`${styles.vote} ${vote === 'up' ? styles.voteOn : ''}`} onClick={() => tap('up')}
                    disabled={sending} aria-pressed={vote === 'up'} aria-label="Good answer" title="Good answer">👍</button>
                <button type="button" className={`${styles.vote} ${vote === 'down' ? styles.voteOn : ''}`} onClick={() => tap('down')}
                    disabled={sending} aria-pressed={vote === 'down'} aria-label="Bad answer" title="Bad answer">👎</button>
                {thanks && <span className={styles.voteThanks}>Thanks for the feedback!</span>}
            </div>
            {open && (
                <div className={styles.why}>
                    <p className={styles.whyTitle}>What was wrong with this answer? Pick any that fit.</p>
                    <div className={styles.chips}>
                        {REASONS.map((r) => (
                            <button key={r.id} type="button" aria-pressed={reasons.includes(r.id)}
                                className={reasons.includes(r.id) ? styles.chipOn : ''} onClick={() => toggle(r.id)}>
                                {r.label}
                            </button>
                        ))}
                    </div>
                    <textarea className={styles.note} value={note} onChange={(e) => setNote(e.target.value)} maxLength={1000} rows={2}
                        placeholder="Tell us more (optional)" />
                    {error && <p className={styles.error}>{error}</p>}
                    <div className={styles.actions}>
                        <button type="button" className={styles.send} onClick={sendWhy} disabled={sending || (!reasons.length && !note.trim())}>
                            {sending ? 'Sending…' : 'Send'}
                        </button>
                        <button type="button" className={styles.cancel} onClick={() => setOpen(false)}>Skip</button>
                    </div>
                </div>
            )}
            {!open && error && <p className={styles.error}>{error}</p>}
        </>
    );
}
