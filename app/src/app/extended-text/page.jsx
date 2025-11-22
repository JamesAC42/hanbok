'use client';
import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import Dashboard from '@/components/Dashboard';
import TextInput from '@/components/TextInput';
import Button from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import LanguageSwitcher from '@/components/LanguageSwitcher';
import styles from '@/styles/pages/extendedtext.module.scss';

export default function ExtendedTextPage() {
    const router = useRouter();
    const { user, isAuthenticated, loading } = useAuth();
    const {
        language: learningLanguage,
        nativeLanguage,
        supportedLanguages,
        supportedAnalysisLanguages,
        getIcon,
        t
    } = useLanguage();

    const [text, setText] = useState('');
    const [title, setTitle] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [showOnboarding, setShowOnboarding] = useState(false);
    const [onboardingSlide, setOnboardingSlide] = useState(0);
    const [demoVariant, setDemoVariant] = useState('desktop');

    const tierCharLimits = useMemo(() => ({
        0: 500,
        1: 2000,
        2: 5000
    }), []);

    const userTier = user?.tier ?? 0;
    const maxCharacters = tierCharLimits[userTier] ?? tierCharLimits[0];
    const charactersUsed = text.length;
    const characterProgress = Math.min((charactersUsed / maxCharacters) * 100, 100);
    const weeklyTotal = user?.weekExtendedTextTotal ?? null;
    const weeklyRemaining = user?.weekExtendedTextRemaining ?? null;
    const isUnlimited = weeklyTotal === null;
    const isOutOfQuota = !isUnlimited && weeklyRemaining !== null && weeklyRemaining <= 0;
    const canSubmit = isAuthenticated && !isOutOfQuota;
    const overCharLimit = charactersUsed > maxCharacters;
    const resolveLanguageName = (code) => {
        if (!code) return '';
        const key = supportedAnalysisLanguages[code] || supportedLanguages[code];
        return key ? t(`languages.${key}`) : code.toUpperCase();
    };

    const analysisLanguageName = resolveLanguageName(learningLanguage);
    const translationLanguageName = resolveLanguageName(nativeLanguage);

    const onboardingSlides = useMemo(() => ([
        {
            title: 'Decode longer passages with ease',
            description: 'Upload multi-sentence excerpts to see grammar, vocabulary, tone, and structure all in one place.',
            bullets: ['Instant sentence-by-sentence breakdowns', 'Automatic translations and summaries', 'Great for essays, textbook passages, and lyrics']
        },
        {
            title: 'Plan-friendly weekly allowances',
            description: 'Every plan unlocks different extended-analysis perks so you can level up at your own pace.',
            bullets: ['Free: 2 extended analyses per week, 500-character excerpts', 'Basic: Unlimited analyses, 2,000-character excerpts', 'Plus: Unlimited analyses, 5,000-character excerpts']
        },
        {
            title: 'Upgrade to go unlimited',
            description: 'Basic and Plus members enjoy unlimited extended texts, priority features, and more study power.',
            bullets: ['Unlock longer passages', 'Never worry about weekly limits', 'Support Hanbok’s continuing development'],
            cta: 'View plans'
        }
    ]), []);

    useEffect(() => {
        if (loading) return;

        if (!isAuthenticated) {
            setOnboardingSlide(0);
            setShowOnboarding(true);
            return;
        }

        try {
            const hasSeen = window.localStorage.getItem('extendedTextOnboardingSeen');
            if (!hasSeen) {
                setOnboardingSlide(0);
                setShowOnboarding(true);
            }
        } catch (err) {
            console.warn('Unable to read onboarding state:', err);
        }
    }, [isAuthenticated, loading]);

    useEffect(() => {
        const updateVariant = () => {
            if (typeof window === 'undefined') return;
            const { innerWidth, innerHeight } = window;
            if (!innerWidth || !innerHeight) return;
            const aspectRatio = innerWidth / innerHeight;
            setDemoVariant(aspectRatio < 1 ? 'mobile' : 'desktop');
        };

        updateVariant();
        window.addEventListener('resize', updateVariant);
        return () => window.removeEventListener('resize', updateVariant);
    }, []);

    const closeOnboarding = () => {
        try {
            window.localStorage.setItem('extendedTextOnboardingSeen', '1');
        } catch (err) {
            console.warn('Unable to persist onboarding state:', err);
        }
        setShowOnboarding(false);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!isAuthenticated) {
            setError(t('extended_text.login_required'));
            return;
        }

        if (!text.trim()) {
            setError(t('extended_text.text_required'));
            return;
        }

        if (overCharLimit) {
            setError(t('extended_text.char_limit_error', { limit: maxCharacters }));
            return;
        }

        if (isOutOfQuota) {
            setError(t('extended_text.limit_reached'));
            return;
        }

        setIsLoading(true);
        setError(null);

        try {
            const response = await fetch('/api/extended-text/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: 'include',
                body: JSON.stringify({
                    text: text.trim(),
                    title: title.trim() || null,
                    originalLanguage: learningLanguage,
                    translationLanguage: nativeLanguage,
                }),
            });

            const data = await response.json();

            if (!response.ok || (data.message && !data.message.isValid)) {
                setError(data.message?.error?.message || t('extended_text.analysis_failed'));
                setIsLoading(false);
                return;
            }

            const params = new URLSearchParams();
            if (title.trim()) {
                params.set('title', title.trim());
            }
            if (data.sentenceCount) {
                params.set('count', data.sentenceCount);
            }
            if (data.textId) {
                params.set('textId', data.textId);
            }

            const queryString = params.toString();
            router.push(`/extended-text/progress/${data.jobId}${queryString ? `?${queryString}` : ''}`);
        } catch (err) {
            console.error('Error submitting text:', err);
            setError(t('extended_text.submission_error'));
            setIsLoading(false);
        }
    };

    return (
        <Dashboard>
            <div className={styles.page}>
                <section className={styles.hero}>
                    <div className={styles.heroCopy}>
                        <div className={styles.newBadge}>New!</div>
                        <h1>{t('extended_text.title')}</h1>
                        <p className={styles.description}>
                            {t('extended_text.description')}
                        </p>
                        <div className={styles.heroHighlights}>
                            <span>{t('extended_text.info_1')}</span>
                            <span>{t('extended_text.info_2')}</span>
                            <span>{t('extended_text.info_3')}</span>
                        </div>
                    </div>
                    <figure className={styles.heroArt}>
                        <img
                            src="/images/magnifying glass crop.png"
                            alt="Magnifying glass"
                            style={{ width: '100%', height: 'auto', borderRadius: '0.8rem' }}
                        />
                    </figure>
                </section>

                <div className={styles.languageControls}>
                    <div className={styles.languageCard}>
                        <span className={styles.languageLabel}>{t('extended_text.language_selector_label')}</span>
                        <div className={styles.languageSwitcherWrap}>
                            <LanguageSwitcher />
                        </div>
                    </div>
                    <div className={styles.languageCard}>
                        <span className={styles.languageLabel}>
                            {t('extended_text.translation_language_label', { language: translationLanguageName })}
                        </span>
                        <div className={styles.translationValue}>
                            <span className={styles.translationIcon}>{getIcon(nativeLanguage)}</span>
                            <span>{translationLanguageName}</span>
                        </div>
                    </div>
                </div>

                <div className={styles.statsBar}>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>{t('extended_text.char_limit_label')}</span>
                        <span className={styles.statValue}>{maxCharacters.toLocaleString()} {t('extended_text.characters')}</span>
                    </div>
                    <div className={styles.statItem}>
                        <span className={styles.statLabel}>{t('extended_text.weekly_usage_label')}</span>
                        <span className={styles.statValue}>
                            {!isAuthenticated
                                ? t('extended_text.weekly_usage_login')
                                : isUnlimited
                                    ? t('extended_text.weekly_usage_unlimited')
                                    : `${Math.max(weeklyRemaining ?? 0, 0)} / ${weeklyTotal}`}
                        </span>
                    </div>
                </div>

                {!isAuthenticated && !loading && (
                    <div className={styles.notice}>
                        <p>{t('extended_text.login_gate_message')}</p>
                    </div>
                )}

                {isOutOfQuota && (
                    <div className={styles.noticeWarning}>
                        <p>{t('extended_text.limit_reached')}</p>
                    </div>
                )}

                {error && (
                    <div className={styles.error}>
                        {error}
                    </div>
                )}

                <div className={styles.layout}>
                    <form onSubmit={handleSubmit} className={styles.formCard}>
                        <div className={styles.inputGroup}>
                            <label htmlFor="title">
                                {t('extended_text.title_label')}{' '}
                                <span className={styles.optional}>({t('extended_text.optional')})</span>
                            </label>
                            <TextInput
                                id="title"
                                value={title}
                                onChange={(e) => {
                                    setTitle(e.target.value);
                                    if (error) setError(null);
                                }}
                                placeholder={t('extended_text.title_placeholder')}
                                maxLength={100}
                                style={{ minWidth: 0, width: '100%' }}
                            />
                        </div>

                        <div className={styles.inputGroup}>
                            <label htmlFor="text">
                                {t('extended_text.text_label')}
                            </label>
                            <textarea
                                id="text"
                                value={text}
                                onChange={(e) => {
                                    setText(e.target.value);
                                    if (error) setError(null);
                                }}
                                placeholder={t('extended_text.text_placeholder')}
                                className={styles.textarea}
                                rows={15}
                                maxLength={maxCharacters}
                                required
                            />
                            <div className={styles.charInfo}>
                                <span className={styles.charCount}>
                                    {charactersUsed} / {maxCharacters}
                                </span>
                                <div
                                    className={styles.charMeter}
                                    role="progressbar"
                                    aria-valuenow={charactersUsed}
                                    aria-valuemin={0}
                                    aria-valuemax={maxCharacters}
                                >
                                    <span style={{ width: `${characterProgress}%` }} />
                                </div>
                                {overCharLimit && (
                                    <span className={styles.charWarning}>
                                        {t('extended_text.char_limit_error', { limit: maxCharacters })}
                                    </span>
                                )}
                            </div>
                        </div>

                        <div className={styles.actions}>
                            <Button
                                type="submit"
                                disabled={isLoading || !text.trim() || overCharLimit || !canSubmit}
                                loading={isLoading}
                            >
                                {isAuthenticated
                                    ? (isLoading ? t('extended_text.analyzing') : t('extended_text.analyze_button'))
                                    : t('extended_text.login_cta')}
                            </Button>
                        </div>
                    </form>

                    <aside className={styles.sidebar}>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setOnboardingSlide(0);
                                setShowOnboarding(true);
                            }}
                            className={styles.walkthroughButton}
                        >
                            {t('extended_text.open_walkthrough') || 'View Tutorial'}
                        </Button>
                        <figure className={styles.sidebarArt}>
                            <Image
                                src="/images/extended-text-celebration.svg"
                                alt="Celebratory illustration of a completed extended text analysis"
                                width={360}
                                height={280}
                            />
                        </figure>
                    </aside>
                </div>

                {showOnboarding && (
                    <div className={styles.onboardingOverlay}>
                        <div className={styles.onboardingModal} role="dialog" aria-modal="true">
                            <button className={styles.onboardingClose} type="button" onClick={closeOnboarding} aria-label={t('extended_text.close_tutorial')}>
                                ✕
                            </button>
                            <div className={styles.onboardingContent}>
                                {onboardingSlide === 0 && (
                                    <div className={styles.onboardingMedia}>
                                        <video
                                            key={demoVariant}
                                            className={styles.onboardingVideo}
                                            src={
                                                demoVariant === 'mobile'
                                                    ? 'https://fukuin-hanbok.s3.us-east-2.amazonaws.com/site-assets/mobile+extended+text+recording.mp4'
                                                    : 'https://fukuin-hanbok.s3.us-east-2.amazonaws.com/site-assets/desktop+extended+text.mp4'
                                            }
                                            controls
                                            playsInline
                                            loop
                                            muted
                                            autoPlay
                                        >
                                            Your browser does not support the video tag.
                                        </video>
                                    </div>
                                )}
                                <h2>{onboardingSlides[onboardingSlide].title}</h2>
                                <p>{onboardingSlides[onboardingSlide].description}</p>
                                <ul>
                                    {onboardingSlides[onboardingSlide].bullets.map((bullet, index) => (
                                        <li key={index}>{bullet}</li>
                                    ))}
                                </ul>
                            </div>
                            <div className={styles.onboardingControls}>
                                <div className={styles.dots}>
                                    {onboardingSlides.map((_, index) => (
                                        <button
                                            key={index}
                                            type="button"
                                            className={`${styles.dot} ${index === onboardingSlide ? styles.activeDot : ''}`}
                                            onClick={() => setOnboardingSlide(index)}
                                            aria-label={`Go to slide ${index + 1}`}
                                        />
                                    ))}
                                </div>
                                <div className={styles.buttons}>
                                    <Button
                                        type="button"
                                        onClick={() => {
                                            if (onboardingSlide === onboardingSlides.length - 1) {
                                                closeOnboarding();
                                            } else {
                                                setOnboardingSlide((prev) => Math.min(prev + 1, onboardingSlides.length - 1));
                                            }
                                        }}
                                    >
                                        {onboardingSlide === onboardingSlides.length - 1
                                            ? t('extended_text.onboarding_finish')
                                            : t('extended_text.onboarding_next')}
                                    </Button>
                                    {!isAuthenticated && (
                                    <Button
                                        type="button"
                                        variant="secondary"
                                        onClick={() => router.push('/login')}
                                    >
                                        {t('extended_text.login_cta')}
                                    </Button>
                                    )}
                                    {onboardingSlides[onboardingSlide].cta && (
                                        <Button
                                            type="button"
                                            variant="secondary"
                                            onClick={() => router.push('/pricing')}
                                        >
                                            {onboardingSlides[onboardingSlide].cta}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </Dashboard>
    );
}
