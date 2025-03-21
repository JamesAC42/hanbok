import { useState, useEffect } from 'react';
import styles from '@/styles/components/decksettings.module.scss';
import { useLanguage } from '@/contexts/LanguageContext';

const DeckSettings = ({ deckId, onClose, onSettingsUpdated }) => {
  const { t } = useLanguage();
  const [settings, setSettings] = useState({
    newCardsPerDay: 20,
    reviewsPerDay: 100,
    learningSteps: [1, 10, 60, 1440]
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);
  const [learningStepsText, setLearningStepsText] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    async function fetchSettings() {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/api/decks/${deckId}/settings`);
        const data = await response.json();
        
        if (data.success) {
          setSettings(data.settings);
          setLearningStepsText(data.settings.learningSteps.join(', '));
        } else {
          setError(data.error || t('cards.settingsError'));
        }
      } catch (err) {
        console.error(err);
        setError(t('cards.settingsError'));
      } finally {
        setLoading(false);
      }
    }
    
    fetchSettings();
  }, [deckId, t]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    if (name === 'learningSteps') {
      setLearningStepsText(value);
    } else {
      setSettings({
        ...settings,
        [name]: parseInt(value, 10)
      });
    }
  };

  const toggleAdvancedSettings = () => {
    setShowAdvanced(!showAdvanced);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      setSaving(true);
      setError(null);
      setSuccess(false);
      
      // Parse learning steps
      let learningSteps = [];
      try {
        learningSteps = learningStepsText.split(',').map(step => {
          const parsed = parseInt(step.trim(), 10);
          if (isNaN(parsed) || parsed <= 0) {
            throw new Error('Invalid learning step');
          }
          return parsed;
        });
      } catch (err) {
        setError(t('cards.invalidLearningSteps'));
        setSaving(false);
        return;
      }
      
      const updatedSettings = {
        ...settings,
        learningSteps
      };
      
      const response = await fetch(`/api/decks/${deckId}/settings`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedSettings)
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSettings(data.settings);
        setLearningStepsText(data.settings.learningSteps.join(', '));
        setSuccess(true);
        
        // Call the onSettingsUpdated callback if provided
        if (typeof onSettingsUpdated === 'function') {
          onSettingsUpdated();
        }
        
        // Hide success message after 3 seconds
        setTimeout(() => {
          setSuccess(false);
        }, 3000);
      } else {
        setError(data.error || t('cards.settingsUpdateError'));
      }
    } catch (err) {
      console.error(err);
      setError(t('cards.settingsUpdateError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className={styles.settingsModal}>
        <div className={styles.settingsContent}>
          <div className={styles.settingsHeader}>
            <h2>{t('cards.deckSettings')}</h2>
            <button className={styles.closeButton} onClick={onClose}>×</button>
          </div>
          <div className={styles.settingsBody}>
            <p>{t('cards.loading')}</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.settingsModal}>
      <div className={styles.settingsContent}>
        <div className={styles.settingsHeader}>
          <h2>{t('cards.deckSettings')}</h2>
          <button className={styles.closeButton} onClick={onClose}>×</button>
        </div>
        
        <div className={styles.settingsBody}>
          {error && (
            <div className={styles.error}>{error}</div>
          )}
          
          {success && (
            <div className={styles.success}>{t('cards.settingsSaved')}</div>
          )}
          
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <label htmlFor="newCardsPerDay">{t('cards.newCardsPerDay')}</label>
              <input
                type="number"
                id="newCardsPerDay"
                name="newCardsPerDay"
                min="0"
                max="9999"
                value={settings.newCardsPerDay}
                onChange={handleInputChange}
                required
              />
              <p className={styles.helpText}>{t('cards.newCardsPerDayHelp')}</p>
            </div>
            
            <div className={styles.formGroup}>
              <label htmlFor="reviewsPerDay">{t('cards.reviewsPerDay')}</label>
              <input
                type="number"
                id="reviewsPerDay"
                name="reviewsPerDay"
                min="0"
                max="9999"
                value={settings.reviewsPerDay}
                onChange={handleInputChange}
                required
              />
              <p className={styles.helpText}>{t('cards.reviewsPerDayHelp')}</p>
            </div>
            
            <div className={styles.advancedToggle}>
              <button 
                type="button" 
                className={styles.advancedButton}
                onClick={toggleAdvancedSettings}
              >
                {showAdvanced ? t('cards.hideAdvanced') : t('cards.showAdvanced')}
                <span className={`${styles.chevron} ${showAdvanced ? styles.up : styles.down}`}>
                  ▼
                </span>
              </button>
            </div>
            
            {showAdvanced && (
              <div className={styles.advancedSettings}>
                <div className={styles.advancedHeader}>
                  <h3>{t('cards.advancedSettings')}</h3>
                  <p className={styles.advancedDescription}>
                    {t('cards.advancedSettingsDescription')}
                  </p>
                </div>
                
                <div className={styles.formGroup}>
                  <label htmlFor="learningSteps">{t('cards.learningSteps')}</label>
                  <input
                    type="text"
                    id="learningSteps"
                    name="learningSteps"
                    value={learningStepsText}
                    onChange={handleInputChange}
                    required
                  />
                  <p className={styles.helpText}>{t('cards.learningStepsHelp')}</p>
                  <div className={styles.infoBox}>
                    <h4>{t('cards.whatAreLearningSteps')}</h4>
                    <p>{t('cards.learningStepsExplanation1')}</p>
                    <p>{t('cards.learningStepsExplanation2')}</p>
                    <p>{t('cards.learningStepsExample')}</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className={styles.formActions}>
              <button 
                type="submit" 
                className={styles.saveButton}
                disabled={saving}
              >
                {saving ? t('cards.saving') : t('cards.saveSettings')}
              </button>
              <button 
                type="button" 
                className={styles.cancelButton}
                onClick={onClose}
              >
                {t('cards.cancel')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default DeckSettings; 