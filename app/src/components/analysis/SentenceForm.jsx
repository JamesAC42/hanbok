'use client';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { usePopup } from '@/contexts/PopupContext';

import TextInput from '@/components/TextInput';
import Button from '@/components/Button';

import styles from '@/styles/components/sentenceanalyzer/sentenceform.module.scss';
import { SvgSpinnersRingResize } from '@/components/icons/RingSpin';
import { MaterialSymbolsCancel } from '@/components/icons/Close';
import { Upload } from '@/components/icons/Upload';

const MAX_IMAGE_SIZE = 2 * 1024 * 1024; // 2MB

// Add audio reference for the paste sound effect
const pasteSound = typeof Audio !== 'undefined' ? new Audio('/sound_effects/paste_click.mp3') : null;
const startSound = typeof Audio !== 'undefined' ? new Audio('/sound_effects/start_analysis.mp3') : null;
const finishedSound = typeof Audio !== 'undefined' ? new Audio('/sound_effects/finished_one.mp3') : null;

const SentenceForm = ({
    analysis,
    setAnalysis,
    setVoice1,
    setVoice2,
    setTransition
}) => {
    const { t, language, nativeLanguage, supportedLanguages } = useLanguage();
    const { isAuthenticated, user, decrementRemainingImageExtracts } = useAuth();
    const { showLimitReachedPopup, showLoginRequiredPopup } = usePopup();
    const [text, setText] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [loadingMessageIndex, setLoadingMessageIndex] = useState(0);
    const [imagePreview, setImagePreview] = useState(null);
    const [isProcessingImage, setIsProcessingImage] = useState(false);
    const fileInputRef = useRef(null);
    const router = useRouter();

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

    // Function to play the paste sound
    const playPasteSound = () => {
        if (pasteSound) {
            pasteSound.currentTime = 0;
            pasteSound.volume = 0.3;
            pasteSound.play().catch(err => console.error('Error playing sound:', err));
        }
    };
    const playStartSound = () => {
        if (startSound) {
            startSound.currentTime = 0;
            startSound.volume = 0.02;
            startSound.play().catch(err => console.error('Error playing sound:', err));
        }
    };
    const playFinishedSound = () => {
        if (finishedSound) {
            finishedSound.currentTime = 0;
            finishedSound.volume = 0.7;
            finishedSound.play().catch(err => console.error('Error playing sound:', err));
        }
    };

    useEffect(() => {
        const handleGlobalPaste = (e) => {
            if (!e.clipboardData?.items) return;
            
            const items = e.clipboardData.items;
            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    e.preventDefault();
                    const blob = items[i].getAsFile();
                    
                    // Check file size
                    if (blob.size > MAX_IMAGE_SIZE) {
                        setError({
                            type: 'file_too_large',
                            message: t('sentenceForm.errors.file_too_large')
                        });
                        return;
                    }
                    
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        setImagePreview(reader.result);
                        setText('');
                        // Play sound when image is pasted
                        playPasteSound();
                    };
                    reader.readAsDataURL(blob);
                    return;
                }
            }
        };

        document.addEventListener('paste', handleGlobalPaste);
        
        return () => {
            document.removeEventListener('paste', handleGlobalPaste);
        };
    }, []);

    const handleFileUpload = (event) => {
        const file = event.target.files[0];
        if (!file) return;
        
        if (!file.type.startsWith('image/')) {
            setError({
                type: 'invalid_file',
                message: t('sentenceForm.errors.invalid_file')
            });
            return;
        }
        
        // Check file size
        if (file.size > MAX_IMAGE_SIZE) {
            setError({
                type: 'file_too_large',
                message: t('sentenceForm.errors.file_too_large')
            });
            return;
        }
        
        const reader = new FileReader();
        reader.onloadend = () => {
            setImagePreview(reader.result);
            setText('');
            // Play sound when image is uploaded
            playPasteSound();
        };
        reader.readAsDataURL(file);
    };

    const handlePaste = (e) => {
        const items = e.clipboardData?.items;
        if (!items) return;

        for (let i = 0; i < items.length; i++) {
            if (items[i].type.indexOf('image') !== -1) {
                e.preventDefault();
                const blob = items[i].getAsFile();
                
                // Check file size
                if (blob.size > MAX_IMAGE_SIZE) {
                    setError({
                        type: 'file_too_large',
                        message: t('sentenceForm.errors.file_too_large')
                    });
                    return;
                }
                
                const reader = new FileReader();
                reader.onloadend = () => {
                    setImagePreview(reader.result);
                    setText('');
                    // Play sound when image is pasted
                    playPasteSound();
                };
                reader.readAsDataURL(blob);
                return;
            }
        }
    };

    const clearImage = () => {
        setImagePreview(null);
    };

    const triggerFileInput = () => {
        fileInputRef.current?.click();
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // If we have no text and no image, show error
        if (!text && !imagePreview) {
            setError({
                type: 'empty'
            });
            setLoading(false);
            return;
        }

        // Check if user has reached image extraction limit
        if (imagePreview && user && user.tier === 0 && user.remainingImageExtracts <= 0) {
            setLoading(false);
            showLimitReachedPopup('image-extracts');
            return;
        }

        if (imagePreview && !isAuthenticated) {
            setLoading(false);
            showLoginRequiredPopup('image-extracts');
            return;
        }

        // If submitting an image, set isProcessingImage to true
        if (imagePreview) {
            setIsProcessingImage(true);
        }

        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 100000);

            // Send either the text or the image data
            const dataToSend = imagePreview ? imagePreview : text;

            playStartSound();
            const response = await fetch('/api/submit', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text: dataToSend,
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
                // Decrement remaining image extracts if this was an image submission
                // and user is on the free tier
                if (imagePreview && user && user.tier === 0) {
                    decrementRemainingImageExtracts();
                }
                
                // Clear the image preview after successful submission
                if (imagePreview) {
                    setImagePreview(null);
                }
                
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
                playFinishedSound();
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
            // Make sure to set isProcessingImage back to false when done
            if (imagePreview) {
                setIsProcessingImage(false);
            }
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
            empty: t('sentenceForm.errors.empty'),
            invalid_file: t('sentenceForm.errors.invalid_file') || 'Please upload a valid image file.',
            file_too_large: t('sentenceForm.errors.file_too_large') || 'Image file is too large. Maximum size is 2MB.',
            image_processing: t('sentenceForm.errors.image_processing') || 'Error processing image. Please try again.'
        };
        return error.message || messages[error.type] || messages.other;
    };

    return (
        <>
            {imagePreview && (
                <div className={styles.imagePreviewContainer}>
                    <img src={imagePreview} alt="Uploaded" className={styles.imagePreview} />
                    <button 
                        className={styles.clearImageButton}
                        onClick={clearImage}
                        aria-label="Clear image"
                    >
                        <MaterialSymbolsCancel />
                    </button>
                    {isProcessingImage && (
                        <div className={styles.processingOverlay}>
                            <SvgSpinnersRingResize />
                            <p>{t('sentenceForm.processing_image')}</p>
                        </div>
                    )}
                </div>
            )}
            <div className={`${styles.formContainer} ${analysis ? styles.formContainerWithAnalysis : ''}`}>
                <form onSubmit={handleSubmit} className={styles.form}>
                    <div className={styles.textInputContainer}>
                        <TextInput
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={getLocalizedPlaceholder()}
                            variant="large"
                            onPaste={handlePaste}
                            disabled={!!imagePreview}
                        />
                        {imagePreview && (
                            <div className={styles.textInputOverlay}>
                                <p>{t('sentenceForm.text_disabled_with_image')}</p>
                            </div>
                        )}
                    </div>
                    <div className={styles.buttonsContainer}>
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleFileUpload}
                            className={styles.fileInput}
                        />
                        <Button 
                            type="button" 
                            onClick={triggerFileInput}
                            disabled={loading || isProcessingImage}
                            variant="secondary"
                            className={styles.uploadButton}
                            aria-label="Upload image"
                        >
                            <Upload />
                        </Button>
                        <Button 
                            type="submit" 
                            disabled={loading || isProcessingImage}
                            variant="primary"
                        >
                            {loading ? t('sentenceForm.analyzing') : t('sentenceForm.analyze')}
                        </Button>
                    </div>
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