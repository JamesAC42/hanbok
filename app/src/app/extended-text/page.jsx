'use client';
import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import Dashboard from '@/components/Dashboard';
import Mascot from '@/components/Mascot';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { characterLimitFor, countPassage, estimateSeconds } from '@/lib/extendedTextLimits';
import { samplesFor } from '@/lib/readerSamples';
import { readProgress } from '@/lib/readerProgress';
import { track } from '@/lib/analytics';
import getFontClass from '@/lib/fontClass';
import styles from '@/styles/pages/extendedtext.module.scss';

const BookIcon = () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M2 4h8a4 4 0 0 1 2 2v14a3 3 0 0 0-3-3H2z" /><path d="M22 4h-8a4 4 0 0 0-2 2v14a3 3 0 0 1 3-3h7z" /></svg>
);
const BulbIcon = () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 18h6" /><path d="M10 22h4" /><path d="M12 2a7 7 0 0 0-4 12.7V17h8v-2.3A7 7 0 0 0 12 2z" /></svg>
);
const BookmarkIcon = () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" /></svg>
);
const CheckIcon = () => (
    <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" /></svg>
);

export default function ExtendedTextPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading } = useAuth();
    const {
        language: learningLanguage,
        nativeLanguage,
        supportedLanguages,
        supportedAnalysisLanguages,
        t
    } = useLanguage();

    const [text, setText] = useState('');
    const [title, setTitle] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);
    const [recent, setRecent] = useState([]);

    const tier = user?.tier ?? 0;
    const maxCharacters = characterLimitFor(tier);
    const trimmed = text.trim();
    const counts = useMemo(() => countPassage(text), [text]);
    const overLimit = trimmed.length > maxCharacters;
    const weeklyTotal = user?.weekExtendedTextTotal ?? null;
    const weeklyRemaining = user?.weekExtendedTextRemaining ?? null;
    const isUnlimited = weeklyTotal === null;
    const isOutOfQuota = !isUnlimited && weeklyRemaining !== null && weeklyRemaining <= 0;
    const tooShort = trimmed.length > 0 && counts.sentences < 2;
    const canSubmit = isAuthenticated && !isOutOfQuota && trimmed.length > 0 && !overLimit && !tooShort && !isSubmitting;
    const samples = samplesFor(learningLanguage);
    const fontClass = getFontClass(learningLanguage);

    const languageName = (code) => {
        const key = supportedAnalysisLanguages[code] || supportedLanguages[code];
        return key ? t(`languages.${key}`) : (code || '').toUpperCase();
    };

    const planName = tier === 2 ? 'Plus' : tier === 1 ? 'Basic' : t('reader.plan_free');

    useEffect(() => {
        if (!isAuthenticated) return;
        let cancelled = false;
        fetch('/api/user/history?types=extended&limit=3', { credentials: 'include' })
            .then((response) => response.json())
            .then((data) => {
                if (!cancelled && data.success) setRecent(data.items || []);
            })
            .catch(() => {});
        return () => { cancelled = true; };
    }, [isAuthenticated]);

    const handleSubmit = async (event) => {
        event.preventDefault();
        if (!isAuthenticated) {
            router.push('/login');
            return;
        }
        if (!canSubmit) return;

        setIsSubmitting(true);
        setError(null);
        try {
            const response = await fetch('/api/extended-text/submit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    text: trimmed,
                    title: title.trim() || null,
                    originalLanguage: learningLanguage,
                    translationLanguage: nativeLanguage
                })
            });
            const data = await response.json();
            if (!response.ok || (data.message && !data.message.isValid)) {
                setError(data.message?.error?.message || t('extended_text.analysis_failed'));
                setIsSubmitting(false);
                return;
            }
            track('paragraph_submit', { language: learningLanguage, sentences: data.sentenceCount });
            router.push(`/extended-text/${data.textId}?job=${data.jobId}`);
        } catch (err) {
            console.error('Error submitting text:', err);
            setError(t('extended_text.submission_error'));
            setIsSubmitting(false);
        }
    };

    const applySample = (sample) => {
        setText(sample.text);
        setTitle(sample.title);
        setError(null);
    };

    const seconds = estimateSeconds(counts.sentences);

    return (
        <Dashboard>
            <div className={styles.page}>
                <header className={styles.hero}>
                    <Mascot pose="teach" size={96} motion="bob" className={styles.heroMascot} />
                    <div className={styles.heroCopy}>
                        <span className={styles.kicker}>{t('reader.kicker')}</span>
                        <h1>{t('reader.paste_title')}</h1>
                        <p>{t('reader.paste_description')}</p>
                    </div>
                </header>

                <div className={styles.layout}>
                    <div className={styles.main}>
                        <form onSubmit={handleSubmit} className={styles.formCard}>
                            <div className={styles.formTop}>
                                <div className={styles.languages}>
                                    <LanguageSwitcher />
                                    <span className={styles.languageTo}>{t('reader.to')}</span>
                                    <span className={styles.nativeLanguage}>{languageName(nativeLanguage)}</span>
                                </div>
                                <label className={styles.titleField}>
                                    <span>{t('reader.title_label')}</span>
                                    <input
                                        type="text"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder={t('reader.title_placeholder')}
                                        maxLength={100}
                                        className={fontClass}
                                    />
                                </label>
                            </div>

                            <label className={styles.textField}>
                                <span className={styles.fieldLabel}>{t('reader.text_label')}</span>
                                <textarea
                                    value={text}
                                    onChange={(e) => {
                                        setText(e.target.value);
                                        if (error) setError(null);
                                    }}
                                    placeholder={t('reader.text_placeholder')}
                                    className={`${styles.textarea} ${fontClass}`}
                                    rows={12}
                                    lang={learningLanguage}
                                />
                            </label>

                            <div className={styles.meter} aria-hidden="true">
                                <span
                                    className={overLimit ? styles.meterOver : ''}
                                    style={{ width: `${Math.min((trimmed.length / maxCharacters) * 100, 100)}%` }}
                                />
                            </div>

                            <div className={styles.formBottom}>
                                <div className={styles.counts}>
                                    {counts.paragraphs > 0 && (
                                        <span className={styles.countPill}>{t('reader.paragraphs_count', { count: counts.paragraphs })}</span>
                                    )}
                                    {counts.sentences > 0 && (
                                        <span className={styles.countPill}>{t('reader.sentences_count', { count: counts.sentences })}</span>
                                    )}
                                    <span className={`${styles.countPill} ${styles.countPlain} ${overLimit ? styles.countOver : ''}`}>
                                        {trimmed.length.toLocaleString()} / {maxCharacters.toLocaleString()}
                                    </span>
                                    {counts.sentences >= 2 && !overLimit && (
                                        <span className={styles.estimate}>{t('reader.ready_in', { seconds })}</span>
                                    )}
                                </div>
                                <button type="submit" className={styles.submit} disabled={isAuthenticated && !canSubmit}>
                                    {!isAuthenticated
                                        ? t('extended_text.login_cta')
                                        : isSubmitting ? t('reader.starting') : t('reader.start_reading')}
                                </button>
                            </div>

                            {overLimit && (
                                <p className={styles.formNote} role="alert">
                                    {t('reader.over_limit', { limit: maxCharacters.toLocaleString() })}{' '}
                                    {tier < 2 && <Link href="/pricing">{t('reader.see_plans')}</Link>}
                                </p>
                            )}
                            {tooShort && <p className={styles.formNote}>{t('reader.too_short')}</p>}
                            {isOutOfQuota && (
                                <p className={styles.formNote} role="alert">
                                    {t('extended_text.limit_reached')} <Link href="/pricing">{t('reader.see_plans')}</Link>
                                </p>
                            )}
                            {error && <p className={styles.formError} role="alert">{error}</p>}
                        </form>

                        {samples.length > 0 && (
                            <div className={styles.samples}>
                                <span>{t('reader.try_sample')}</span>
                                {samples.map((sample) => (
                                    <button
                                        key={sample.level}
                                        type="button"
                                        className={`${styles.sample} ${styles[`sample_${sample.level}`]}`}
                                        onClick={() => applySample(sample)}
                                    >
                                        <span className={fontClass} lang={learningLanguage}>{sample.title}</span>
                                        <span>· {t(`reader.level_${sample.level}`)}</span>
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    <aside className={styles.side}>
                        <div className={styles.sideCard}>
                            <h2>{t('reader.what_you_get')}</h2>
                            <div className={styles.benefit}>
                                <span className={`${styles.benefitIcon} ${styles.tintRead}`}><BookIcon /></span>
                                <div><strong>{t('reader.benefit_read_title')}</strong><p>{t('reader.benefit_read')}</p></div>
                            </div>
                            <div className={styles.benefit}>
                                <span className={`${styles.benefitIcon} ${styles.tintUnd}`}><BulbIcon /></span>
                                <div><strong>{t('reader.benefit_grammar_title')}</strong><p>{t('reader.benefit_grammar')}</p></div>
                            </div>
                            <div className={styles.benefit}>
                                <span className={`${styles.benefitIcon} ${styles.tintKeep}`}><BookmarkIcon /></span>
                                <div><strong>{t('reader.benefit_keep_title')}</strong><p>{t('reader.benefit_keep')}</p></div>
                            </div>
                            <div className={styles.benefit}>
                                <span className={`${styles.benefitIcon} ${styles.tintRev}`}><CheckIcon /></span>
                                <div><strong>{t('reader.benefit_quiz_title')}</strong><p>{t('reader.benefit_quiz')}</p></div>
                            </div>
                        </div>
                        {isAuthenticated && !loading && (
                            <div className={styles.sideCard}>
                                <span className={styles.label}>{t('reader.your_plan', { plan: planName })}</span>
                                <div className={styles.planRow}>
                                    <span>{t('reader.text_length')}</span>
                                    <strong>{t('reader.characters_value', { count: maxCharacters.toLocaleString() })}</strong>
                                </div>
                                <div className={styles.planRow}>
                                    <span>{t('reader.passages_this_week')}</span>
                                    <strong>{isUnlimited ? t('extended_text.weekly_usage_unlimited') : `${Math.max(weeklyRemaining ?? 0, 0)} / ${weeklyTotal}`}</strong>
                                </div>
                                {tier < 2 && (
                                    <Link href="/pricing" className={styles.planLink}>{t('reader.upgrade_longer')}</Link>
                                )}
                            </div>
                        )}
                    </aside>
                </div>

                {recent.length > 0 && (
                    <section className={styles.recent}>
                        <div className={styles.recentHeader}>
                            <h2>{t('reader.recent_title')}</h2>
                            <Link href="/library?tab=history">{t('reader.all_passages')}</Link>
                        </div>
                        <div className={styles.recentGrid}>
                            {recent.map((item) => {
                                const progress = readProgress(item.textId);
                                const total = item.sentenceCount || 0;
                                const read = Math.min(progress, total);
                                const finished = total > 0 && read >= total;
                                return (
                                    <Link key={item.textId} href={`/extended-text/${item.textId}`} className={styles.recentCard}>
                                        <span className={`${styles.recentTitle} ${getFontClass(item.originalLanguage)}`} lang={item.originalLanguage}>
                                            {item.title || (item.text || '').slice(0, 40)}
                                        </span>
                                        <span className={styles.recentMeta}>
                                            {t('reader.sentences_count', { count: total })}
                                            {item.dateCreated ? ` · ${new Date(item.dateCreated).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}` : ''}
                                        </span>
                                        <span className={styles.recentBar}><span className={finished ? styles.recentDone : ''} style={{ width: `${total ? (read / total) * 100 : 0}%` }} /></span>
                                        <span className={finished ? styles.recentStatusDone : styles.recentStatus}>
                                            {finished ? t('reader.finished') : read > 0 ? t('reader.read_of', { read, total }) : t('reader.not_started')}
                                        </span>
                                    </Link>
                                );
                            })}
                        </div>
                    </section>
                )}
            </div>
        </Dashboard>
    );
}
