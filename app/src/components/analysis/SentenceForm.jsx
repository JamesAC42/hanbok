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

import TranslationSwitcher from '@/components/TranslationSwitcher';

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
    setTransition,
    translationMode
}) => {
    const { t, language, nativeLanguage, supportedLanguages } = useLanguage();
    const { isAuthenticated, user, decrementRemainingImageExtracts, decrementRemainingSentenceAnalyses, updateWeeklySentenceQuota } = useAuth();
    const { showLimitReachedPopup, showLoginRequiredPopup } = usePopup();
    const [text, setText] = useState('');
    const [textContext, setTextContext] = useState('');
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

    const getNativePlaceholder = () => {
        const languageKey = supportedLanguages[nativeLanguage];
        const languageName = t(`languages.${languageKey}`);
        return t('sentenceForm.placeholderNative').replace('{language}', languageName);
    };

    const getContextPlaceholder = () => {
        return t('sentenceForm.placeholderContext');
    }

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

    // Function to show appropriate rate limit notification popup
    const showRateLimitNotification = (notification) => {
        if (!notification) return;
        
        // Update weekly sentence quota in the user session with values from the server
        // This takes precedence over our client-side calculations
        if (isAuthenticated && notification.weekSentencesUsed !== undefined) {
            updateWeeklySentenceQuota(
                notification.weekSentencesUsed,
                notification.weekSentencesTotal,
                notification.weekSentencesRemaining
            );
        }
        
        // Create custom popup message based on notification type
        let popupType = '';
        
        switch (notification.type) {
            case 'firstFiveUsed':
                popupType = 'first-five-used';
                break;
            case 'fifteenRemaining':
                popupType = 'fifteen-remaining';
                break;
            case 'fiveRemaining':
                popupType = 'five-remaining';
                break;
            default:
                return; // Don't show popup for unknown notification types
        }
        
        // Use the existing popup system to show the notification
        showLimitReachedPopup(popupType);
    };
    
    // Function to show a message when a purchased analysis is used
    const showPurchasedAnalysisUsage = (remainingCount) => {
        setError({
            type: 'purchased_analysis_used',
            message: `You used 1 of your purchased sentence analyses. You have ${remainingCount - 1} remaining.`
        });
        
        // Clear the message after 3 seconds
        setTimeout(() => {
            setError(null);
        }, 3000);
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
                    translationLanguage: nativeLanguage,
                    translate: translationMode,
                    translationContext: textContext
                }),
                signal: controller.signal
            });

            clearTimeout(timeoutId);

            const data = await response.json();

            // If rate limit exceeded, show error
            if (data.message?.error?.type === 'rate_limit_exceeded') {
                setError({
                    type: 'rate_limit_exceeded',
                    message: data.message.error.message
                });
                
                // Show the limit reached popup 
                showLimitReachedPopup('sentence-analyses');
                setLoading(false);
                return;
            }

            if(data.message.isValid) {
                // If this is an image submission and user is logged in
                if (imagePreview && isAuthenticated && user.tier === 0) {
                    decrementRemainingImageExtracts();
                }
                
                // If this request used a purchased analysis, decrement the counter
                if (data.usedPurchasedAnalysis && isAuthenticated) {
                    decrementRemainingSentenceAnalyses();
                    showPurchasedAnalysisUsage(user.remainingSentenceAnalyses);
                }
                
                // Clear image preview
                setImagePreview(null);
                
                // Update analysis state in parent component
                //setAnalysis(data.message.analysis);
                
                // Clear voice keys
                setVoice1(null);
                setVoice2(null);
                
                // Show transition animation
                setTransition(true);
                
                // For free users, always update the weekly sentence quota information after each analysis
                if (isAuthenticated && user?.tier === 0 && !data.usedPurchasedAnalysis) {
                    // If the server sent weekly quota info, use it
                    if (data.weeklyQuota) {
                        updateWeeklySentenceQuota(
                            data.weeklyQuota.weekSentencesUsed,
                            data.weeklyQuota.weekSentencesTotal,
                            data.weeklyQuota.weekSentencesRemaining
                        );
                    } else {
                        // Otherwise, calculate locally
                        const newWeekSentencesUsed = (user.weekSentencesUsed || 0) + 1;
                        const weekSentencesTotal = user.weekSentencesTotal || 30;
                        const newWeekSentencesRemaining = weekSentencesTotal - newWeekSentencesUsed;
                        
                        updateWeeklySentenceQuota(
                            newWeekSentencesUsed,
                            weekSentencesTotal,
                            newWeekSentencesRemaining
                        );
                    }
                }
                
                // If there's a notification about rate limits, show it as a popup
                if (data.notification) {
                    // Show appropriate popup based on notification type
                    setTimeout(() => {
                        showRateLimitNotification(data.notification);
                    }, 500);
                }
                
                playFinishedSound();
                
                // If originalLanguage or sentenceId is in the response, add them to query params
                if (data.originalLanguage && data.sentenceId) {
                    router.push(`/sentence/${data.sentenceId}`);
                }
            } else {
                setError({
                    type: data.message.error?.type || 'other',
                    message: data.message.error?.message
                });
            }

            setLoading(false);
            setIsProcessingImage(false);
        } catch (error) {
            console.error('Error:', error);
            if (error.name === 'AbortError') {
                setError({
                    type: 'timeout',
                    message: t('sentenceForm.errors.timeout')
                });
            } else {
                setError({
                    type: 'server',
                    message: t('sentenceForm.errors.server')
                });
            }
            setLoading(false);
            setIsProcessingImage(false);
        }
    };
    
    const getErrorMessage = (error) => {
        if (!error) return '';
        
        switch (error.type) {
            case 'empty':
                return t('sentenceForm.errors.empty');
            case 'timeout':
                return error.message || t('sentenceForm.errors.timeout');
            case 'server':
                return error.message || t('sentenceForm.errors.server');
            case 'file_too_large':
                return error.message || t('sentenceForm.errors.file_too_large');
            case 'invalid_file':
                return error.message || t('sentenceForm.errors.invalid_file');
            case 'image_processing':
                return error.message || t('sentenceForm.errors.image_processing');
            case 'rate_limit_exceeded':
                return error.message || t('sentenceForm.errors.rate_limit_exceeded');
            case 'rate_limit_notification':
                return error.notification?.message || '';
            case 'purchased_analysis_used':
                return error.message || t('sentenceForm.errors.purchased_analysis_used');
            default:
                return error.message || t('sentenceForm.errors.unknown');
        }
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
                            language={translationMode ? nativeLanguage : language}
                            value={text}
                            onChange={(e) => setText(e.target.value)}
                            placeholder={translationMode ? getNativePlaceholder() : getLocalizedPlaceholder()}
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
                    {
                        translationMode && (  
                            <div className={styles.textInputContainer}>
                                <TextInput
                                    language={nativeLanguage}
                                    value={textContext}
                                    onChange={(e) => setTextContext(e.target.value)}
                                    placeholder={getContextPlaceholder()}
                                    variant="large"
                                    onPaste={null}
                                />
                            </div>
                        )
                    }
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
                    <div className={error.type === 'purchased_analysis_used' ? styles.infoMessage : styles.error}>
                        {getErrorMessage(error)}
                    </div>
                )
            }
        </>
    )
}

export default SentenceForm;