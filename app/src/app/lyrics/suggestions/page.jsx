'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import styles from '@/styles/pages/lyricsuggestions.module.scss';
import Link from 'next/link';
import { BxsUpvote } from '@/components/icons/Upvote';
import { MaterialSymbolsDeleteOutlineSharp } from '@/components/icons/Delete';

const languageOptions = [
  { value: 'ko', label: 'Korean' },
  { value: 'ja', label: 'Japanese' },
  { value: 'zh', label: 'Chinese' },
];

const genreOptions = [
  'K-Pop', 'J-Pop', 'Anime', 'Pop', 'Hip Hop', 'R&B', 'Rock', 'Ballad', 'Indie'
];

const Suggestions = () => {
  const { user, isAuthenticated } = useAuth();
  const { isAdmin } = useAdmin();
  
  const [formData, setFormData] = useState({
    songName: '',
    artist: '',
    genre: '',
    youtubeUrl: '',
    language: 'ko'
  });
  
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Fetch all suggestions
  useEffect(() => {
    fetchSuggestions();
  }, []);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/lyrics/suggestions');
      const data = await response.json();
      if (data.success) {
        setSuggestions(data.suggestions);
      } else {
        setError(data.message || 'Failed to fetch suggestions');
      }
    } catch (err) {
      setError('Failed to connect to the server');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.songName || !formData.artist) {
      setSubmissionError('Song name and artist are required');
      return;
    }
    
    try {
      setSubmitting(true);
      setSubmissionError(null);
      
      const response = await fetch('/api/lyrics/suggestions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Reset form and show success message
        setFormData({
          songName: '',
          artist: '',
          genre: '',
          youtubeUrl: '',
          language: 'ko'
        });
        setSubmitSuccess(true);
        setTimeout(() => setSubmitSuccess(false), 3000);
        
        // Add new suggestion to the list
        setSuggestions(prev => [data.suggestion, ...prev]);
      } else {
        setSubmissionError(data.message || 'Failed to submit suggestion');
      }
    } catch (err) {
      setSubmissionError('Failed to connect to the server');
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpvote = async (suggestionId) => {
    if (!isAuthenticated) {
        alert("Please log in to upvote a suggestion");
        return;
    }
    
    try {
      const response = await fetch(`/api/lyrics/suggestions/${suggestionId}/upvote`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the suggestion in the list
        setSuggestions(prev => 
          prev.map(s => s.suggestionId === suggestionId ? data.suggestion : s)
        );
      }
    } catch (err) {
      console.error('Error upvoting suggestion:', err);
    }
  };

  const handleStatusChange = async (suggestionId, status) => {
    if (!isAdmin || !isAdmin(user?.email)) return;
    
    try {
      const response = await fetch(`/api/admin/lyrics/suggestions/${parseInt(suggestionId)}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Update the suggestion in the list
        setSuggestions(prev => 
          prev.map(s => s.suggestionId === suggestionId ? { ...s, status } : s)
        );
      } else {
        console.error('Failed to update status:', data.message);
      }
    } catch (err) {
      console.error('Error updating suggestion status:', err);
    }
  };

  const handleDelete = async (suggestionId) => {
    if (!isAdmin || !isAdmin(user?.email)) return;
    
    if (!confirm('Are you sure you want to delete this suggestion?')) return;
    
    try {
      const response = await fetch(`/api/admin/lyrics/suggestions/${suggestionId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        // Remove the suggestion from the list
        setSuggestions(prev => prev.filter(s => s.suggestionId !== suggestionId));
      }
    } catch (err) {
      console.error('Error deleting suggestion:', err);
    }
  };

  // Format date for display
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Song Suggestions</h1>
        <h2>Request your favorite songs to be added to our lyrics collection</h2>
      </div>
      
      <div className={styles.formSection}>
        <h3>Suggest a Song</h3>
        
        {!isAuthenticated ? (
          <div className={styles.loginPrompt}>
            <p>Please log in to suggest songs.</p>
            <p>
              <Link href="/login">
                Log in
              </Link>
            </p>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="songName">Song Name *</label>
              <input
                type="text"
                id="songName"
                name="songName"
                value={formData.songName}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="artist">Artist/Band *</label>
              <input
                type="text"
                id="artist"
                name="artist"
                value={formData.artist}
                onChange={handleInputChange}
                required
              />
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="genre">Genre</label>
              <select
                id="genre"
                name="genre"
                value={formData.genre}
                onChange={handleInputChange}
              >
                <option value="">Select a genre</option>
                {genreOptions.map(genre => (
                  <option key={genre} value={genre}>{genre}</option>
                ))}
              </select>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="language">Language</label>
              <select
                id="language"
                name="language"
                value={formData.language}
                onChange={handleInputChange}
              >
                {languageOptions.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
            
            <div className={styles.formGroup + ' ' + styles.fullWidth}>
              <label htmlFor="youtubeUrl">YouTube URL (optional)</label>
              <input
                type="url"
                id="youtubeUrl"
                name="youtubeUrl"
                value={formData.youtubeUrl}
                onChange={handleInputChange}
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
            
            {submissionError && (
              <div className={styles.formGroup + ' ' + styles.fullWidth}>
                <p style={{ color: 'red' }}>{submissionError}</p>
              </div>
            )}
            
            {submitSuccess && (
              <div className={styles.formGroup + ' ' + styles.fullWidth}>
                <p style={{ color: 'green' }}>Suggestion submitted successfully!</p>
              </div>
            )}
            
            <div className={styles.buttonContainer}>
              <button type="submit" disabled={submitting}>
                {submitting ? 'Submitting...' : 'Submit Suggestion'}
              </button>
            </div>
          </form>
        )}
      </div>
      
      {loading ? (
        <div className={styles.loadingContainer}>
          Loading suggestions...
        </div>
      ) : error ? (
        <div className={styles.errorContainer}>
          {error}
        </div>
      ) : suggestions.length === 0 ? (
        <div className={styles.errorContainer}>
          No suggestions found. Be the first to suggest a song!
        </div>
      ) : (
        <div className={styles.suggestionsList}>
          {suggestions.map(suggestion => (
            <div key={suggestion.suggestionId} className={styles.suggestionCard}>
              <div className={styles.cardHeader}>
                <h4>{suggestion.songName}</h4>
                <h5>by {suggestion.artist}</h5>
              </div>
              
              <div className={styles.cardDetails}>
                {suggestion.genre && (
                  <span className={`${styles.tag} ${styles.genre}`}>{suggestion.genre}</span>
                )}
                
                {suggestion.language && (
                  <span className={`${styles.tag} ${styles.language}`}>
                    {languageOptions.find(l => l.value === suggestion.language)?.label || suggestion.language}
                  </span>
                )}
                
                {suggestion.status && (
                  <span className={`${styles.tag} ${styles.status} ${styles[suggestion.status]}`}>
                    {suggestion.status.charAt(0).toUpperCase() + suggestion.status.slice(1)}
                  </span>
                )}
              </div>
              
              {suggestion.youtubeUrl && (
                <a 
                  href={suggestion.youtubeUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className={styles.youtubeLink}
                >
                  Watch on YouTube
                </a>
              )}
              
              <div className={styles.cardActions}>
                <span className={styles.date}>
                  {formatDate(suggestion.dateCreated)}
                </span>
                
                <div className={styles.actionButtons}>
                  <button 
                    className={`${styles.upvoteButton} ${suggestion.userHasUpvoted ? styles.active : ''}`}
                    onClick={() => handleUpvote(suggestion.suggestionId)}
                    title={isAuthenticated ? 'Upvote this suggestion' : 'Log in to upvote'}
                  >
                    <BxsUpvote />
                    <span>{suggestion.upvotes}</span>
                  </button>
                  
                  {isAdmin && isAdmin(user?.email) && (
                    <button 
                      className={styles.deleteButton}
                      onClick={() => handleDelete(suggestion.suggestionId)}
                      title="Delete this suggestion"
                    >
                      <MaterialSymbolsDeleteOutlineSharp />
                    </button>
                  )}
                </div>
              </div>
              
              {isAdmin && isAdmin(user?.email) && (
                <div className={styles.adminActions}>
                  <select 
                    value={suggestion.status || 'pending'}
                    onChange={(e) => handleStatusChange(suggestion.suggestionId, e.target.value)}
                  >
                    <option value="pending">Pending</option>
                    <option value="approved">Approved</option>
                    <option value="rejected">Rejected</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Suggestions;