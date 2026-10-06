'use client';
import { useEffect, useState } from 'react';
import styles from '@/styles/components/admin/dashboard.module.scss';

const NUMBER_FIELDS = [
    ['remainingAudioGenerations', 'Audio credits left'],
    ['remainingImageExtracts', 'Image extracts left'],
    ['remainingSentenceAnalyses', 'Bought sentence analyses left'],
    ['maxSavedSentences', 'Max saved sentences'],
    ['maxSavedWords', 'Max saved words'],
];

const EditUserModal = ({ user, onClose, onUserUpdated }) => {
    const [form, setForm] = useState({
        tier: user.tier || 0,
        verified: Boolean(user.verified),
        hasUsedFreeTrial: Boolean(user.hasUsedFreeTrial),
        ...Object.fromEntries(NUMBER_FIELDS.map(([key]) => [key, user[key] ?? ''])),
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState(null);

    useEffect(() => {
        const onKey = (e) => { if (e.key === 'Escape') onClose(); };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [onClose]);

    const set = (key, value) => {
        setForm((prev) => ({ ...prev, [key]: value }));
        setError(null);
    };

    const submit = async (e) => {
        e.preventDefault();
        const body = { tier: parseInt(form.tier, 10), verified: form.verified, hasUsedFreeTrial: form.hasUsedFreeTrial };
        for (const [key] of NUMBER_FIELDS) {
            const value = parseInt(form[key], 10);
            if (!Number.isNaN(value)) body[key] = value;
        }
        try {
            setSaving(true);
            const response = await fetch(`/api/admin/users/${user.userId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body),
            });
            const data = await response.json().catch(() => ({}));
            if (!response.ok || !data.success) throw new Error(data.error || 'Could not save');
            onUserUpdated(data.user);
        } catch (err) {
            setError(err.message);
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className={styles.modalOverlay} onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
            <form className={styles.modal} onSubmit={submit} role="dialog" aria-modal="true" aria-labelledby="edit-user-title">
                <header className={styles.modalHead}>
                    <div>
                        <h2 id="edit-user-title">Edit {user.name}</h2>
                        <span className={styles.muted}>{user.email}</span>
                    </div>
                    <button type="button" className={styles.iconButton} onClick={onClose} aria-label="Close">×</button>
                </header>

                <fieldset className={styles.fieldset}>
                    <legend className={styles.tileLabel}>Plan</legend>
                    <div className={styles.segmented}>
                        {['Free', 'Basic', 'Plus'].map((label, tier) => (
                            <button key={label} type="button" aria-pressed={Number(form.tier) === tier}
                                className={Number(form.tier) === tier ? styles.segOn : ''} onClick={() => set('tier', tier)}>
                                {label}
                            </button>
                        ))}
                    </div>
                    <p className={styles.cardNote}>Changing the plan here does not touch their Stripe subscription.</p>
                </fieldset>

                <div className={styles.formGrid}>
                    {NUMBER_FIELDS.map(([key, label]) => (
                        <label key={key} className={styles.field}>
                            <span>{label}</span>
                            <input type="number" min="0" value={form[key]} onChange={(e) => set(key, e.target.value)} className={styles.input} />
                        </label>
                    ))}
                </div>

                <div className={styles.checks}>
                    <label><input type="checkbox" checked={form.verified} onChange={(e) => set('verified', e.target.checked)} /> Email verified</label>
                    <label><input type="checkbox" checked={form.hasUsedFreeTrial} onChange={(e) => set('hasUsedFreeTrial', e.target.checked)} /> Has used the free trial</label>
                </div>

                {error && <p className={styles.sectionError} role="alert">{error}</p>}

                <footer className={styles.modalFoot}>
                    <button type="button" className={styles.ghostButton} onClick={onClose}>Cancel</button>
                    <button type="submit" className={styles.pressButton} disabled={saving}>{saving ? 'Saving…' : 'Save changes'}</button>
                </footer>
            </form>
        </div>
    );
};

export default EditUserModal;
