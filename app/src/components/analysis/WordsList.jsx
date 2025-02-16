'use client';
import { useState, useEffect } from 'react';
import { MaterialSymbolsCheckBoxRounded } from '@/components/icons/Checkbox';
import { MaterialSymbolsLibraryAddRounded } from '@/components/icons/Add';

import styles from '@/styles/components/sentenceanalyzer/wordslist.module.scss';
import { useAuth } from '@/contexts/AuthContext';
import { usePopup } from '@/contexts/PopupContext';

const WordsList = ({analysis}) => {
    const { user } = useAuth();
    const { showLimitReachedPopup, showLoginRequiredPopup } = usePopup();
    const [libraryWords, setLibraryWords] = useState(new Set());
    const [isLoading, setIsLoading] = useState(true);

    // Check which words are saved when component mounts or analysis changes
    useEffect(() => {
        const checkSavedWords = async () => {
            if (!analysis) return;

            try {
                setIsLoading(true);
                
                if (user) {
                    // Only check saved words if user is logged in
                    const uniqueWords = [...new Set(
                        analysis.components
                            .filter(word => word.dictionary_form)
                            .map(word => word.dictionary_form)
                    )];

                    const response = await fetch('/api/words/check', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        credentials: 'include',
                        body: JSON.stringify({ words: uniqueWords })
                    });

                    if (!response.ok) throw new Error('Failed to check saved words');

                    const data = await response.json();
                    if (data.success) {
                        setLibraryWords(new Set(data.savedWords));
                    }
                } else {
                    // Clear saved words if user is not logged in
                    setLibraryWords(new Set());
                }
            } catch (error) {
                console.error('Error checking saved words:', error);
            } finally {
                setIsLoading(false);
            }
        };

        checkSavedWords();
    }, [analysis, user]);

    const wordInLibrary = (word) => {
        return libraryWords.has(word.dictionary_form);
    }

    const toggleWordInLibrary = async (word, event) => {
        if (!user) {
            showLoginRequiredPopup('words');
            return;
        }

        try {
            if (wordInLibrary(word)) {
                // Find the wordId first
                const response = await fetch('/api/words', {
                    credentials: 'include'
                });
                const data = await response.json();
                if (!data.success) throw new Error('Failed to get words');
                
                const savedWord = data.words.find(w => w.korean === word.dictionary_form);
                if (!savedWord) throw new Error('Word not found');

                // Remove word
                const removeResponse = await fetch(`/api/words/${savedWord.wordId}`, {
                    method: 'DELETE',
                    credentials: 'include'
                });
                
                if (!removeResponse.ok) throw new Error('Failed to remove word');

                setLibraryWords(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(word.dictionary_form);
                    return newSet;
                });
            } else {
                // Add word
                const addResponse = await fetch('/api/words', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        korean: word.dictionary_form,
                        english: word.meaning?.english || ''
                    })
                });

                const data = await addResponse.json();

                if (data.reachedLimit) {
                    showLimitReachedPopup('words', {
                        x: event.clientX,
                        y: event.pageY + 20
                    });
                    return;
                }

                if (!addResponse.ok) throw new Error('Failed to add word');
                setLibraryWords(prev => new Set([...prev, word.dictionary_form]));
            }
        } catch (error) {
            console.error('Error toggling word in library:', error);
        }
    }

    const getDisplayType = (wordType) => {
        if (!wordType) return '';
        return wordType.replaceAll('_', ' ').toUpperCase();
    }

    const getCleanedType = (wordType) => {
        if (!wordType) return '';
        return wordType.replaceAll(' ', '_').toLowerCase();
    }

    const renderWordsList = () => {
        if (isLoading) {
            return <div className={styles.loading}>Loading...</div>;
        }

        let wordList = [];
        const seenWords = new Set();
        
        analysis.components.forEach((word, index) => {
            if (!word.dictionary_form || seenWords.has(word.dictionary_form)) {
                return;
            }
            
            seenWords.add(word.dictionary_form);
            
            wordList.push(
                <div 
                    className={styles.wordListItem} 
                    key={word.text + index} 
                    data-role={getCleanedType(word.type)}
                >
                    <div className={styles.wordListItemActions}>
                        <div 
                            className={`${styles.wordListItemAction} ${wordInLibrary(word) ? styles.wordInLibrary : styles.wordNotInLibrary}`}
                            onClick={(e) => toggleWordInLibrary(word, e)}
                        >
                            {wordInLibrary(word) ? 
                                <MaterialSymbolsCheckBoxRounded /> : 
                                <MaterialSymbolsLibraryAddRounded />
                            }
                        </div>
                    </div>
                    <span className={styles.wordDictionary}>{word.dictionary_form}</span>
                    {word.meaning?.english && ` - ${word.meaning.english}`}
                    <span className={styles.wordListItemType}>
                        {getDisplayType(word.type)}
                    </span>
                </div>
            );
        });
        return wordList;
    }

    if(!analysis) {
        return null;
    }

    return(
        <div className={styles.wordsList}>
            <div className={styles.wordsListHeader}>
                Words
            </div>
            <div className={styles.wordsListContainer}>
                {renderWordsList()}
            </div>
        </div>
    )
}

export default WordsList;