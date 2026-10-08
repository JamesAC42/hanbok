'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Dashboard from '@/components/Dashboard';
import SpeakScene from '@/components/speak/SpeakScene';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { addWord } from '@/api/words';
import { track } from '@/lib/analytics';
import styles from '@/styles/pages/speak.module.scss';

const LEVELS = [
    { id: 'beginner', label: 'Beginner' },
    { id: 'intermediate', label: 'Intermediate' },
    { id: 'advanced', label: 'Advanced' },
];

const languageName = (code) => {
    try { return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) || code; } catch { return code; }
};

const minutesText = (a) => {
    if (!a) return '';
    const left = Math.floor(a.leftSeconds / 60);
    const span = a.windowDays === 7 ? 'this week' : 'this month';
    return `${left} of ${a.minutes} speaking minutes left ${span}`;
};

export default function SpeakPage() {
    const { isAuthenticated, user } = useAuth();
    const { language, nativeLanguage } = useLanguage();
    const [data, setData] = useState(null);
    const [level, setLevel] = useState('beginner');
    const [active, setActive] = useState(null); // scenario in a call
    const [result, setResult] = useState(null);
    const [limit, setLimit] = useState(null);
    const [saved, setSaved] = useState({});

    const load = useCallback(() => {
        fetch(`/api/speak?language=${encodeURIComponent(language || 'ko')}`, { credentials: 'include' })
            .then((r) => r.json()).then(setData).catch(() => setData({ scenarios: [] }));
    }, [language]);
    useEffect(() => { load(); }, [load, isAuthenticated]);

    useEffect(() => {
        try { const l = localStorage.getItem('speakLevel'); if (l) setLevel(l); } catch { /* private mode */ }
    }, []);
    const pickLevel = (l) => { setLevel(l); try { localStorage.setItem('speakLevel', l); } catch { /* private mode */ } };

    const start = (s) => {
        if (!isAuthenticated) return;
        if (data?.allowance && data.allowance.leftSeconds < 30) { setLimit(data.allowance); track('speak_limit', { where: 'picker' }); return; }
        setResult(null);
        setLimit(null);
        setActive(s);
    };

    const onDone = useCallback((r) => {
        setActive(null);
        if (r) {
            setResult(r);
            if (r.allowance) setData((d) => ({ ...d, allowance: r.allowance }));
        }
        load();
    }, [load]);

    const onLimit = useCallback((a) => {
        setActive(null);
        setLimit(a || data?.allowance || {});
        track('speak_limit', { where: 'start' });
    }, [data]);

    const savePhrase = async (p) => {
        setSaved((s) => ({ ...s, [p.word]: 'saving' }));
        try {
            const r = await addWord({ originalWord: p.word, translatedWord: p.text, originalLanguage: language, translationLanguage: nativeLanguage });
            setSaved((s) => ({ ...s, [p.word]: r?.reachedLimit ? 'limit' : 'saved' }));
        } catch {
            setSaved((s) => ({ ...s, [p.word]: 'error' }));
        }
    };

    const nativeName = languageName(nativeLanguage || 'en');

    if (active) {
        return (
            <div className={styles.callShell}>
                <SpeakScene
                    scenario={active}
                    level={level}
                    language={language}
                    nativeLanguage={nativeLanguage}
                    nativeName={nativeName}
                    onDone={onDone}
                    onLimit={onLimit}
                />
            </div>
        );
    }

    return (
        <Dashboard>
            <div className={styles.page}>
                <header className={styles.hero}>
                    <img className={styles.heroArt} src="/images/speak/horang/happy.webp" alt="Horang, Hanbok's tutor" />
                    <div className={styles.heroText}>
                        <p className={styles.label}>Speak</p>
                        <h1 className={styles.title}>Talk it out with Horang</h1>
                        <p className={styles.dek}>
                            Pick a scene and just talk. Horang plays the barista, the taxi driver or the K-drama lead, helps in {nativeName} when you get stuck,
                            and works in the words you&apos;ve saved.
                        </p>
                        {isAuthenticated && data?.allowance && <p className={styles.minutes}>{minutesText(data.allowance)}</p>}
                        {!isAuthenticated && (
                            <Link className={styles.primaryBtn} href="/login?next=/speak">Sign up free to talk</Link>
                        )}
                    </div>
                </header>

                {result && (
                    <section className={styles.result} aria-label="How it went">
                        <h2 className={styles.resultTitle}>
                            {result.goals.every((g) => g.done) ? 'Scene complete!' : 'Nice practice!'}
                        </h2>
                        {result.summary && <p className={styles.resultSummary}>&ldquo;{result.summary}&rdquo; <span>Horang</span></p>}
                        <ul className={styles.resultGoals}>
                            {result.goals.map((g) => <li key={g.text} className={g.done ? styles.goalDone : ''}>{g.done ? '✓ ' : ''}{g.text}</li>)}
                        </ul>
                        {result.phrases.length > 0 && (
                            <>
                                <h3 className={styles.resultSub}>Phrases from this scene</h3>
                                <ul className={styles.phraseList}>
                                    {result.phrases.map((p) => (
                                        <li key={p.word}>
                                            <span lang={language} className={styles.phraseWord}>{p.word}</span>
                                            <span className={styles.phraseMeaning}>{p.text}</span>
                                            <button type="button" className={styles.saveBtn} disabled={!!saved[p.word]} onClick={() => savePhrase(p)}>
                                                {saved[p.word] === 'saved' ? 'Saved' : saved[p.word] === 'limit' ? 'Library full' : saved[p.word] === 'saving' ? 'Saving…' : 'Save'}
                                            </button>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                        {result.tips.filter((t) => t.kind === 'tip').length > 0 && (
                            <>
                                <h3 className={styles.resultSub}>Pronunciation notes</h3>
                                <ul className={styles.tipList}>
                                    {result.tips.filter((t) => t.kind === 'tip').map((t) => (
                                        <li key={t.key}><span lang={language}>{t.word}</span> {t.text}</li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </section>
                )}

                {limit && (
                    <section className={styles.limit}>
                        <h2>You&apos;ve used your speaking minutes</h2>
                        <p>
                            {limit.tier === 2
                                ? 'Your minutes come back as older calls roll off. Thanks for talking so much!'
                                : 'Upgrade for more time with Horang every month.'}
                        </p>
                        {limit.tier !== 2 && <Link className={styles.primaryBtn} href="/pricing">See plans</Link>}
                    </section>
                )}

                <div className={styles.levelRow} role="radiogroup" aria-label="Your level">
                    {LEVELS.map((l) => (
                        <button key={l.id} type="button" role="radio" aria-checked={level === l.id}
                            className={`${styles.levelBtn} ${level === l.id ? styles.levelOn : ''}`} onClick={() => pickLevel(l.id)}>
                            {l.label}
                        </button>
                    ))}
                </div>

                <ul className={styles.sceneGrid}>
                    {(data?.scenarios || []).map((s) => (
                        <li key={s.id}>
                            {isAuthenticated ? (
                                <button type="button" className={styles.sceneCard} onClick={() => start(s)}>
                                    <SceneCardBody s={s} />
                                </button>
                            ) : (
                                <Link className={styles.sceneCard} href="/login?next=/speak">
                                    <SceneCardBody s={s} />
                                </Link>
                            )}
                        </li>
                    ))}
                </ul>
                <p className={styles.footNote}>
                    Use headphones if you can. Horang hears you through your microphone; conversations are saved to your account so you can review them.
                    {user && user.tier === 0 ? ' Free accounts get a few minutes a week.' : ''}
                </p>
            </div>
        </Dashboard>
    );
}

function SceneCardBody({ s }) {
    return (
        <>
            <span className={styles.sceneThumb} style={{ backgroundImage: `url(/images/speak/bg/${s.background}.webp)` }} />
            <span className={styles.sceneInfo}>
                <span className={styles.sceneLevel}>{s.level === 'any' ? 'Any level' : s.level}</span>
                <span className={styles.sceneName}>{s.title}</span>
                <span className={styles.sceneBlurb}>{s.blurb}</span>
            </span>
        </>
    );
}
