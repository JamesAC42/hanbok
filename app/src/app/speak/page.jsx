'use client';
import { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import Dashboard from '@/components/Dashboard';
import SpeakScene from '@/components/speak/SpeakScene';
import { CHARACTERS, ASSISTS, defaultAssist, characterOf } from '@/components/speak/characters';
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
const PLAN_NAMES = ['Free', 'Basic', 'Plus'];

const languageName = (code) => {
    try { return new Intl.DisplayNames(['en'], { type: 'language' }).of(code) || code; } catch { return code; }
};
const per = (p) => (p.windowDays === 7 ? 'week' : 'month');
const shortDate = (d) => new Date(d).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
const store = (k, v) => { try { localStorage.setItem(k, v); } catch { /* private mode */ } };

export default function SpeakPage() {
    const { isAuthenticated } = useAuth();
    const { language, nativeLanguage } = useLanguage();
    const [data, setData] = useState(null);
    const [level, setLevel] = useState('beginner');
    const [assist, setAssist] = useState('guided');
    const [active, setActive] = useState(null);
    const [result, setResult] = useState(null);
    const [limit, setLimit] = useState(null);
    const [saved, setSaved] = useState({});

    const load = useCallback(() => {
        fetch(`/api/speak?language=${encodeURIComponent(language || 'ko')}`, { credentials: 'include' })
            .then((r) => r.json()).then(setData).catch(() => setData({ scenarios: [], plans: [] }));
    }, [language]);
    useEffect(() => { load(); }, [load, isAuthenticated]);

    useEffect(() => {
        try {
            const l = localStorage.getItem('speakLevel');
            const a = localStorage.getItem('speakAssist');
            if (l) setLevel(l);
            setAssist(a || defaultAssist(l || 'beginner'));
        } catch { /* private mode */ }
    }, []);
    const pickLevel = (l) => {
        setLevel(l);
        store('speakLevel', l);
        // A new level resets help to that level's default unless they chose one.
        let chosen = null;
        try { chosen = localStorage.getItem('speakAssist'); } catch { /* private mode */ }
        if (!chosen) setAssist(defaultAssist(l));
    };
    const pickAssist = (a) => { setAssist(a); store('speakAssist', a); };

    const allowance = data?.allowance;
    const tier = allowance?.tier || 0;
    const plans = data?.plans || [];

    const start = (s) => {
        if (allowance && allowance.leftSeconds < 30) { setLimit(allowance); track('speak_limit', { where: 'picker' }); return; }
        setResult(null);
        setLimit(null);
        setActive(s);
    };

    const onDone = useCallback((r) => {
        setActive(null);
        if (r) {
            setResult(r);
            setSaved({});
            if (r.allowance) setData((d) => ({ ...d, allowance: r.allowance }));
            window.scrollTo?.(0, 0);
        }
        load();
    }, [load]);

    const onLimit = useCallback((a) => {
        setActive(null);
        setLimit(a || allowance || {});
        track('speak_limit', { where: 'start' });
    }, [allowance]);

    const savePhrase = async (p) => {
        if (saved[p.word]) return;
        setSaved((s) => ({ ...s, [p.word]: 'saving' }));
        try {
            const r = await addWord({ originalWord: p.word, translatedWord: p.text, originalLanguage: language, translationLanguage: nativeLanguage });
            setSaved((s) => ({ ...s, [p.word]: r?.reachedLimit ? 'limit' : 'saved' }));
        } catch {
            setSaved((s) => ({ ...s, [p.word]: 'error' }));
        }
    };
    const saveAll = () => result.phrases.reduce((chain, p) => chain.then(() => savePhrase(p)), Promise.resolve());

    const nativeName = languageName(nativeLanguage || 'en');
    const scenarios = data?.scenarios || [];

    if (active) {
        return (
            <div className={styles.callShell}>
                <SpeakScene
                    scenario={active}
                    level={level}
                    assist={assist}
                    tier={tier}
                    language={language}
                    nativeLanguage={nativeLanguage}
                    nativeName={nativeName}
                    onDone={onDone}
                    onLimit={onLimit}
                />
            </div>
        );
    }

    const resultCh = result ? characterOf(result.character) : null;
    const minutesLeft = allowance ? Math.floor(allowance.leftSeconds / 60) : 0;

    return (
        <Dashboard>
            <div className={styles.page}>
                <header className={styles.hero}>
                    <div className={styles.heroCast} aria-hidden="true">
                        <img className={styles.heroSora} src="/images/speak/sora/happy.webp" alt="" />
                        <img className={styles.heroHorang} src="/images/speak/horang/happy.webp" alt="" />
                    </div>
                    <div className={styles.heroText}>
                        <p className={styles.label}>Speak</p>
                        <h1 className={styles.title}>Talk it out with Horang and Sora</h1>
                        <p className={styles.dek}>
                            Pick a scene and just talk out loud. They play the barista, the taxi driver or your new friend in Seoul,
                            help in {nativeName} when you get stuck, and work in the words you&apos;ve saved.
                        </p>
                    </div>
                </header>

                {result && (
                    <section className={styles.result} aria-label="How it went" style={{ '--accent': resultCh.color, '--accent-soft': resultCh.soft }}>
                        <div className={styles.resultHead}>
                            <span className={`${styles.castFace} ${styles.resultFace}`} style={{ '--face': resultCh.face }}><img src={`/images/speak/${resultCh.id}/${resultCh.celebrate}.webp`} alt="" /></span>
                            <div>
                                <h2 className={styles.resultTitle}>{result.goals.every((g) => g.done) ? 'Scene complete!' : 'Nice practice!'}</h2>
                                {result.summary && <p className={styles.resultSummary}>&ldquo;{result.summary}&rdquo; <span>{resultCh.name}</span></p>}
                            </div>
                        </div>
                        <ul className={styles.resultGoals}>
                            {result.goals.map((g) => <li key={g.text} className={g.done ? styles.goalDone : ''}>{g.done ? '✓ ' : ''}{g.text}</li>)}
                        </ul>
                        {result.phrases.length > 0 && (
                            <>
                                <div className={styles.resultRow}>
                                    <h3 className={styles.resultSub}>Phrases from this scene</h3>
                                    {isAuthenticated && result.phrases.length > 1 && (
                                        <button type="button" className={styles.linkBtn} onClick={saveAll}>Save all</button>
                                    )}
                                </div>
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
                        {tier < 1 && allowance && (
                            <p className={styles.resultUpsell}>
                                {minutesLeft > 0 ? `${minutesLeft} free ${minutesLeft === 1 ? 'minute' : 'minutes'} left this week. ` : 'That was your free time for this week. '}
                                <Link href="/pricing" onClick={() => track('speak_upsell', { where: 'result' })}>Basic gives you 60 minutes a month for $4.</Link>
                            </p>
                        )}
                    </section>
                )}

                {limit && (
                    <section className={styles.limit}>
                        <h2>You&apos;ve used your speaking minutes</h2>
                        <p>
                            {limit.tier === 2
                                ? `Your minutes come back as older calls roll off${limit.resetsAt ? `, starting ${shortDate(limit.resetsAt)}` : ''}. Thanks for talking so much!`
                                : `More come back${limit.resetsAt ? ` on ${shortDate(limit.resetsAt)}` : ' soon'}. Or upgrade and keep talking today.`}
                        </p>
                        {limit.tier !== 2 && <Link className={styles.primaryBtn} href="/pricing" onClick={() => track('speak_upsell', { where: 'limit' })}>See plans</Link>}
                    </section>
                )}

                <section className={styles.planCard} aria-label="Your speaking minutes">
                    {isAuthenticated && allowance ? (
                        <div className={styles.meterBlock}>
                            <div className={styles.meterHead}>
                                <strong>{minutesLeft} of {allowance.minutes} minutes left</strong>
                                <span>{PLAN_NAMES[tier]} plan · per {per(allowance)}</span>
                            </div>
                            <div className={styles.meter}><div style={{ width: `${Math.min(100, (allowance.leftSeconds / (allowance.minutes * 60)) * 100)}%` }} /></div>
                            <p className={styles.meterNote}>
                                {allowance.usedSeconds > 0 && allowance.resetsAt
                                    ? `Minutes come back as calls roll off, starting ${shortDate(allowance.resetsAt)}.`
                                    : `Only time on a call counts, and a call is at most 10 minutes.`}
                            </p>
                        </div>
                    ) : (
                        <div className={styles.meterBlock}>
                            <div className={styles.meterHead}><strong>Try it free</strong><span>No card needed</span></div>
                            <p className={styles.meterNote}>Make a free account and get {plans[0]?.minutes || 5} speaking minutes every week.</p>
                            <Link className={styles.primaryBtn} href="/login?next=/speak" onClick={() => track('speak_upsell', { where: 'signup' })}>Sign up free to talk</Link>
                        </div>
                    )}
                    {plans.length > 0 && tier < 2 && (
                        <ul className={styles.planList}>
                            {plans.map((p) => (
                                <li key={p.tier} className={isAuthenticated && p.tier === tier ? styles.planOn : ''}>
                                    <span className={styles.planName}>{PLAN_NAMES[p.tier]}</span>
                                    <span className={styles.planMinutes}>{p.minutes} min</span>
                                    <span className={styles.planPer}>per {per(p)}</span>
                                </li>
                            ))}
                        </ul>
                    )}
                    {isAuthenticated && tier < 2 && (
                        <Link className={styles.upgradeLink} href="/pricing" onClick={() => track('speak_upsell', { where: 'plan_card' })}>
                            {tier === 0 ? 'Get more minutes' : 'Double it with Plus'}
                        </Link>
                    )}
                </section>

                <div className={styles.settings}>
                    <div className={styles.setting}>
                        <span className={styles.settingLabel} id="speak-level">Your level</span>
                        <div className={styles.levelRow} role="radiogroup" aria-labelledby="speak-level">
                            {LEVELS.map((l) => (
                                <button key={l.id} type="button" role="radio" aria-checked={level === l.id}
                                    className={`${styles.levelBtn} ${level === l.id ? styles.levelOn : ''}`} onClick={() => pickLevel(l.id)}>
                                    {l.label}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className={styles.setting}>
                        <span className={styles.settingLabel} id="speak-assist">How much help</span>
                        <div className={styles.levelRow} role="radiogroup" aria-labelledby="speak-assist">
                            {ASSISTS.map((a) => (
                                <button key={a.id} type="button" role="radio" aria-checked={assist === a.id}
                                    className={`${styles.levelBtn} ${assist === a.id ? styles.levelOn : ''}`} onClick={() => pickAssist(a.id)}>
                                    {a.label}
                                </button>
                            ))}
                        </div>
                        <span className={styles.settingHint}>{ASSISTS.find((a) => a.id === assist)?.blurb}</span>
                    </div>
                </div>

                {Object.values(CHARACTERS).map((ch) => {
                    const list = scenarios.filter((s) => (s.character || 'horang') === ch.id);
                    if (!list.length) return null;
                    return (
                        <section key={ch.id} className={styles.castGroup} style={{ '--accent': ch.color, '--accent-soft': ch.soft }}>
                            <div className={styles.castHead}>
                                <span className={styles.castFace} style={{ '--face': ch.face }}><img src={`/images/speak/${ch.id}/happy.webp`} alt="" /></span>
                                <div>
                                    <h2 className={styles.castName}>With {ch.name}</h2>
                                    <p className={styles.castTag}>{ch.tagline}</p>
                                </div>
                            </div>
                            <ul className={styles.sceneGrid}>
                                {list.map((s) => (
                                    <li key={s.id}>
                                        {isAuthenticated ? (
                                            <button type="button" className={styles.sceneCard} onClick={() => start(s)}>
                                                <SceneCardBody s={s} />
                                            </button>
                                        ) : (
                                            <Link className={styles.sceneCard} href="/login?next=/speak" onClick={() => track('speak_upsell', { where: 'scene', scene: s.id })}>
                                                <SceneCardBody s={s} />
                                            </Link>
                                        )}
                                    </li>
                                ))}
                            </ul>
                        </section>
                    );
                })}

                <p className={styles.footNote}>
                    Headphones help them hear you clearly. Your microphone is only on during a call, and conversations are saved to your account.
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
