'use client';
import { useMemo, useState } from 'react';
import { pronounce, RULES } from '@/lib/korean/soundRules';
import PlusGate from '@/components/analysis/layers/PlusGate';
import styles from '@/styles/components/sentenceanalyzer/layers.module.scss';

// "How it's said": the sentence as Koreans pronounce it, with every sound
// change marked. Free shows the spoken line and the first change explained;
// Plus explains them all.
const SoundLayer = ({ analysis, hasPlus }) => {
    const result = useMemo(
        () => pronounce(analysis?.sentence?.original || '', analysis?.components || []),
        [analysis]
    );
    const [active, setActive] = useState(result.changes.length ? 0 : null);
    const shown = hasPlus ? result.changes : result.changes.slice(0, 1);
    const locked = hasPlus ? [] : result.changes.slice(1);

    if (!result.changes.length) {
        return (
            <div className={styles.layerBody}>
                <p className={`${styles.spoken} korean`}>[{result.spoken.trim()}]</p>
                <p className={styles.muted}>This one is said just the way it's written. No sound changes.</p>
            </div>
        );
    }

    const current = active !== null ? result.changes[active] : null;
    const rule = current ? RULES[current.rule] : null;

    return (
        <div className={styles.layerBody}>
            <p className={styles.layerLead}>How a Korean speaker says it. Underlined sounds change from the spelling.</p>
            <p className={`${styles.spoken} korean`} aria-label={`Pronounced ${result.spoken}`}>
                [{result.units.map((u, i) => (
                    u.change === null
                        ? <span key={i}>{u.spoken}</span>
                        : (
                            <span
                                key={i}
                                className={`${styles.changed} ${u.change === active ? styles.changedActive : ''}`}
                            >{u.spoken}</span>
                        )
                ))}]
            </p>

            <div className={styles.rules}>
                {shown.map((c, i) => (
                    <button
                        key={i}
                        type="button"
                        className={styles.rule}
                        aria-pressed={active === i}
                        onClick={() => setActive(active === i ? null : i)}
                    >
                        <b>{RULES[c.rule].name}</b>
                        <small className="korean">{c.written} → [{c.spoken}]</small>
                    </button>
                ))}
                {locked.map((c, i) => (
                    <span key={`l${i}`} className={`${styles.rule} ${styles.ruleLocked}`} aria-label="Plus">
                        <b>{RULES[c.rule].name}</b>
                        <small className="korean">{c.written} → [ · · · ]</small>
                    </span>
                ))}
            </div>

            {rule && (
                <div className={styles.explain}>
                    <b>{rule.name} <span className="korean">({rule.ko})</span></b>
                    <p><span className="korean">{current.written} → [{current.spoken}]</span>. {rule.why}</p>
                </div>
            )}

            {locked.length > 0 && (
                <PlusGate layer="sound" title={`${locked.length} more sound ${locked.length === 1 ? 'change' : 'changes'} in this sentence`}>
                    Plus explains every sound change, on every sentence you analyze.
                </PlusGate>
            )}
        </div>
    );
};

export default SoundLayer;
