'use client';
import { useMemo, useState } from 'react';
import { buildMap } from '@/lib/sentenceMap';
import getFontClass from '@/lib/fontClass';
import PlusGate from '@/components/analysis/layers/PlusGate';
import styles from '@/styles/components/sentenceanalyzer/layers.module.scss';

const TONES = ['purple', 'keep', 'und', 'read', 'rev', 'flame'];

// "Sentence map": the sentence split into the phrases a native speaker hears,
// each labelled with its job. Free shows the groups and the first meaning;
// Plus shows every meaning.
const MapLayer = ({ analysis, language, hasPlus }) => {
    const groups = useMemo(() => buildMap(analysis), [analysis]);
    const [active, setActive] = useState(0);
    const font = getFontClass(language);

    if (!groups) {
        return (
            <div className={styles.layerBody}>
                <p className={styles.muted}>This analysis was made before sentence maps existed. Analyze the sentence again to get one.</p>
            </div>
        );
    }

    const canSee = (i) => hasPlus || i === 0;
    const current = groups[active];

    return (
        <div className={styles.layerBody}>
            <p className={styles.layerLead}>How the sentence breaks into phrases. Tap a phrase to see what it does.</p>
            <div className={styles.mapRow}>
                {groups.map((g, i) => (
                    <button
                        key={g.id}
                        type="button"
                        className={`${styles.mapGroup} ${styles[`tone_${TONES[i % TONES.length]}`]}`}
                        aria-pressed={active === i}
                        onClick={() => setActive(i)}
                    >
                        <span className={`${styles.mapWords} ${font}`}>{g.words.join(' ')}</span>
                        <span className={styles.mapRole}>{g.role || 'Part'}</span>
                    </button>
                ))}
            </div>

            <div className={styles.explain}>
                <b className={font}>{current.words.join(' ')}</b>
                {canSee(active)
                    ? <p>{current.role ? `${current.role}: ` : ''}{current.gloss || 'No note for this part.'}</p>
                    : <p className={styles.muted}>{current.role ? `${current.role}: ` : ''}Plus shows what each phrase means.</p>}
            </div>

            {hasPlus && groups.some(g => g.gloss) && (
                <p className={styles.mapRead}>
                    <span className={styles.rowLabel}>Read it as</span>{' '}
                    {groups.map(g => g.gloss || g.words.join(' ')).join(' · ')}
                </p>
            )}

            {!hasPlus && groups.length > 1 && (
                <PlusGate layer="map" title="See what every phrase does">
                    Plus explains each part of the sentence map, on every sentence you analyze.
                </PlusGate>
            )}
        </div>
    );
};

export default MapLayer;
