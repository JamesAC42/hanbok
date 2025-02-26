'use client';
import { useState, useEffect, useRef } from 'react';
import { MaterialSymbolsCheckBoxRounded } from '@/components/icons/Checkbox';
import { MaterialSymbolsLibraryAddRounded } from '@/components/icons/Add';
import { MaterialSymbolsArrowCircleRightRounded } from '@/components/icons/RightArrow';
import { SvgSpinnersRingResize } from '@/components/icons/RingSpin';
import { MaterialSymbolsCancel } from '@/components/icons/Close';
import { MaterialSymbolsArrowsMoreDownRounded } from '@/components/icons/DownLeft';
import Link from 'next/link';
import { romanize } from '@romanize/korean';

import styles from '@/styles/components/sentenceanalyzer/wordslist.module.scss';
import { useAuth } from '@/contexts/AuthContext';
import { usePopup } from '@/contexts/PopupContext';
import { useLanguage } from '@/contexts/LanguageContext';

// Import our helper API functions
import { fetchWordRelations, addWord, removeWord, checkSavedWords } from '@/api/words';

// Utility functions
const getDisplayType = (wordType) => {
    if (!wordType) return '';
    return wordType.replaceAll('_', ' ').toUpperCase();
};

const getCleanedType = (wordType) => {
    if (!wordType) return '';
    return wordType.replaceAll(' ', '_').toLowerCase();
};

const getDisplayReading = (word, language) => {
    let reading = null;
    if(language === 'ko') {
        reading = romanize(word.originalWord);
    } else if(word.reading) {
        reading = word.reading;
    }
    if(reading) {
        return (
            <span className={styles.wordReading}>
                ({reading})
            </span>
        )
    }
    return null;
}

// Add this before the WordItem component
const TOOLTIP_SHOWN_KEY = 'word_add_tooltip_shown';

