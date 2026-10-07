'use client';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePopup } from '@/contexts/PopupContext';
import { extractForm, formsMatch } from '@/lib/grammarForms';
import { useGrammarGuides, findGuide } from '@/lib/grammarGuides';
import { track } from '@/lib/analytics';
import UpgradeSheet from '@/components/grammar/UpgradeSheet';
import styles from '@/styles/components/grammar.module.scss';

const aliasKey = (pattern) => String(pattern || '').toLowerCase().replace(/\s+/g, ' ').trim();

// The grammar points this learner already saved from one sentence.
export const useSavedGrammar = (sentenceId) => {
    const { user } = useAuth();
    const [saved, setSaved] = useState([]);

    useEffect(() => {
        if (!user || !sentenceId) {
            setSaved([]);
            return undefined;
        }
        let cancelled = false;
        fetch(`/api/grammar/saved-in?sentenceId=${encodeURIComponent(sentenceId)}`)
            .then((res) => (res.ok ? res.json() : null))
            .then((data) => { if (!cancelled && data?.success) setSaved(data.saved); })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [user, sentenceId]);

    const isSaved = useCallback((pattern) => {
        const key = aliasKey(pattern);
        return saved.find((s) => s.pattern === pattern || (s.aliases || []).includes(key)) || null;
    }, [saved]);

    const markSaved = useCallback((entry) => setSaved((prev) => [...prev, entry]), []);

    return { isSaved, markSaved };
};

// Save button and Learn guide link under one grammar point of an analysis.
// Also used for passages: pass textId instead of (or with) sentenceId.
const SaveGrammarRow = ({ point, language, translationLanguage, sentenceId, textId, examples, state }) => {
    const { user } = useAuth();
    const { showLoginRequiredPopup } = usePopup();
    const guides = useGrammarGuides();
    const [saving, setSaving] = useState(false);
    const [justSaved, setJustSaved] = useState(null);
    const [error, setError] = useState('');
    const [limitHit, setLimitHit] = useState(false);

    const existing = state?.isSaved(point.pattern);
    const saved = justSaved || existing;
    const form = saved?.form || extractForm(point.pattern, language);
    const guide = findGuide(guides, form, language);

    const save = async () => {
        if (!user) {
            showLoginRequiredPopup('grammar points');
            return;
        }
        setSaving(true);
        setError('');
        try {
            const res = await fetch('/api/grammar/save', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    originalLanguage: language,
                    translationLanguage,
                    pattern: point.pattern,
                    explanation: point.explanation,
                    level: point.level,
                    examples,
                    sentenceId,
                    textId,
                }),
            });
            const data = await res.json();
            if (data.reachedLimit) {
                setLimitHit(true);
            } else if (data.success) {
                const entry = { grammarId: data.grammarId, pattern: point.pattern, form: data.form, aliases: [aliasKey(point.pattern)] };
                setJustSaved(entry);
                state?.markSaved(entry);
                track('grammar_save', { language, already: !!data.alreadySaved });
            } else {
                setError(data.error || 'Could not save this grammar point.');
            }
        } catch {
            setError('Could not save this grammar point. Check your connection and try again.');
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.saveRow}>
            {saved ? (
                <Link href={`/my-grammar/${saved.grammarId}`} className={styles.savedButton}>
                    ✓ On your grammar path
                </Link>
            ) : (
                <button type="button" className={styles.saveButton} onClick={save} disabled={saving}>
                    {saving ? 'Saving…' : '+ Save grammar'}
                </button>
            )}
            {guide && (
                <Link href={guide.href} className={styles.chipLink}>
                    Full guide →
                </Link>
            )}
            {justSaved && (
                <span className={styles.saveNote}>
                    Saved. It comes back in Review tomorrow, and Horangi has a 2-minute lesson ready on <Link href={`/my-grammar/${justSaved.grammarId}`}>your grammar path</Link>.
                </span>
            )}
            {error && <span className={styles.saveNote} role="alert">{error}</span>}
            {limitHit && <UpgradeSheet reason="save" onClose={() => setLimitHit(false)} />}
        </div>
    );
};

export default SaveGrammarRow;
