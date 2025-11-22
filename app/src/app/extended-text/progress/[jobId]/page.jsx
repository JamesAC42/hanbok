'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Dashboard from '@/components/Dashboard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/styles/pages/extendedtextprogress.module.scss';

export const languageFunFacts = [
    "There are over 7,000 languages spoken in the world today.",
    "Papua New Guinea has the most languages of any country, with over 840.",
    "Mandarin Chinese has the most native speakers, while English has the most total speakers.",
    "Japanese uses three different writing systems: Hiragana, Katakana, and Kanji.",
    "The Korean alphabet, Hangul, was created by King Sejong the Great in 1443.",
    "Basque is a language isolate, meaning it has no known relationship to any other language.",
    "More than half of the world's population is bilingual or multilingual.",
    "The United Nations has six official languages: Arabic, Chinese, English, French, Russian, and Spanish.",
    "There is a language in Mexico called Ayapaneco that was once spoken by only two people who refused to talk to each other.",
    "The constructed language Esperanto was created to foster peace and international understanding.",
    "Khmer (Cambodian) has the largest alphabet in the world with 74 letters.",
    "Rotokas, spoken in Papua New Guinea, has the smallest alphabet with only 12 letters.",
    "Language learning increases the size of your brain and improves memory.",
    "Newborn babies can distinguish their mother's language from foreign languages within hours of birth.",
    "Onomatopoeia are words that imitate the sounds they describe, like 'buzz' or 'meow'.",
    "The 'pinned' tweet icon comes from the Japanese word for 'pin', which sounds like the English word.",
    "In Japanese, the word for 'crisis' (kiki) is composed of the characters for 'danger' and 'opportunity'.",
    "French was the official language of England for over 300 years.",
    "The longest word in English has 189,819 letters and takes over 3 hours to pronounce (it's the chemical name for titin).",
    "There are languages that are spoken entirely in whistles, such as Silbo Gomero in the Canary Islands.",
    "Sign languages are not universal; American Sign Language (ASL) is different from British Sign Language (BSL).",
    "The Bible is the most translated book in the world, available in over 3,000 languages.",
    "Learning a second language can delay the onset of dementia and Alzheimer's disease.",
    "Some languages, like Guugu Yimithirr in Australia, use cardinal directions (North, South, East, West) instead of 'left' and 'right'.",
    "The concept of 'orange' as a color didn't exist in English until the fruit arrived in Europe."
];


const STATUS_MESSAGES = {
    processing: 'extended_text.progress_status.processing',
    analyzing_sentence: 'extended_text.progress_status.analyzing_sentence',
    overall_analysis: 'extended_text.progress_status.overall_analysis',
    saving_results: 'extended_text.progress_status.saving_results'
};

