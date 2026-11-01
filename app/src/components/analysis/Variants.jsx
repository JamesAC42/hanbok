'use client';
import { useMemo, useState } from 'react';
import kpop from 'kpop';
import styles from '@/styles/components/sentenceanalyzer/variants.module.scss';
import { useLanguage } from '@/contexts/LanguageContext';
import getFontClass from '@/lib/fontClass';
import { buildDial } from '@/lib/formalityDial';
import { track } from '@/lib/analytics';

// Formality dial: slide from casual to formal and watch only the words that
// change light up. Replaces the old row of variant cards.
const Variants = ({ analysis, language, showPronunciation }) => {
    const { t } = useLanguage();
    const dial = useMemo(() => buildDial(analysis), [analysis]);
    const [at, setAt] = useState(null);

    if (!dial || dial.stops.length < 2) return null;
    const index = at ?? dial.start;
    const stop = dial.stops[index];

    const reading = () => {
        if (!showPronunciation) return null;
        if (language === 'ko') {
            try { return kpop.romanize(stop.text); } catch { return null; }
        }
        if (language === 'ru') return stop.transliteration || null;
        return stop.reading || null;
    };

    const move = (next) => {
        setAt(next);
        track('formality_dial', { to: dial.stops[next].label });
    };

    const title = t('analysis.variants.title');

    return (
        <div className={styles.variants}>
            <h3 className={styles.variantsHeader}>
                {title === 'analysis.variants.title' ? 'Say it more or less formally' : title}
            </h3>
            <div className={styles.dial}>
                <div className={styles.dialTop}>
                    <span className={styles.dialLabel}>{stop.label}</span>
                    {stop.isOriginal && stop.label !== 'Your sentence' && <span className={styles.dialYours}>Your sentence</span>}
                </div>
                <div className={`${styles.dialText} ${getFontClass(language)}`} aria-live="polite">
                    {stop.words.map((w, i) => (
                        <span key={i} className={w.changed && !stop.isOriginal ? styles.dialChanged : ''}>{w.word}{i < stop.words.length - 1 ? ' ' : ''}</span>
                    ))}
                </div>
                {reading() && <div className={styles.variantReading}>{reading()}</div>}
                <input
                    id="formality-dial"
                    className={styles.dialRange}
                    type="range"
                    min={0}
                    max={dial.stops.length - 1}
                    step={1}
                    value={index}
                    onChange={e => move(Number(e.target.value))}
                    aria-label="Formality"
                    aria-valuetext={stop.label}
                />
                <div className={styles.dialStops} style={{ gridTemplateColumns: `repeat(${dial.stops.length}, 1fr)` }}>
                    {dial.stops.map((s, i) => (
                        <button
                            key={s.label + i}
                            type="button"
                            className={`${styles.dialStop} ${i === index ? styles.dialStopOn : ''}`}
                            onClick={() => move(i)}
                        >{s.label}</button>
                    ))}
                </div>
                {stop.when && <p className={styles.variantWhenToUse}>{stop.when}</p>}
            </div>
        </div>
    );
};

export default Variants;
