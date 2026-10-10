'use client';
import { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { usePopup } from '@/contexts/PopupContext';
import { addWord } from '@/api/words';
import styles from '@/styles/pages/learn.module.scss';

// A vocabulary list where every word has its own Save button.
// items: [{ ko, rom, en, note, href? }]; with href the word links to its phrase page.
const WordList = ({ items, lang = 'ko' }) => {
    const { user } = useAuth();
    const { showLoginRequiredPopup } = usePopup();
    const [saved, setSaved] = useState({});

    const save = async (item) => {
        if (!user) {
            showLoginRequiredPopup('words');
            return;
        }
        setSaved((s) => ({ ...s, [item.ko]: 'saving' }));
        try {
            const res = await addWord({ originalWord: item.ko, translatedWord: item.en, originalLanguage: lang, translationLanguage: 'en' });
            setSaved((s) => ({ ...s, [item.ko]: res.reachedLimit ? 'limit' : 'saved' }));
        } catch {
            setSaved((s) => ({ ...s, [item.ko]: null }));
        }
    };

    return (
        <ol className={styles.wordList}>
            {items.map((item) => {
                const state = saved[item.ko];
                return (
                    <li key={item.ko} className={styles.wordItem}>
                        <div className={styles.wordHead}>
                            {item.href
                                ? <Link href={item.href} className={`${styles.wordKo} ${styles.wordLink}`} lang={lang}>{item.ko}</Link>
                                : <span className={styles.wordKo} lang={lang}>{item.ko}</span>}
                            <span className={styles.wordRom}>{item.rom}</span>
                            <button
                                type="button"
                                className={styles.saveButton}
                                onClick={() => save(item)}
                                disabled={state === 'saving' || state === 'saved'}
                            >
                                {state === 'saved' ? 'Saved' : state === 'limit' ? 'Deck full' : state === 'saving' ? '...' : 'Save'}
                            </button>
                        </div>
                        <p className={styles.wordEn}>{item.en}</p>
                        {item.note && <p className={styles.wordNote}>{item.note}</p>}
                    </li>
                );
            })}
        </ol>
    );
};

export default WordList;
