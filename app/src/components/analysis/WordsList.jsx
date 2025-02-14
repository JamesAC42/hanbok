'use client';
import { useState } from 'react';
import { MaterialSymbolsCheckBoxRounded } from '@/components/icons/Checkbox';
import { MaterialSymbolsLibraryAddRounded } from '@/components/icons/Add';

import styles from '@/styles/components/sentenceanalyzer/wordslist.module.scss';

const WordsList = ({analysis}) => {
    // Add state for tracking words in library if needed
    const [libraryWords, setLibraryWords] = useState(new Set());

    // Replace random check with actual library check
    const wordInLibrary = (word) => {
        // TODO: Replace with actual API call or library check
        return libraryWords.has(word.dictionary_form);
    }

    // Add function to handle adding/removing words from library
    const toggleWordInLibrary = async (word) => {
        try {
            if (wordInLibrary(word)) {
                // TODO: API call to remove word from library
                setLibraryWords(prev => {
                    const newSet = new Set(prev);
                    newSet.delete(word.dictionary_form);
                    return newSet;
                });
            } else {
                // TODO: API call to add word to library
                setLibraryWords(prev => new Set([...prev, word.dictionary_form]));
            }
        } catch (error) {
            console.error('Error toggling word in library:', error);
        }
    }

    const getDisplayType = (wordType) => {
      if (!wordType) {
        return '';
      }
      return wordType.replaceAll('_', ' ').toUpperCase();
    }

    const getCleanedType = (wordType) => {
      if (!wordType) {
        return '';
      }
      return wordType.replaceAll(' ', '_').toLowerCase();
    }
    const renderWordsList = () => {
        let wordList = [];
        const seenWords = new Set();
        
        analysis.components.forEach((word, index) => {
            if (seenWords.has(word.dictionary_form)) {
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
                            onClick={() => toggleWordInLibrary(word)}
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