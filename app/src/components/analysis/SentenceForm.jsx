'use client';
import { useState } from 'react';

import TextInput from '@/components/TextInput';
import Button from '@/components/Button';

import styles from '@/styles/components/sentenceanalyzer/sentenceform.module.scss';

const SentenceForm = ({
    analysis,
    setAnalysis,
    setVoice1,
    setVoice2
}) => {

    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleSubmit = async (e) => {

        e.preventDefault();
        setLoading(true);
        setError(null);

        if (!text) {
        setError({
            type: 'empty',
            message: 'Please enter a sentence.'
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
                body: JSON.stringify({ text }),
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
                setAnalysis(data.message.analysis);
                if (data.voice1) {
                    setVoice1(data.voice1);
                }
                if (data.voice2) {
                    setVoice2(data.voice2);
                }
            }
        } catch (error) {
            console.error('Error:', error);
            if (error.name === 'AbortError') {
                setError({
                    type: 'timeout',
                    message: 'The request took too long. Please try again.'
                });
            } else {
                setError({
                    type: 'other',
                    message: 'Failed to analyze the sentence. Please try again.'
                });
            }
        } finally {
            setLoading(false);
        }
    };
    


    const getErrorMessage = (error) => {
        const messages = {
            not_korean: "Please enter a sentence using Korean characters (Hangul).",
            invalid_grammar: "This sentence appears to have grammatical errors.",
            nonsensical: "This input doesn't form a meaningful Korean sentence.",
            timeout: "The request took too long. Please try again.",
            other: "There was an error analyzing your input."
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
                    placeholder="Enter a Korean sentence..."
                    variant="large"
                />
                <Button 
                    type="submit" 
                    disabled={loading}
                    variant="primary"
                >
                {loading ? 'Analyzing...' : 'Analyze'}
                </Button>
            </form>
        </div>
        {
            (!error && loading) && (
                <div className={styles.loading}>
                    <div className={styles.loadingText}>
                        Analyzing...
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