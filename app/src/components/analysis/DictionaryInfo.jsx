'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { track } from '@/lib/analytics';
import { loginHref } from '@/lib/anonSentences';
import { LEVELS, canLookUp, fetchDictionary } from '@/lib/dictionary';
import styles from '@/styles/components/sentenceanalyzer/dictionary.module.scss';

const PLAN_NAMES = ['free', 'basic', 'plus'];

// Under a word's details: its learner level (free), its Hanja, and other
// common words built from the same characters (one per character free,
// the whole family on Plus). Data comes from the Korean Learners' Dictionary.
const DictionaryInfo = ({ wordInfo, language, translationLanguage }) => {
    const { user } = useAuth();
    const [entry, setEntry] = useState(null);
    const enabled = canLookUp(wordInfo, language);

    useEffect(() => {
        setEntry(null);
        if (!enabled) return;
        let live = true;
        fetchDictionary(wordInfo, translationLanguage)
            .then(e => { if (live) setEntry(e); })
            .catch(() => {});
        return () => { live = false; };
    }, [wordInfo, enabled, translationLanguage]);

    if (!enabled || !entry || (!entry.level && !entry.hanja?.length)) return null;

    const level = LEVELS[entry.level];
    const families = (entry.families || []).filter(f => f.words?.length);
    const hidden = families.reduce((n, f) => n + Math.max(0, (f.count || 0) - f.words.length), 0);
    const plan = PLAN_NAMES[user?.tier || 0];

    return (
        <div className={styles.dictionary}>
            <div className={styles.topRow}>
                {level && (
                    <span className={`${styles.level} ${styles[`level_${entry.level}`]}`}>
                        {level.label} <small>{level.topik}</small>
                    </span>
                )}
                {entry.hanja?.length > 0 && (
                    <span className={styles.hanja} title="Hanja (Chinese characters)">
                        {entry.hanja.map((h, i) => (
                            <span key={i} className={styles.hanjaChar}>
                                <b>{h.char}</b>
                                {h.reading && <small>{h.reading}</small>}
                            </span>
                        ))}
                    </span>
                )}
            </div>

            {families.length > 0 && (
                <div className={styles.families}>
                    <span className={styles.familyLabel}>Word family</span>
                    {families.map(f => (
                        <div key={f.char} className={styles.family}>
                            <span className={styles.familyHead}>
                                <b>{f.char}</b>{f.reading && <small>{f.reading}</small>}
                            </span>
                            <ul className={styles.familyWords}>
                                {f.words.map(w => (
                                    <li key={w.word}>
                                        <span className={styles.familyWord}>{w.word}</span>
                                        {w.meaning && <span className={styles.familyMeaning}>{w.meaning}</span>}
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                    {entry.familyLocked && hidden > 0 && (
                        <Link
                            href={user ? '/pricing' : loginHref(true)}
                            className={styles.more}
                            onClick={() => track('layer_upgrade_click', { layer: 'family', plan })}
                        >
                            {hidden} more related {hidden === 1 ? 'word' : 'words'} with Plus
                        </Link>
                    )}
                </div>
            )}

            {entry.link && (
                <a className={styles.source} href={entry.link} target="_blank" rel="noopener noreferrer">
                    Korean Learners&apos; Dictionary
                </a>
            )}
        </div>
    );
};

export default DictionaryInfo;
