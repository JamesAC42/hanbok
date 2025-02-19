/**
 * This file contains helper functions that wrap our API endpoints for:
 *   - fetching word relations,
 *   - adding a word,
 *   - removing a word,
 *   - and checking saved words.
 */

export async function fetchWordRelations(word) {
  try {
    const response = await fetch(
      `/api/word-relations?word=${encodeURIComponent(word)}`,
      { credentials: 'include' }
    );
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
}

export async function addWord(word) {
  try {
    const response = await fetch('/api/words', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(word)
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

export async function removeWord(word) {
  try {
    const checkResponse = await checkSavedWords([word.korean]);
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
      body: JSON.stringify({word})
    });
    if (!response.ok) {
      throw new Error('Failed to remove word');
    }
    return { success: true };
  } catch (error) {
    throw error;
  }
}

export async function checkSavedWords(words) {
  try {
    const response = await fetch('/api/words/check', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ words })
    });
    const data = await response.json();
    return data;
  } catch (error) {
    throw error;
  }
} 