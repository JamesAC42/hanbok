'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { addWord } from '@/api/words';
import { takePendingSaves } from '@/lib/pendingSaves';
import { track } from '@/lib/analytics';
import styles from '@/styles/components/pendingsaves.module.scss';

// Saves the words a visitor tapped Save on before they had an account, right
// after they sign up or sign in, and says so.
export default function PendingSaves() {
    const { user } = useAuth();
    const [saved, setSaved] = useState(null);

    useEffect(() => {
        if (!user?.userId) return;
        const pending = takePendingSaves();
        if (pending.length === 0) return;
        let cancelled = false;
        (async () => {
            const done = [];
            for (const w of pending) {
                try {
                    const res = await addWord({ originalWord: w.ko, translatedWord: w.en, originalLanguage: w.lang, translationLanguage: w.to || 'en' });
                    if (!res?.reachedLimit) done.push(w.ko);
                } catch { /* skip that one */ }
            }
            if (cancelled || done.length === 0) return;
            track('pending_save_done', { count: done.length });
            setSaved(done);
        })();
        return () => { cancelled = true; };
    }, [user?.userId]);

    useEffect(() => {
        if (!saved) return;
        const timer = setTimeout(() => setSaved(null), 6000);
        return () => clearTimeout(timer);
    }, [saved]);

    if (!saved) return null;
    const label = saved.length === 1 ? saved[0] : `${saved.length} words`;
    return (
        <div className={styles.toast} role="status">
            <span lang="ko">{label}</span> {saved.length === 1 ? 'is' : 'are'} in your flashcards now.
            <a href="/review" className={styles.link}>Review</a>
            <button type="button" className={styles.close} onClick={() => setSaved(null)} aria-label="Close">×</button>
        </div>
    );
}
