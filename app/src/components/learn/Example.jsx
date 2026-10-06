'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePopup } from '@/contexts/PopupContext';
import { addWord } from '@/api/words';
import styles from '@/styles/pages/learn.module.scss';

// A tappable example sentence. `words` is a list of chips; each chip has parts
// ({ t, g, particle?, base?, gloss? }). Particles are colored, and tapping a chip
// opens its meaning with a Save button that adds the word to the reader's deck.
// Everything is in the server HTML, so search engines read the breakdown too.
const Example = ({ words, translation, note, lang = 'ko' }) => {
    const router = useRouter();
    const { user } = useAuth();
    const { setLanguage } = useLanguage();
    const { showLoginRequiredPopup } = usePopup();
    const [open, setOpen] = useState(null);
    const [saved, setSaved] = useState({});
    const sentence = words.map((w) => w.parts.map((p) => p.t).join('')).join(' ');

    const save = async (part) => {
        if (!user) {
            showLoginRequiredPopup('words');
            return;
        }
        const word = part.base || part.t;
        setSaved((s) => ({ ...s, [word]: 'saving' }));
        try {
            const res = await addWord({
                originalWord: word,
                translatedWord: part.gloss || part.g,
                originalLanguage: lang,
                translationLanguage: 'en',
            });
            setSaved((s) => ({ ...s, [word]: res.reachedLimit ? 'limit' : 'saved' }));
        } catch {
            setSaved((s) => ({ ...s, [word]: null }));
        }
    };

    const breakDown = () => {
        setLanguage(lang);
        // The analyze page picks this up and fills its input.
        localStorage.setItem('pendingAnalysis', sentence);
        router.push('/analyze');
    };

    const active = open !== null ? words[open] : null;

    return (
        <figure className={styles.example}>
            <div className={styles.exampleSentence} lang={lang}>
                {words.map((w, i) => (
                    <button
                        key={i}
                        type="button"
                        className={`${styles.chip} ${open === i ? styles.chipOpen : ''}`}
                        onClick={() => setOpen(open === i ? null : i)}
                        aria-expanded={open === i}
                    >
                        {w.parts.map((p, j) => (
                            <span key={j} className={p.particle ? styles.particle : undefined}>{p.t}</span>
                        ))}
                    </button>
                ))}
            </div>
            <figcaption className={styles.exampleTranslation}>{translation}</figcaption>

            {active && (
                <div className={styles.exampleDetail}>
                    {active.parts.map((p, j) => {
                        const word = p.base || p.t;
                        const state = saved[word];
                        return (
                            <div key={j} className={styles.detailRow}>
                                <span className={`${styles.detailWord} ${p.particle ? styles.detailParticle : ''}`} lang={lang}>
                                    {p.t}
                                    {p.base && <small> ({p.base})</small>}
                                </span>
                                <span className={styles.detailGloss}>{p.g}</span>
                                {!p.particle && (
                                    <button
                                        type="button"
                                        className={styles.saveButton}
                                        onClick={() => save(p)}
                                        disabled={state === 'saving' || state === 'saved'}
                                    >
                                        {state === 'saved' ? 'Saved' : state === 'limit' ? 'Deck full' : state === 'saving' ? '...' : 'Save'}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}

            <div className={styles.exampleFoot}>
                {note && <p className={styles.exampleNote}>{note}</p>}
                <button type="button" className={styles.breakDownButton} onClick={breakDown}>
                    Full breakdown
                </button>
            </div>
        </figure>
    );
};

export default Example;
