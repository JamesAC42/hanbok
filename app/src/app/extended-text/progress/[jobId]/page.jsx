'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import Dashboard from '@/components/Dashboard';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/contexts/AuthContext';
import styles from '@/styles/pages/extendedtextprogress.module.scss';

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

    const redirectTimeoutRef = useRef(null);

    const title = searchParams.get('title');
    const countHint = searchParams.get('count');

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
            if (redirectTimeoutRef.current) {
                clearTimeout(redirectTimeoutRef.current);
            }
            redirectTimeoutRef.current = setTimeout(() => {
                router.push(`/extended-text/${data.textId}`);
            }, 2000);
            source.close();
        });

        source.addEventListener('jobError', (event) => {
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
                        <p className={styles.tip}>{t('extended_text.progress_tip')}</p>
                    )}
                </div>
            </div>
        </Dashboard>
    );
}
