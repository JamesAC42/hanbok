'use client';
import { useState, useEffect, useRef } from 'react';
import { MaterialSymbolsCheckBoxRounded } from '@/components/icons/Checkbox';
import { MaterialSymbolsLibraryAddRounded } from '@/components/icons/Add';
import { MaterialSymbolsArrowCircleRightRounded } from '@/components/icons/RightArrow';
import { SvgSpinnersRingResize } from '@/components/icons/RingSpin';
import { MaterialSymbolsCancel } from '@/components/icons/Close';
import { MaterialSymbolsArrowsMoreDownRounded } from '@/components/icons/DownLeft';
import Link from 'next/link';

import styles from '@/styles/components/sentenceanalyzer/wordslist.module.scss';
import { useAuth } from '@/contexts/AuthContext';
import { usePopup } from '@/contexts/PopupContext';

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

// Add this before the WordItem component
const TOOLTIP_SHOWN_KEY = 'word_add_tooltip_shown';

const WordItem = ({ 
    word, 
    savedWords, 
    toggleWordInLibrary, 
    showRelated = false, 
    type = null, 
    handleShowRelated = null, 
    expandedWord = null, 
    showTooltip = false,
    setShowTooltip = null
}) => {
    const isSaved = savedWords.has(word.korean);
    return (
        <div className={styles.wordListItem} data-role={type ? getCleanedType(type) : null}>
            <div className={styles.wordListItemActions}>
                <div 
                    className={`${styles.wordListItemAction} ${isSaved ? styles.wordInLibrary : styles.wordNotInLibrary}`}
                    onClick={(e) => {
                        console.log(setShowTooltip);
                        if (setShowTooltip) {
                            setShowTooltip(false);
                        }
                        toggleWordInLibrary({
                            korean: word.korean,
                            meaning: { english: word.english }
                        }, e)
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
            <span className={styles.wordDictionary}>{word.korean}</span>
            {word.english && ` - ${word.english}`}
            {type && (
                <span className={styles.wordListItemType}>
                    ({getDisplayType(type)})
                </span>
            )}
            {showRelated && handleShowRelated && (
                <button 
                    className={styles.showRelatedButton}
                    onClick={() => handleShowRelated({
                        korean: word.korean,
                        meaning: { english: word.english }
                    })}
                >
                    {expandedWord === word.korean ? 'Hide related words' : 'Show related words'}
                </button>
            )}
        </div>
    );
};

const WordsList = ({ analysis }) => {
    const { user, isLoading, isAuthenticated } = useAuth();
    const { showLimitReachedPopup, showLoginRequiredPopup } = usePopup();
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
                const data = await checkSavedWords(uniqueWords);
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
        const alreadySaved = savedWords.has(word.korean);
        try {
            if (alreadySaved) {
                await removeWord({
                    korean: word.korean,
                    english: word.meaning.english || ''
                });
                setSavedWords(prev => {
                    const updated = new Set(prev);
                    updated.delete(word.korean);
                    return updated;
                });
            } else {
                const addResult = await addWord({
                    korean: word.korean,
                    english: word.meaning.english || ''
                });
                if (addResult.reachedLimit) {
                    showLimitReachedPopup('words', {
                        x: event.clientX,
                        y: event.pageY + 20
                    });
                    return;
                }
                // On success, add word to saved set
                setSavedWords(prev => new Set([...prev, word.korean]));
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
        if (expandedWord === word.korean) {
            setExpandedWord(null);
            setRelatedWords(null);
            return;
        }
        setExpandedWord(word.korean);
        setRelatedWords(null);
        // Use cache if exists
        if (relatedWordsCache[word.korean]) {
            setRelatedWords(relatedWordsCache[word.korean]);
            return;
        }
        setLoadingRelated(true);
        try {
            const data = await fetchWordRelations(word.korean);
            if (data.success) {
                setRelatedWordsCache(prev => ({
                    ...prev,
                    [word.korean]: data
                }));
                setRelatedWords(data);
                // Check the related words for their saved state and update the global set
                const allRelated = [
                    ...data.synonyms.map(syn => syn.korean),
                    ...data.antonyms.map(ant => ant.korean)
                ];
                if (allRelated.length > 0) {
                    const checkRes = await checkSavedWords(allRelated);
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
        if (expandedWord !== word.korean) return null;
        return (
            <div className={styles.relatedWordsContainer}>
                {loadingRelated ? (
                    <div className={styles.loadingRelated}>
                        <SvgSpinnersRingResize />
                        <span>Loading related words...</span>
                    </div>
                ) : relatedWords ? (
                    (relatedWords.synonyms.length === 0 && relatedWords.antonyms.length === 0) ? (
                        <div className={styles.noRelatedWords}>
                            No related words found for "{word.korean}"
                        </div>
                    ) : (
                        <>
                            {relatedWords.synonyms.length > 0 && (
                                <div className={styles.relatedSection}>
                                    <h4>Synonyms</h4>
                                    {relatedWords.synonyms.map((syn, index) => (
                                        <WordItem 
                                            key={`syn-${index}`}
                                            word={{
                                                korean: syn.korean,
                                                english: syn.english
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
                                    <h4>Antonyms</h4>
                                    {relatedWords.antonyms.map((ant, index) => (
                                        <WordItem 
                                            key={`ant-${index}`}
                                            word={{
                                                korean: ant.korean,
                                                english: ant.english
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
                        <span>No related words found for "{word.korean}"</span>
                    </div>
                )}
            </div>
        );
    };

    const renderWordsList = () => {

        if(isLoading) return <div className={styles.loading}>Loading...</div>;
        if (isAuthenticated && isSavedWordsLoading) {
            return <div className={styles.loading}>Loading...</div>;
        }

        let wordList = [];
        const seenWords = new Set();
        
        analysis.components.forEach((word, index) => {
            if (!word.dictionary_form || seenWords.has(word.dictionary_form)) {
                return;
            }
            seenWords.add(word.dictionary_form);
            const formattedWord = {
                korean: word.dictionary_form,
                english: word.meaning?.english || ''
            };

            wordList.push(
                <div key={word.text + index}>
                    <WordItem 
                        word={formattedWord}
                        savedWords={savedWords}
                        toggleWordInLibrary={toggleWordInLibrary}
                        showRelated={true}
                        type={word.type}
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
                Words
            </div>
            <div className={styles.wordsListContainer}>
                {renderWordsList()}
            </div>
        </div>
    );
};

export default WordsList;