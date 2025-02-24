/**
 * This file contains helper functions that wrap our API endpoints for:
 *   - fetching word relations,
 *   - adding a word,
 *   - removing a word,
 *   - and checking saved words.
 */

export async function fetchWordRelations(word, originalLanguage, translationLanguage) {
  try {
    const response = await fetch(
      `/api/word-relations?word=${encodeURIComponent(word)}&originalLanguage=${originalLanguage}&translationLanguage=${translationLanguage}`,
      { credentials: 'include' },
    );
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

export async function addWord({ originalWord, translatedWord, originalLanguage, translationLanguage }) {
  try {
    const response = await fetch('/api/words', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        originalWord,
        translatedWord,
        originalLanguage,
        translationLanguage
      })
    });
    const data = await response.json();
    if (data.reachedLimit) {
      return { reachedLimit: true };
    }
    if (!response.ok) {
      throw new Error('Failed to add word');
    }
    return { success: true };
  } catch (error) {
    throw error;
  }
}

export async function removeWord({ originalWord, originalLanguage }) {
  try {
    const checkResponse = await checkSavedWords([originalWord], originalLanguage);
    if (
      !checkResponse.success ||
      !checkResponse.savedWords ||
      checkResponse.savedWords.length === 0
    ) {
      throw new Error('Word not found');
    }
    const response = await fetch(`/api/words/`, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({
        originalWord,
        originalLanguage
      })
    });
    if (!response.ok) {
      throw new Error('Failed to remove word');
    }
    return { success: true };
  } catch (error) {
    throw error;
  }
}

export async function checkSavedWords(words, originalLanguage = 'ko') {
  try {
    const response = await fetch('/api/words/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ 
        words,
        originalLanguage 
      })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
} 