'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from '@/styles/pages/lyricsuggestions.module.scss';
import Link from 'next/link';
import { BxsUpvote } from '@/components/icons/Upvote';
import { MaterialSymbolsDeleteOutlineSharp } from '@/components/icons/Delete';
import ContentPage from '@/components/ContentPage';

import Footer from '@/components/Footer';

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
  const { t } = useLanguage();
  
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
    document.title = t('lyrics.suggestions.pageTitle');
  }, [t]);

  const fetchSuggestions = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/lyrics/suggestions');
      const data = await response.json();
      if (data.success) {
        setSuggestions(data.suggestions);
      } else {
        setError(t('lyrics.suggestions.errors.fetchFailed'));
      }
    } catch (err) {
      setError(t('lyrics.suggestions.errors.connectionError'));
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
        setSuggestions(prev => 
          prev.map(s => s.suggestionId === suggestionId ? { ...s, status } : s)
        );
      } else {
        console.error(t('lyrics.suggestions.errors.updateStatusFailed', { message: data.message }));
      }
    } catch (err) {
      console.error(t('lyrics.suggestions.errors.updateStatusFailed', { message: err.message }));
    }
  };

  const handleDelete = async (suggestionId) => {
    if (!isAdmin || !isAdmin(user?.email)) return;
    
    if (!confirm(t('lyrics.suggestions.card.deleteConfirm'))) return;
    
    try {
      const response = await fetch(`/api/admin/lyrics/suggestions/${suggestionId}`, {
        method: 'DELETE'
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSuggestions(prev => prev.filter(s => s.suggestionId !== suggestionId));
      }
    } catch (err) {
      console.error(t('lyrics.suggestions.errors.deleteFailed'));
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
    <ContentPage>
      <div className={styles.suggestionsPage}>
        <div className={styles.suggestionsHero}>
          <h1 className={styles.heroTitle}>{t('lyrics.suggestions.title')}</h1>
          <p className={styles.heroSubtitle}>{t('lyrics.suggestions.subtitle')}</p>
        </div>

        <div className={styles.suggestionsContainer}>
          {/* Suggestion Form */}
          <div className={styles.formSection}>
            <h2>{t('lyrics.suggestions.suggestSong')}</h2>
            
            {!isAuthenticated ? (
              <div className={styles.loginPrompt}>
                <p>{t('lyrics.suggestions.loginPrompt')}</p>
                <Link href="/login" className={styles.loginLink}>
                  {t('lyrics.suggestions.login')}
                </Link>
              </div>
            ) : (
              <form className={styles.form} onSubmit={handleSubmit}>
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="songName">{t('lyrics.suggestions.form.songName')} *</label>
                    <input
                      type="text"
                      id="songName"
                      name="songName"
                      value={formData.songName}
                      onChange={handleInputChange}
                      required
                      className={styles.formInput}
                    />
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="artist">{t('lyrics.suggestions.form.artist')} *</label>
                    <input
                      type="text"
                      id="artist"
                      name="artist"
                      value={formData.artist}
                      onChange={handleInputChange}
                      required
                      className={styles.formInput}
                    />
                  </div>
                </div>

                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label htmlFor="genre">{t('lyrics.suggestions.form.genre')}</label>
                    <select
                      id="genre"
                      name="genre"
                      value={formData.genre}
                      onChange={handleInputChange}
                      className={styles.formSelect}
                    >
                      <option value="">{t('common.select', { item: t('lyrics.suggestions.form.genre').toLowerCase() })}</option>
                      {genreOptions.map(genre => (
                        <option key={genre} value={genre}>{genre}</option>
                      ))}
                    </select>
                  </div>
                  
                  <div className={styles.formGroup}>
                    <label htmlFor="language">{t('lyrics.suggestions.form.language')}</label>
                    <select
                      id="language"
                      name="language"
                      value={formData.language}
                      onChange={handleInputChange}
                      className={styles.formSelect}
                    >
                      {languageOptions.map(option => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="youtubeUrl">{t('lyrics.suggestions.form.youtubeUrl')}</label>
                  <input
                    type="url"
                    id="youtubeUrl"
                    name="youtubeUrl"
                    value={formData.youtubeUrl}
                    onChange={handleInputChange}
                    placeholder={t('lyrics.suggestions.form.youtubeUrlPlaceholder')}
                    className={styles.formInput}
                  />
                </div>
                
                {submissionError && (
                  <div className={styles.errorMessage}>{submissionError}</div>
                )}
                
                {submitSuccess && (
                  <div className={styles.successMessage}>{t('lyrics.suggestions.form.submitSuccess')}</div>
                )}
                
                <button type="submit" disabled={submitting} className={styles.submitButton}>
                  {submitting ? t('lyrics.suggestions.form.submitting') : t('lyrics.suggestions.form.submit')}
                </button>
              </form>
            )}
          </div>
          
          {/* Suggestions List */}
          <div className={styles.suggestionsSection}>
            <h2>Community Suggestions</h2>
            
            {loading ? (
              <div className={styles.loading}>{t('lyrics.suggestions.status.loading')}</div>
            ) : error ? (
              <div className={styles.error}>{error}</div>
            ) : suggestions.length === 0 ? (
              <div className={styles.emptyState}>
                <p>{t('lyrics.suggestions.status.noSuggestions')}</p>
              </div>
            ) : (
              <div className={styles.suggestionsList}>
                {suggestions.map(suggestion => (
                  <div key={suggestion.suggestionId} className={styles.suggestionCard}>
                    <div className={styles.cardHeader}>
                      <h4>{suggestion.songName}</h4>
                      <span className={styles.artist}>{t('lyrics.suggestions.card.by')} {suggestion.artist}</span>
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
                        {t('lyrics.suggestions.status.watchOnYoutube')}
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
                          title={isAuthenticated ? t('lyrics.suggestions.status.upvoteTitle.loggedIn') : t('lyrics.suggestions.status.upvoteTitle.loggedOut')}
                        >
                          <BxsUpvote />
                          <span>{suggestion.upvotes}</span>
                        </button>
                        
                        {isAdmin && isAdmin(user?.email) && (
                          <button 
                            className={styles.deleteButton}
                            onClick={() => handleDelete(suggestion.suggestionId)}
                            title={t('lyrics.suggestions.status.deleteTitle')}
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
                          className={styles.statusSelect}
                        >
                          <option value="pending">{t('lyrics.suggestions.status.pending')}</option>
                          <option value="approved">{t('lyrics.suggestions.status.approved')}</option>
                          <option value="rejected">{t('lyrics.suggestions.status.rejected')}</option>
                          <option value="completed">{t('lyrics.suggestions.status.completed')}</option>
                        </select>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <Footer />
    </ContentPage>
  );
};

export default Suggestions;