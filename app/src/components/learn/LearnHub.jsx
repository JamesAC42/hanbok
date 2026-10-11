'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { START_POINTS, getStartPoint, setStartPoint, getRead, pickNext } from '@/lib/learnProgress';
import styles from '@/styles/pages/learn.module.scss';

const normalize = (s) => (s || '').toLowerCase().replace(/[-()/\s]/g, '');

function Card({ item, done, step }) {
    return (
        <Link href={`/learn/${item.slug}`} className={`${styles.card} ${styles[`tone_${item.color}`] || ''} ${done ? styles.cardDone : ''}`}>
            <span className={styles.cardTop}>
                {step != null && <span className={styles.cardStep}>{step}</span>}
                <span className={styles.levelTag} data-level={item.level}>{item.level}</span>
                {done && <span className={styles.readTag}>✓ Read</span>}
            </span>
            <span className={styles.cardTitle} lang={item.language}>{item.shortTitle}</span>
            <span className={styles.cardDek}>{item.description}</span>
            <span className={styles.cardMeta}>{item.minutes} min</span>
        </Link>
    );
}

// The /learn hub: "next for you" from a starting point the visitor picks, then
// every guide grouped by topic with level, topic and text filters. The server
// renders the full list (no picks yet), so every guide is a plain link for search.
export default function LearnHub({ items, topics, levels }) {
    const [start, setStart] = useState(null);
    const [read, setRead] = useState([]);
    const [level, setLevel] = useState('all');
    const [topic, setTopic] = useState('all');
    const [query, setQuery] = useState('');
    const [ready, setReady] = useState(false);

    useEffect(() => {
        setStart(getStartPoint());
        setRead(getRead());
        setReady(true);
    }, []);

    const chooseStart = (key) => {
        setStart(key);
        setStartPoint(key);
    };

    const readSet = useMemo(() => new Set(read), [read]);
    const next = useMemo(() => (start ? pickNext(items, start, read) : []), [items, start, read]);
    const stepOf = useMemo(() => new Map(items.map((i, n) => [i.slug, n + 1])), [items]);

    const q = normalize(query);
    const matches = (i) =>
        (level === 'all' || i.level === level) &&
        (topic === 'all' || i.topic === topic) &&
        (!q || normalize(`${i.shortTitle} ${i.title} ${i.description} ${i.forms}`).includes(q));
    const groups = topics
        .map((t) => ({ ...t, items: items.filter((i) => i.topic === t.key && matches(i)) }))
        .filter((g) => g.items.length > 0);
    const filtered = level !== 'all' || topic !== 'all' || q;
    const readCount = items.filter((i) => readSet.has(i.slug)).length;

    return (
        <>
            <section className={styles.forYou} aria-labelledby="for-you">
                <div className={styles.forYouHead}>
                    <h2 className={styles.forYouTitle} id="for-you">
                        {start ? 'Up next for you' : 'Where are you with Korean?'}
                    </h2>
                    {ready && readCount > 0 && (
                        <span className={styles.progressText}>{readCount} of {items.length} guides read</span>
                    )}
                </div>
                <div className={styles.startPoints} role="group" aria-label="Your level">
                    {START_POINTS.map((p) => (
                        <button
                            key={p.key}
                            type="button"
                            className={`${styles.startPoint} ${start === p.key ? styles.startPointOn : ''}`}
                            aria-pressed={start === p.key}
                            onClick={() => chooseStart(p.key)}
                        >
                            <strong>{p.label}</strong>
                            <span>{p.hint}</span>
                        </button>
                    ))}
                </div>
                {start && next.length > 0 && (
                    <ul className={styles.cards}>
                        {next.map((i) => (
                            <li key={i.slug}><Card item={i} step={stepOf.get(i.slug)} /></li>
                        ))}
                    </ul>
                )}
                {start && next.length === 0 && (
                    <p className={styles.dek}>
                        You&rsquo;ve read every guide. Keep it fresh with a{' '}
                        <Link href="/lyrics">song breakdown</Link> or a line of your own in the{' '}
                        <Link href="/korean-sentence-analyzer">sentence analyzer</Link>.
                    </p>
                )}
            </section>

            <section className={styles.browse} aria-labelledby="all-guides">
                <h2 className={styles.sectionTitle} id="all-guides">All guides</h2>
                <div className={styles.filters}>
                    <input
                        type="search"
                        className={styles.search}
                        placeholder="Search guides, e.g. because or 지만"
                        aria-label="Search guides"
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                    />
                    <div className={styles.chipRow} role="group" aria-label="Level">
                        {['all', ...levels].map((l) => (
                            <button key={l} type="button" aria-pressed={level === l}
                                className={`${styles.filterChip} ${level === l ? styles.filterChipOn : ''}`}
                                onClick={() => setLevel(l)}>
                                {l === 'all' ? 'All levels' : l}
                            </button>
                        ))}
                    </div>
                    <div className={styles.chipRow} role="group" aria-label="Topic">
                        {[{ key: 'all', title: 'All topics' }, ...topics].map((t) => (
                            <button key={t.key} type="button" aria-pressed={topic === t.key}
                                className={`${styles.filterChip} ${topic === t.key ? styles.filterChipOn : ''}`}
                                onClick={() => setTopic(t.key)}>
                                {t.title}
                            </button>
                        ))}
                    </div>
                </div>

                {groups.length === 0 && (
                    <p className={styles.dek}>
                        No guide matches that yet. Try another word, or paste your sentence into the{' '}
                        <Link href="/korean-sentence-analyzer">sentence analyzer</Link>.
                    </p>
                )}
                {groups.map((g) => (
                    <section key={g.key} className={styles.topicGroup} id={g.key} aria-labelledby={`topic-${g.key}`}>
                        <h3 className={styles.topicTitle} id={`topic-${g.key}`}>{g.title}</h3>
                        <p className={styles.topicBlurb}>{g.blurb}</p>
                        <ul className={styles.cards}>
                            {g.items.map((i) => (
                                <li key={i.slug}><Card item={i} done={readSet.has(i.slug)} step={filtered ? null : stepOf.get(i.slug)} /></li>
                            ))}
                        </ul>
                    </section>
                ))}
            </section>
        </>
    );
}