export default function ExtendedTextProgressPage() {
    const { jobId } = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { t } = useLanguage();
    const { updateExtendedTextQuota } = useAuth();

    const [status, setStatus] = useState('queued');
    const [percentage, setPercentage] = useState(0);
    const [processedSentences, setProcessedSentences] = useState(0);
    const [totalSentences, setTotalSentences] = useState(null);
    const [messageKey, setMessageKey] = useState(null);
    const [messageVariables, setMessageVariables] = useState({});
    const [messageText, setMessageText] = useState('');
    const [error, setError] = useState(null);
    const [completed, setCompleted] = useState(false);
    const [weeklyQuota, setWeeklyQuota] = useState(null);
    const [funFactIndex, setFunFactIndex] = useState(0);

    const redirectTimeoutRef = useRef(null);

    const title = searchParams.get('title');
    const countHint = searchParams.get('count');

    useEffect(() => {
        // Randomize start index
        setFunFactIndex(Math.floor(Math.random() * languageFunFacts.length));

        const interval = setInterval(() => {
            setFunFactIndex((prev) => (prev + 1) % languageFunFacts.length);
        }, 7000);

        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (countHint && !Number.isNaN(Number(countHint))) {
            setTotalSentences(Number(countHint));
        }
    }, [countHint]);

    useEffect(() => {
        const source = new EventSource(`/api/extended-text/progress/${jobId}`);

        const parseData = (event) => {
            try {
                return JSON.parse(event.data);
            } catch (err) {
                console.error('Failed to parse SSE payload:', err);
                return null;
            }
        };

        source.addEventListener('init', (event) => {
            const data = parseData(event);
            if (!data) return;
            setStatus(data.status || 'processing');
            if (typeof data.processedSentences === 'number') {
                setProcessedSentences(data.processedSentences);
            }
            if (typeof data.totalSentences === 'number') {
                setTotalSentences(data.totalSentences);
            }
            if (data.totalSentences) {
                const pct = data.totalSentences === 0 ? 0 : Math.round((data.processedSentences / data.totalSentences) * 100);
                setPercentage(Number.isNaN(pct) ? 0 : pct);
            }
        });

        source.addEventListener('status', (event) => {
            const data = parseData(event);
            if (!data) return;
            if (data.status) {
                setStatus(data.status);
            }
            if (data.status === 'analyzing_sentence' && data.index && data.total) {
                setMessageKey(STATUS_MESSAGES[data.status]);
                setMessageVariables({
                    current: data.index,
                    total: data.total
                });
                setMessageText('');
            } else if (STATUS_MESSAGES[data.status]) {
                setMessageKey(STATUS_MESSAGES[data.status]);
                setMessageVariables({});
                setMessageText('');
            }
        });

        source.addEventListener('progress', (event) => {
            const data = parseData(event);
            if (!data) return;

            if (typeof data.totalSentences === 'number') {
                setTotalSentences(data.totalSentences);
            }
            if (typeof data.processedSentences === 'number') {
                setProcessedSentences(data.processedSentences);
            }
            if (typeof data.percentage === 'number') {
                setPercentage(Math.min(100, Math.max(0, data.percentage)));
            }
            if (data.message) {
                setMessageKey(null);
                setMessageVariables({});
                setMessageText(data.message);
            } else {
                setMessageText('');
            }
        });

        source.addEventListener('completed', (event) => {
            const data = parseData(event);
            if (!data) return;
            setCompleted(true);
            if (data.weeklyQuota) {
                const normalizedQuota = {
                    weekAnalysesUsed: data.weeklyQuota.weekAnalysesUsed ?? data.weeklyQuota.weekSentencesUsed ?? 0,
                    weekAnalysesTotal: data.weeklyQuota.weekAnalysesTotal ?? data.weeklyQuota.weekSentencesTotal ?? 0,
                    weekAnalysesRemaining: data.weeklyQuota.weekAnalysesRemaining ?? data.weeklyQuota.weekSentencesRemaining ?? 0
                };
                setWeeklyQuota(normalizedQuota);
                updateExtendedTextQuota(
                    normalizedQuota.weekAnalysesUsed,
                    normalizedQuota.weekAnalysesTotal,
                    normalizedQuota.weekAnalysesRemaining
                );
            } else {
                setWeeklyQuota(null);
            }
            setStatus('completed');
            setPercentage(100);
            setProcessedSentences(data.sentenceCount || totalSentences || 0);
            if (typeof data.sentenceCount === 'number') {
                setTotalSentences(data.sentenceCount);
            }
            setMessageKey(null);
            setMessageVariables({});
            setMessageText('');
            console.log("Completed event received:", data);
            if (redirectTimeoutRef.current) {
                console.log("Clearing redirect timeout");
                clearTimeout(redirectTimeoutRef.current);
            }

            redirectTimeoutRef.current = setTimeout(() => {
                console.log("Redirecting to text ID:", data.textId);
                router.push(`/extended-text/${data.textId}`);
            }, 2000);
            console.log("Closing source");
            source.close();
        });

        source.addEventListener('jobError', (event) => {
            console.log("Job error event received:", data);
            const data = parseData(event);
            setError(data?.message || t('extended_text.progress_error'));
            setStatus('failed');
            setPercentage(0);
            source.close();
        });

        source.onerror = () => {
            setError(t('extended_text.progress_connection_lost'));
            source.close();
        };

        return () => {
            source.close();
            if (redirectTimeoutRef.current) {
                clearTimeout(redirectTimeoutRef.current);
            }
        };
    }, [jobId, router, t, updateExtendedTextQuota]);

    const statusMessage = useMemo(() => {
        if (error) {
            return error;
        }
        if (completed) {
            return t('extended_text.progress_completed');
        }
        if (messageText) {
            return messageText;
        }
        if (messageKey) {
            return t(messageKey, messageVariables);
        }
        switch (status) {
            case 'processing':
                return t('extended_text.progress_status.processing');
            case 'overall_analysis':
                return t('extended_text.progress_status.overall_analysis');
            case 'saving_results':
                return t('extended_text.progress_status.saving_results');
            default:
                return t('extended_text.progress_status.processing');
        }
    }, [completed, error, messageKey, messageVariables, messageText, status, t]);

    const subtitle = useMemo(() => {
        if (!totalSentences) {
            return t('extended_text.progress_subtitle_generic');
        }
        return t('extended_text.progress_subtitle', { count: totalSentences });
    }, [t, totalSentences]);

    const showQuota = completed && weeklyQuota;

    return (
        <Dashboard>
            <div className={styles.wrapper}>
                <div className={styles.content}>
                    <h1 className={styles.heading}>{title || t('extended_text.progress_title')}</h1>
                    <p className={styles.subtitle}>{subtitle}</p>

                    <div className={styles.progressPanel}>
                        <div className={styles.progressVisualizer}>
                            <div className={styles.spinnerRing} />
                            <div className={styles.pulseOverlay} />
                            <div className={styles.progressCircle}>
                                <svg viewBox="0 0 120 120">
                                    <circle className={styles.bg} cx="60" cy="60" r="54" />
                                    <circle
                                        className={styles.fg}
                                        cx="60"
                                        cy="60"
                                        r="54"
                                        style={{ strokeDashoffset: 339.292 - (339.292 * percentage) / 100 }}
                                    />
                                </svg>
                                <span className={styles.progressValue}>{percentage}%</span>
                            </div>
                        </div>

                        <div className={styles.details}>
                            <p className={styles.status}>{statusMessage}</p>
                            <div className={styles.bar}>
                                <div className={styles.barFill} style={{ width: `${percentage}%` }} />
                            </div>
                            {totalSentences !== null && (
                                <p className={styles.count}>
                                    {t('extended_text.progress_count', {
                                        processed: processedSentences,
                                        total: totalSentences ?? 0
                                    })}
                                </p>
                            )}
                            {completed && (
                                <p className={styles.redirect}>{t('extended_text.progress_redirect')}</p>
                            )}
                            {showQuota && (
                                <p className={styles.quota}>
                                    {t('extended_text.progress_quota', {
                                        remaining: weeklyQuota.weekAnalysesRemaining,
                                        total: weeklyQuota.weekAnalysesTotal
                                    })}
                                </p>
                            )}
                        </div>
                    </div>
                    {!completed && !error && (
                        <div className={styles.waitMessage}>
                            <p>
                                {t('extended_text.progress_wait_message', 'Please wait, this may take a moment. We are analyzing every sentence individually to provide a context-aware, comprehensive breakdown.')}
                            </p>
                        </div>
                    )}

                    {!completed && !error && (
                        <div className={styles.funFactContainer}>
                            <span className={styles.funFactLabel}>{t('extended_text.did_you_know', 'Did you know:')}</span>
                            <p key={funFactIndex} className={styles.funFactText}>
                                {languageFunFacts[funFactIndex]}
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </Dashboard>
    );
}
