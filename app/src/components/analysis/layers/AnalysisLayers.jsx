'use client';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { track } from '@/lib/analytics';
import SoundLayer from '@/components/analysis/layers/SoundLayer';
import PracticeLayer from '@/components/analysis/layers/PracticeLayer';
import MapLayer from '@/components/analysis/layers/MapLayer';
import AskLayer from '@/components/analysis/layers/AskLayer';
import { buildMap } from '@/lib/sentenceMap';
import styles from '@/styles/components/sentenceanalyzer/layers.module.scss';

const PLAN_NAMES = ['free', 'basic', 'plus'];

// The row of extra layers under a breakdown. Each layer opens in place; free
// learners see a real part of it and a lock. Every open is tracked so we can
// see which layers people actually want.
const AnalysisLayers = ({ analysis, language, sentenceKey, sentenceId }) => {
    const { user } = useAuth();
    const tier = user?.tier || 0;
    const hasPlus = tier >= 2;
    const [open, setOpen] = useState(null);

    const layers = [
        language === 'ko' && { id: 'sound', label: "How it's said", plus: true },
        buildMap(analysis) && { id: 'map', label: 'Sentence map', plus: true },
        { id: 'practice', label: 'Practice it', plus: true },
        /^\d+$/.test(String(sentenceId ?? '')) && { id: 'ask', label: 'Ask Horangi' },
    ].filter(Boolean);

    const toggle = (id) => {
        const next = open === id ? null : id;
        setOpen(next);
        if (next) track('layer_open', { layer: id, plan: PLAN_NAMES[tier] || 'free', language });
    };

    return (
        <section className={styles.layers} aria-label="Go deeper">
            <div className={styles.layerRow} role="tablist">
                <span className={styles.rowLabel}>Go deeper</span>
                {layers.map(l => (
                    <button
                        key={l.id}
                        type="button"
                        role="tab"
                        aria-selected={open === l.id}
                        className={`${styles.layerTab} ${open === l.id ? styles.layerTabOpen : ''}`}
                        onClick={() => toggle(l.id)}
                    >
                        {l.label}
                        {l.plus && !hasPlus && <span className={styles.plusBadge}>Plus</span>}
                    </button>
                ))}
            </div>
            {open === 'sound' && <SoundLayer analysis={analysis} hasPlus={hasPlus} />}
            {open === 'map' && <MapLayer analysis={analysis} language={language} hasPlus={hasPlus} />}
            {open === 'ask' && <AskLayer analysis={analysis} language={language} sentenceId={sentenceId} />}
            {open === 'practice' && (
                <PracticeLayer analysis={analysis} language={language} sentenceKey={sentenceKey} tier={tier} />
            )}
        </section>
    );
};

export default AnalysisLayers;