const WordItem = ({ 
    word, 
    language,
    savedWords, 
    toggleWordInLibrary, 
    showRelated = false, 
    type = null, 
    handleShowRelated = null, 
    expandedWord = null, 
    showTooltip = false,
    setShowTooltip = null
}) => {
    const { t } = useLanguage();
    const isSaved = savedWords.has(word.originalWord);
    return (
        <div className={styles.wordListItem} data-role={type ? getCleanedType(type) : null}>
            <div className={styles.wordListItemActions}>
                <div 
                    className={`${styles.wordListItemAction} ${isSaved ? styles.wordInLibrary : styles.wordNotInLibrary}`}
                    onClick={(e) => {
                        if (setShowTooltip) {
                            setShowTooltip(false);
                        }
                        toggleWordInLibrary(word, e)
                    }}>
                    {isSaved ? 
                        <MaterialSymbolsCheckBoxRounded /> : 
                        <MaterialSymbolsLibraryAddRounded />
                    }
                    {showTooltip && (
                        <div
                            onClick={() => {
                                if (setShowTooltip) {
                                    setShowTooltip(false);
                                }
                            }}
                            className={styles.addWordTooltip}>
                            <div className={styles.addWordTooltipInner}>
                                Click to save this word to your library
                                <MaterialSymbolsCancel />
                                <div className={styles.addWordTooltipIcon}> 
                                    <MaterialSymbolsArrowsMoreDownRounded />
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <span className={styles.wordDictionary}>{word.originalWord}</span>
            {
                getDisplayReading(word, language)
            }
            {word.translatedWord && ` ${word.translatedWord}`}
            {type && (
                <span className={styles.wordListItemType}>
                    ({getDisplayType(type)})
                </span>
            )}
            {showRelated && handleShowRelated && (
                <button 
                    className={styles.showRelatedButton}
                    onClick={() => handleShowRelated(word)}
                >
                    {expandedWord === word.originalWord ? 
                        t('analysis.hideRelatedWords') : 
                        t('analysis.showRelatedWords')
                    }
                </button>
            )}
        </div>
    );
};

const WordsList = ({ analysis, originalLanguage, translationLanguage }) => {
    const { user, isLoading, isAuthenticated } = useAuth();
    const { showLimitReachedPopup, showLoginRequiredPopup } = usePopup();
    const { t } = useLanguage();
    const [savedWords, setSavedWords] = useState(new Set());
    const [isSavedWordsLoading, setIsSavedWordsLoading] = useState(true);
    const [expandedWord, setExpandedWord] = useState(null);
    const [relatedWords, setRelatedWords] = useState(null);
    const [loadingRelated, setLoadingRelated] = useState(false);
    const [relatedWordsCache, setRelatedWordsCache] = useState({});
    const [showTooltip, setShowTooltip] = useState(false);
    
    // Add this ref to track initialization
    const initialized = useRef(false);
    
    useEffect(() => {
        const populateSavedWords = async () => {
            const uniqueWords = [...new Set(
                analysis.components
                    .filter(word => word.dictionary_form)
                    .map(word => word.dictionary_form)
            )];

            if (uniqueWords.length === 0) return;

            try {
                setIsSavedWordsLoading(true);
                const data = await checkSavedWords(uniqueWords, originalLanguage);
                if (data.success) {
                    setSavedWords(new Set(data.savedWords));
                }
            } catch (error) {
                console.error('Error checking saved words:', error);
            } finally {
                setIsSavedWordsLoading(false);
            }
        };

        // Add initialization check
        if (initialized.current) return;
        if (!analysis) return;
        if (savedWords.size > 0) return;
        if (!user) {
            setSavedWords(new Set());
            return;
        }

        initialized.current = true;
        populateSavedWords();

    }, [analysis, user]);

    useEffect(() => {

        const hasSeenTooltip = localStorage.getItem(TOOLTIP_SHOWN_KEY);
        if (!hasSeenTooltip) {
            setShowTooltip(true);
            localStorage.setItem(TOOLTIP_SHOWN_KEY, 'true');
        }
    }, [isLoading, isAuthenticated]);

    const toggleWordInLibrary = async (word, event) => {
        if (!user) {
            showLoginRequiredPopup('words');
            return;
        }
        const alreadySaved = savedWords.has(word.originalWord);
        try {
            if (alreadySaved) {
                await removeWord({
                    originalWord: word.originalWord,
                    originalLanguage: originalLanguage
                });
                setSavedWords(prev => {
                    const updated = new Set(prev);
                    updated.delete(word.originalWord);
                    return updated;
                });
            } else {
                const addResult = await addWord({
                    originalWord: word.originalWord,
                    translatedWord: word.translatedWord,
                    originalLanguage: originalLanguage,
                    translationLanguage: translationLanguage
                });
                if (addResult.reachedLimit) {
                    showLimitReachedPopup('words', {
                        x: event.clientX,
                        y: event.pageY + 20
                    });
                    return;
                }
                setSavedWords(prev => new Set([...prev, word.originalWord]));
            }
        } catch (error) {
            console.error('Error toggling word in library:', error);
        }
    };

    const handleShowRelated = async (word) => {
        if (!user) {
            showLoginRequiredPopup('related-words');
            return;
        }
        if (user.tier !== 1) {
            showLimitReachedPopup('related-words');
            return;
        }
        // Toggle if already expanded
        if (expandedWord === word.originalWord) {
            setExpandedWord(null);
            setRelatedWords(null);
            return;
        }
        setExpandedWord(word.originalWord);
        setRelatedWords(null);
        // Use cache if exists
        if (relatedWordsCache[word.originalWord]) {
            setRelatedWords(relatedWordsCache[word.originalWord]);
            return;
        }
        setLoadingRelated(true);
        try {
            const data = await fetchWordRelations(word.originalWord, originalLanguage, translationLanguage);
            if (data.success) {
                setRelatedWordsCache(prev => ({
                    ...prev,
                    [word.originalWord]: data
                }));
                setRelatedWords(data);
                // Check the related words for their saved state and update the global set
                const allRelated = [
                    ...data.synonyms.map(syn => syn.originalWord),
                    ...data.antonyms.map(ant => ant.originalWord)
                ];
                if (allRelated.length > 0) {
                    const checkRes = await checkSavedWords(allRelated, originalLanguage);
                    if (checkRes.success && checkRes.savedWords) {
                        setSavedWords(prev => {
                            const updated = new Set(prev);
                            checkRes.savedWords.forEach(savedWord => updated.add(savedWord));
                            return updated;
                        });
                    }
                }
            } else if (data.error?.type === 'subscription') {
                showLimitReachedPopup('related-words');
            }
        } catch (error) {
            console.error('Error fetching related words:', error);
        } finally {
            setLoadingRelated(false);
        }
    };

    const renderRelatedWords = (word) => {
        if (expandedWord !== word.originalWord) return null;
        return (
            <div className={styles.relatedWordsContainer}>
                {loadingRelated ? (
                    <div className={styles.loadingRelated}>
                        <SvgSpinnersRingResize />
                        <span>{t('sentenceForm.loading.elements')}</span>
                    </div>
                ) : relatedWords ? (
                    (relatedWords.synonyms.length === 0 && relatedWords.antonyms.length === 0) ? (
                        <div className={styles.noRelatedWords}>
                            {t('limitReached.relatedWordsMessage')}
                        </div>
                    ) : (
                        <>
                            {relatedWords.synonyms.length > 0 && (
                                <div className={styles.relatedSection}>
                                    <h4>{t('analysis.synonyms')}</h4>
                                    {relatedWords.synonyms.map((syn, index) => (
                                        <WordItem 
                                            key={`syn-${index}`}
                                            language={originalLanguage}
                                            word={{
                                                originalWord: syn.originalWord,
                                                reading: syn.reading,
                                                translatedWord: syn.translatedWord
                                            }}
                                            savedWords={savedWords}
                                            toggleWordInLibrary={toggleWordInLibrary}
                                            showTooltip={false}
                                        />
                                    ))}
                                </div>
                            )}
                            {relatedWords.antonyms.length > 0 && (
                                <div className={styles.relatedSection}>
                                    <h4>{t('analysis.antonyms')}</h4>
                                    {relatedWords.antonyms.map((ant, index) => (
                                        <WordItem 
                                            key={`ant-${index}`}
                                            language={originalLanguage}
                                            word={{
                                                originalWord: ant.originalWord,
                                                reading: ant.reading,
                                                translatedWord: ant.translatedWord
                                            }}
                                            savedWords={savedWords}
                                            toggleWordInLibrary={toggleWordInLibrary}
                                            showTooltip={false}
                                        />
                                    ))}
                                </div>
                            )}
                        </>
                    )
                ) : (
                    <div className={styles.errorRelatedWords}>
                        <MaterialSymbolsCancel />
                        <span>{t('sentenceForm.errors.other')}</span>
                    </div>
                )}
            </div>
        );
    };

    const renderWordsList = () => {
        if(isLoading) return <div className={styles.loading}>{t('sentenceForm.loading.elements')}</div>;
        if (isAuthenticated && isSavedWordsLoading) {
            return <div className={styles.loading}>{t('sentenceForm.loading.elements')}</div>;
        }

        let wordList = [];
        const seenWords = new Set();
        
        analysis.components.forEach((word, index) => {
            if (!word.dictionary_form || seenWords.has(word.dictionary_form)) {
                return;
            }
            seenWords.add(word.dictionary_form);
            const formattedWord = {
                originalWord: word.dictionary_form,
                translatedWord: word.meaning?.description || '',
                originalLanguage: originalLanguage,
                translationLanguage: translationLanguage,
                reading: word.reading || ''
            };

            wordList.push(
                <div key={word.text + index}>
                    <WordItem 
                        word={formattedWord}
                        language={originalLanguage}
                        savedWords={savedWords}
                        toggleWordInLibrary={toggleWordInLibrary}
                        showRelated={true}
                        type={word.type_translated || word.type}
                        handleShowRelated={handleShowRelated}
                        expandedWord={expandedWord}
                        showTooltip={showTooltip && index === 0}
                        setShowTooltip={setShowTooltip}
                    />
                    {renderRelatedWords(formattedWord)}
                </div>
            );
        });
        return wordList;
    };

    if (!analysis) return null;

    return (
        <div className={styles.wordsList}>
            <div className={styles.wordsListHeader}>
                {t('analysis.words')}
            </div>
            <div className={styles.wordsListContainer}>
                {renderWordsList()}
            </div>
        </div>
    );
};

export default WordsList;