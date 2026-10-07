'use client';
import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { track } from '@/lib/analytics';
import Mascot from '@/components/Mascot';
import styles from '@/styles/components/heardfromprompt.module.scss';

// A small one-tap "How did you find Hanbok?" card for new learners who didn't
// answer at signup (Google sign-in from a popup, or skipped the optional
// question). It sits in the corner instead of covering the page, shows once per
// account, and either answer or "Skip" puts it away for good.
const OPTIONS = [
    { value: 'tiktok', label: 'TikTok' },
    { value: 'instagram', label: 'Instagram' },
    { value: 'youtube', label: 'YouTube' },
    { value: 'search', label: 'Google search' },
    { value: 'reddit', label: 'Reddit' },
    { value: 'friend', label: 'A friend' },
    { value: 'discord', label: 'Discord' },
    { value: 'other', label: 'Somewhere else' },
];
const ASK_WITHIN_DAYS = 14;
const DELAY_MS = 4000;
const storageKey = (userId) => `heardFromAsked:${userId}`;

const alreadyAsked = (userId) => {
    try {
        return !!localStorage.getItem(storageKey(userId));
    } catch {
        return true;
    }
};

const markAsked = (userId) => {
    try {
        localStorage.setItem(storageKey(userId), '1');
    } catch {}
};

const HeardFromPrompt = () => {
    const { user, loading } = useAuth();
    const pathname = usePathname();
    const [state, setState] = useState('hidden'); // hidden | asking | thanks

    useEffect(() => {
        if (loading || !user || user.heardFrom || state !== 'hidden') return;
        // Leave the front door, login and reading pages alone.
        if (pathname === '/' || /^\/(login|learn|lyrics|pricing|updates)(\/|$)/.test(pathname || '')) return;
        const created = user.dateCreated ? new Date(user.dateCreated) : null;
        if (!created || Date.now() - created.getTime() > ASK_WITHIN_DAYS * 24 * 60 * 60 * 1000) return;
        if (alreadyAsked(user.userId)) return;

        const timer = setTimeout(() => setState('asking'), DELAY_MS);
        return () => clearTimeout(timer);
    }, [loading, user?.userId, user?.heardFrom, pathname, state]);

    if (state === 'hidden' || !user) return null;

    const answer = (value) => {
        markAsked(user.userId);
        setState('thanks');
        track('heard_from', { source: value });
        fetch('/api/user/heard-from', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ heardFrom: value }),
        }).catch(() => {});
        setTimeout(() => setState('hidden'), 1800);
    };

    const skip = () => {
        markAsked(user.userId);
        setState('hidden');
    };

    return (
        <aside className={styles.card} role="dialog" aria-labelledby="heard-from-title">
            <div className={styles.head}>
                <Mascot pose={state === 'thanks' ? 'celebrate' : 'think'} size={52} />
                <div>
                    <h2 id="heard-from-title">
                        {state === 'thanks' ? 'Thank you!' : 'Quick question'}
                    </h2>
                    <p>
                        {state === 'thanks'
                            ? 'That helps us find more learners like you.'
                            : 'How did you find Hanbok?'}
                    </p>
                </div>
                {state === 'asking' && (
                    <button type="button" className={styles.close} onClick={skip} aria-label="Close">×</button>
                )}
            </div>
            {state === 'asking' && (
                <>
                    <div className={styles.chips}>
                        {OPTIONS.map((option) => (
                            <button key={option.value} type="button" onClick={() => answer(option.value)}>
                                {option.label}
                            </button>
                        ))}
                    </div>
                    <button type="button" className={styles.skip} onClick={skip}>Skip</button>
                </>
            )}
        </aside>
    );
};

export default HeardFromPrompt;
