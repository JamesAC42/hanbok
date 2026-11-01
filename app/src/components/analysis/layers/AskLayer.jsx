'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { track } from '@/lib/analytics';
import { loginHref } from '@/lib/anonSentences';
import Tiger from '@/components/Tiger';
import MarkdownRenderer from '@/components/MarkdownRenderer';
import styles from '@/styles/components/sentenceanalyzer/layers.module.scss';

const FALLBACK_QUESTIONS = [
    'Why is this sentence built this way?',
    'How else could I say this?',
    'Which part should I study first?',
];

// "Ask Horangi": ask the tutor about this sentence without leaving the page.
// Uses the normal Tutor conversation (and its monthly limits), so the answer
// can be continued on the Tutor page.
const AskLayer = ({ analysis, language, sentenceId }) => {
    const { user } = useAuth();
    const [question, setQuestion] = useState('');
    const [asked, setAsked] = useState(null);
    const [answer, setAnswer] = useState(null);
    const [conversationId, setConversationId] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const suggestions = (Array.isArray(analysis?.questions) && analysis.questions.filter(q => typeof q === 'string' && q.trim()).length
        ? analysis.questions
        : FALLBACK_QUESTIONS
    ).slice(0, 3);

    const ask = async (text) => {
        const q = text.trim();
        if (!q || loading) return;
        setAsked(q);
        setAnswer(null);
        setError('');
        setLoading(true);
        track('ask_inline', { suggested: suggestions.includes(q), followUp: !!conversationId, language });
        const failed = 'Horangi could not answer just now. Try again in a moment.';
        try {
            // The first question starts a Tutor conversation about this
            // sentence; later ones continue it (free accounts get one
            // conversation per sentence).
            const res = conversationId
                ? await fetch(`/api/conversations/${conversationId}/messages`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ role: 'user', content: q, targetLanguage: language, responseLanguage: 'en' }),
                })
                : await fetch('/api/conversations', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({
                        initialMessage: q,
                        sentenceId: parseInt(sentenceId, 10),
                        targetLanguage: language,
                        responseLanguage: 'en',
                    }),
                });
            const data = await res.json().catch(() => ({}));
            if (!res.ok || !data.success) throw new Error(data.message || data.error?.message || failed);
            const reply = conversationId
                ? data.aiResponse
                : (data.initialMessages || []).find(m => m.role === 'assistant');
            if (!conversationId) setConversationId(data.conversation?.conversationId || null);
            if (!reply) throw new Error(failed);
            setAnswer(reply.content);
            setQuestion('');
        } catch (e) {
            setError(e.message);
        } finally {
            setLoading(false);
        }
    };

    if (!user) {
        return (
            <div className={styles.layerBody}>
                <div className={styles.askHead}>
                    <Tiger size={48} />
                    <p className={styles.layerLead}>Horangi, the tiger tutor, answers questions about this exact sentence.</p>
                </div>
                <div className={styles.askChips}>
                    {suggestions.map(q => <span key={q} className={styles.askChip}>{q}</span>)}
                </div>
                <Link href={loginHref(true)} className={styles.gateButton}>Make a free account to ask</Link>
            </div>
        );
    }

    return (
        <div className={styles.layerBody}>
            <div className={styles.askHead}>
                <Tiger size={48} />
                <p className={styles.layerLead}>Ask Horangi anything about this sentence.</p>
            </div>
            <div className={styles.askChips}>
                {suggestions.map(q => (
                    <button key={q} type="button" className={styles.askChip} onClick={() => ask(q)} disabled={loading}>{q}</button>
                ))}
            </div>
            <form className={styles.askForm} onSubmit={e => { e.preventDefault(); ask(question); }}>
                <input
                    id="ask-horangi"
                    className={styles.askInput}
                    value={question}
                    onChange={e => setQuestion(e.target.value)}
                    placeholder="Or type your own question"
                    maxLength={500}
                    disabled={loading}
                />
                <button type="submit" className={styles.askSend} disabled={loading || !question.trim()}>Ask</button>
            </form>

            {asked && (
                <div className={styles.askAnswer} aria-live="polite">
                    <p className={styles.askQ}>{asked}</p>
                    {loading && <p className={styles.muted}>Horangi is thinking…</p>}
                    {answer && <MarkdownRenderer content={answer} />}
                    {error && (
                        <p className={styles.wrong}>
                            {error}{' '}
                            {user.tier < 2 && /limit|quota|upgrade/i.test(error) && <Link href="/pricing">See plans</Link>}
                        </p>
                    )}
                    {answer && conversationId && (
                        <Link href={`/tutor?conversation=${conversationId}`} className={styles.askMore}>Keep asking in Tutor</Link>
                    )}
                </div>
            )}
        </div>
    );
};

export default AskLayer;
