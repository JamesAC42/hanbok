'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { usePopup } from '@/contexts/PopupContext';
import { addWord, removeWord, checkSavedWords } from '@/api/words';
import { markStage } from '@/lib/todayLoop';
import { isContentWord } from './segment';

// Which of the passage's words are already in the learner's flashcards, and
// saving or removing them. Words are keyed by dictionary form, like the
// sentence analysis word list.
const useReaderWords = ({ sentences, keyVocabulary, originalLanguage, translationLanguage }) => {
    const { user } = useAuth();
    const { showLimitReachedPopup, showLoginRequiredPopup } = usePopup();
    const [saved, setSaved] = useState(new Set());
    const [busy, setBusy] = useState(false);
    const checked = useRef(new Set());

    const bases = useMemo(() => {
        const set = new Set();
        for (const sentence of sentences) {
            for (const word of sentence.words || []) {
                if (word.base && isContentWord(word)) set.add(word.base);
            }
        }
        for (const word of keyVocabulary || []) {
            if (word.word) set.add(word.word);
        }
        return [...set];
    }, [sentences, keyVocabulary]);

    useEffect(() => {
        if (!user) return;
        const unchecked = bases.filter((base) => !checked.current.has(base)).slice(0, 1500);
        if (unchecked.length === 0) return;
        unchecked.forEach((base) => checked.current.add(base));
        checkSavedWords(unchecked, originalLanguage)
            .then((data) => {
                if (data.success && data.savedWords?.length) {
                    setSaved((prev) => new Set([...prev, ...data.savedWords]));
                }
            })
            .catch((error) => console.error('Error checking saved words:', error));
    }, [bases, user, originalLanguage]);

    const save = useCallback(async ({ base, meaning, reading, sentenceId }) => {
        const result = await addWord({
            originalWord: base,
            translatedWord: meaning || '',
            originalLanguage,
            translationLanguage,
            reading: reading || '',
            sentenceId
        });
        if (!result.reachedLimit) {
            setSaved((prev) => new Set([...prev, base]));
            markStage('keep');
        }
        return result;
    }, [originalLanguage, translationLanguage]);

    const toggle = useCallback(async (word) => {
        if (!user) {
            showLoginRequiredPopup('words');
            return;
        }
        try {
            if (saved.has(word.base)) {
                await removeWord({ originalWord: word.base, originalLanguage, reading: word.reading });
                setSaved((prev) => {
                    const next = new Set(prev);
                    next.delete(word.base);
                    return next;
                });
            } else {
                const result = await save(word);
                if (result.reachedLimit) showLimitReachedPopup('words');
            }
        } catch (error) {
            console.error('Error saving word:', error);
        }
    }, [user, saved, originalLanguage, save, showLoginRequiredPopup, showLimitReachedPopup]);

    const saveMany = useCallback(async (words) => {
        if (!user) {
            showLoginRequiredPopup('words');
            return;
        }
        setBusy(true);
        try {
            for (const word of words) {
                if (saved.has(word.base)) continue;
                const result = await save(word);
                if (result.reachedLimit) {
                    showLimitReachedPopup('words');
                    break;
                }
            }
        } catch (error) {
            console.error('Error saving words:', error);
        } finally {
            setBusy(false);
        }
    }, [user, saved, save, showLoginRequiredPopup, showLimitReachedPopup]);

    return { saved, toggle, saveMany, busy };
};

export default useReaderWords;
