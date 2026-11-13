'use client';
import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePopup } from '@/contexts/PopupContext';
import { addWord, removeWord, checkSavedWords } from '@/api/words';
import { queuePendingSave } from '@/lib/pendingSaves';
import { track } from '@/lib/analytics';

// Unique, saveable words from an analysis, in sentence order.
export const getAnalysisWords = (analysis, originalLanguage, translationLanguage) => {
    if (!analysis?.components) return [];
    const seen = new Set();
    const words = [];
    analysis.components.forEach((component, index) => {
        if (!component.dictionary_form || seen.has(component.dictionary_form)) return;
        if (component.type === 'punctuation') return;
        seen.add(component.dictionary_form);
        words.push({
            key: component.text + index,
            originalWord: component.dictionary_form,
            translatedWord: component.meaning?.description || '',
            originalLanguage,
            translationLanguage,
            reading: component.reading || '',
            transliteration: component.transliteration || '',
            type: component.type_translated || component.type,
        });
    });
    return words;
};

// Saved-word state for one analysis, shared by the word list and the
// "Next" panel so both show the same flashcard status.
const useSavedWords = ({ analysis, originalLanguage, translationLanguage, sentenceId }) => {
    const { user } = useAuth();
    const { showLimitReachedPopup, showLoginRequiredPopup } = usePopup();
    const [savedWords, setSavedWords] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [addingAll, setAddingAll] = useState(false);
    const checkedFor = useRef(null);

    const words = useMemo(
        () => getAnalysisWords(analysis, originalLanguage, translationLanguage),
        [analysis, originalLanguage, translationLanguage]
    );

    useEffect(() => {
        if (!analysis) return;
        if (!user) {
            setSavedWords(new Set());
            setLoading(false);
            return;
        }
        if (checkedFor.current === analysis) return;
        checkedFor.current = analysis;

        const unique = words.map(word => word.originalWord);
        if (unique.length === 0) {
            setLoading(false);
            return;
        }

        setLoading(true);
        checkSavedWords(unique, originalLanguage)
            .then(data => {
                if (data.success) setSavedWords(new Set(data.savedWords));
            })
            .catch(error => console.error('Error checking saved words:', error))
            .finally(() => setLoading(false));
    }, [analysis, user, words, originalLanguage]);

    const saveWord = useCallback(async (word) => {
        const result = await addWord({
            originalWord: word.originalWord,
            translatedWord: word.translatedWord,
            originalLanguage,
            translationLanguage,
            reading: word.reading,
            sentenceId,
        });
        if (!result.reachedLimit) {
            setSavedWords(prev => new Set([...prev, word.originalWord]));
        }
        return result;
    }, [originalLanguage, translationLanguage, sentenceId]);

    // Signed out: remember the words and ask for a free account; they're saved
    // as soon as it exists (components/PendingSaves).
    const queueForSignup = useCallback((list, where) => {
        list.forEach((w) => queuePendingSave({ ko: w.originalWord, en: w.translatedWord, lang: originalLanguage, to: translationLanguage }));
        track('anon_save_click', { where, count: list.length });
        const first = list[0];
        showLoginRequiredPopup('save-word', list.length === 1 && first ? { word: first.originalWord, meaning: first.translatedWord } : null);
    }, [originalLanguage, translationLanguage, showLoginRequiredPopup]);

    const toggleWord = useCallback(async (word) => {
        if (!user) {
            queueForSignup([word], 'word');
            return;
        }
        try {
            if (savedWords.has(word.originalWord)) {
                await removeWord({
                    originalWord: word.originalWord,
                    originalLanguage,
                    reading: word.reading,
                });
                setSavedWords(prev => {
                    const updated = new Set(prev);
                    updated.delete(word.originalWord);
                    return updated;
                });
            } else {
                const result = await saveWord(word);
                if (result.reachedLimit) showLimitReachedPopup('words');
            }
        } catch (error) {
            console.error('Error toggling word in library:', error);
        }
    }, [user, savedWords, originalLanguage, saveWord, queueForSignup, showLimitReachedPopup]);

    const unsavedWords = useMemo(
        () => words.filter(word => !savedWords.has(word.originalWord)),
        [words, savedWords]
    );

    // Saves every unsaved word, or just the ones passed in.
    const saveAll = useCallback(async (subset) => {
        const toSave = Array.isArray(subset) ? subset : unsavedWords;
        if (!user) {
            queueForSignup(toSave, 'all');
            return;
        }
        setAddingAll(true);
        try {
            for (const word of toSave) {
                const result = await saveWord(word);
                if (result.reachedLimit) {
                    showLimitReachedPopup('words');
                    break;
                }
            }
        } catch (error) {
            console.error('Error saving words:', error);
        } finally {
            setAddingAll(false);
        }
    }, [user, unsavedWords, saveWord, queueForSignup, showLimitReachedPopup]);

    return {
        words,
        savedWords,
        setSavedWords,
        unsavedWords,
        loading,
        addingAll,
        toggleWord,
        saveAll,
    };
};

export default useSavedWords;
