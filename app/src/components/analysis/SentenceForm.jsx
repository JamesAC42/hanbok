'use client';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';

import TextInput from '@/components/TextInput';
import Button from '@/components/Button';

import styles from '@/styles/components/sentenceanalyzer/sentenceform.module.scss';
import { SvgSpinnersRingResize } from '@/components/icons/RingSpin';

const SentenceForm = ({
    analysis,
    setAnalysis,
    setVoice1,
    setVoice2,
    setTransition
}) => {
    const { t, language, nativeLanguage, supportedLanguages } = useLanguage();
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const router = useRouter();
    const { isAuthenticated } = useAuth();

    const loadingMessages = [
        t('sentenceForm.loading.structure'),
        t('sentenceForm.loading.grammar'),
        t('sentenceForm.loading.pronunciation'),
        t('sentenceForm.loading.kimchi'),
        t('sentenceForm.loading.elements'),
        t('sentenceForm.loading.breakdown')
    ];

    const getLocalizedPlaceholder = () => {
        const languageKey = supportedLanguages[language];
        const languageName = t(`languages.${languageKey}`);
        return t('sentenceForm.placeholder').replace('{language}', languageName);
    };

    useEffect(() => {
        let intervalId;
        if (loading) {
            intervalId = setInterval(() => {
                setLoadingMessageIndex((prev) => 
                    (prev + 1) % loadingMessages.length
                );
            }, 3000);
        }
        return () => {
            if (intervalId) clearInterval(intervalId);
        };
    }, [loading]);

    useEffect(() => {
        // Expose setText function globally so it can be accessed by SentenceAnalyzer
        window.setInputText = setText;
        
        // Cleanup
        return () => {
            delete window.setInputText;
        };
    }, []);

    const handleSubmit = async (e) => {

        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!text) {
        setError({
            type: 'empty'
        });
        setLoading(false);
        return;
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 100000);

            const response = await fetch('/api/submit', {
                method: 'POST',
                headers: {
                'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    originalLanguage: language,
                    translationLanguage: nativeLanguage
                 }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const data = await response.json();
            
            if (!data.message.isValid) {
                setError(data.message.error);
            } else {
                setTransition(true);
                setTimeout(() => {
                    setAnalysis(data.message.analysis);
                    if (data.voice1) {
                        setVoice1(data.voice1);
                    }
                    if (data.voice2) {
                        setVoice2(data.voice2);
                    }
                }, 200);
                setTimeout(() => {
                    setTransition(false);
                }, 400);
                if (data.sentenceId) {
                    if (isAuthenticated) {
                        router.push(`/sentence/${data.sentenceId}`);
                    }
                }
            }
        } catch (error) {
            console.error('Error:', error);
            if (error.name === 'AbortError') {
                setError({
                    type: 'timeout'
                });
            } else {
                setError({
                    type: 'other'
                });
            }
        } finally {
            setLoading(false);
        }
    };
    


    const getErrorMessage = (error) => {
        const messages = {
            not_korean: t('sentenceForm.errors.not_korean'),
            invalid_grammar: t('sentenceForm.errors.invalid_grammar'),
            nonsensical: t('sentenceForm.errors.nonsensical'),
            timeout: t('sentenceForm.errors.timeout'),
            other: t('sentenceForm.errors.other'),
            empty: t('sentenceForm.errors.empty')
        };
        return error.message || messages[error.type] || messages.other;
    };


    return (
        <>
        <div className={`${styles.formContainer} ${analysis ? styles.formContainerWithAnalysis : ''}`}>
            <form onSubmit={handleSubmit} className={styles.form}>
                <TextInput
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                    placeholder={getLocalizedPlaceholder()}
                    variant="large"
                />
                <Button 
                    type="submit" 
                    disabled={loading}
                    variant="primary"
                >
                {loading ? t('sentenceForm.analyzing') : t('sentenceForm.analyze')}
                </Button>
            </form>
        </div>
        {
            (!error && loading) && (
                <div className={styles.loading}>
                    <SvgSpinnersRingResize />
                    <div className={`${styles.loadingText} ${styles.fadeTransition}`}>
                        {loadingMessages[loadingMessageIndex]}
                    </div>
                </div>
            )
        }
        {
            error && (
                <div className={styles.error}>
                    {getErrorMessage(error)}
                </div>
            )
        }
      </>
    )
}

export default SentenceForm;