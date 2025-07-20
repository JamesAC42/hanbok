'use client';
import { useState, useEffect } from 'react';
import styles from '@/styles/components/admin.module.scss';

const EditUserModal = ({ user, onClose, onUserUpdated }) => {
    const [formData, setFormData] = useState({
        tier: user.tier || 0,
        maxSavedSentences: user.maxSavedSentences || '',
        maxSavedWords: user.maxSavedWords || '',
        remainingImageExtracts: user.remainingImageExtracts || '',
        remainingSentenceAnalyses: user.remainingSentenceAnalyses || '',
        verified: Boolean(user.verified),
        hasUsedFreeTrial: Boolean(user.hasUsedFreeTrial),
        remainingAudioGenerations: user.remainingAudioGenerations || ''
    });
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    
    // Handle input changes
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
        setError(null);
        setSuccess(false);
    };
    
    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            setLoading(true);
            setError(null);
            
            // Prepare data for submission
            const submitData = {};
            
            // Only include fields that have values (not empty strings)
            Object.keys(formData).forEach(key => {
                const value = formData[key];
                if (key === 'verified' || key === 'hasUsedFreeTrial') {
                    // Boolean fields
                    submitData[key] = Boolean(value);
                } else if (key === 'tier') {
                    // Tier is required
                    submitData[key] = parseInt(value);
                } else if (value !== '' && value !== null && value !== undefined) {
                    // Numeric fields - only include if not empty
                    const numValue = parseInt(value);
                    if (!isNaN(numValue)) {
                        submitData[key] = numValue;
                    }
                }
            });
            
            const response = await fetch(`/api/admin/users/${user.userId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submitData),
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to update user');
            }
            
            const data = await response.json();
            
            if (data.success) {
                setSuccess(true);
                setTimeout(() => {
                    onUserUpdated(data.user);
                }, 1000);
            } else {
                throw new Error(data.error || 'Unknown error');
            }
            
        } catch (err) {
            console.error('Error updating user:', err);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };
    
    // Handle modal click outside
    const handleModalClick = (e) => {
        if (e.target === e.currentTarget) {
            onClose();
        }
    };
    
    // Format date for display
    const formatDate = (dateString) => {
        if (!dateString) return 'N/A';
        return new Date(dateString).toLocaleString();
    };
    
    return (
        <div className={styles.modalOverlay} onClick={handleModalClick}>
            <div className={styles.modalContent}>
                <div className={styles.modalHeader}>
                    <h3>Edit User</h3>
                    <button 
                        className={styles.closeButton}
                        onClick={onClose}
                    >
                        ×
                    </button>
                </div>
                
                <div className={styles.modalBody}>
                    {/* User info display */}
                    <div className={styles.userInfo}>
                        <div className={styles.userInfoGrid}>
                            <div className={styles.userInfoItem}>
                                <strong>ID:</strong> {user.userId}
                            </div>
                            <div className={styles.userInfoItem}>
                                <strong>Name:</strong> {user.name}
                            </div>
                            <div className={styles.userInfoItem}>
                                <strong>Email:</strong> {user.email}
                            </div>
                            <div className={styles.userInfoItem}>
                                <strong>Created:</strong> {formatDate(user.dateCreated)}
                            </div>
                            <div className={styles.userInfoItem}>
                                <strong>Google ID:</strong> {user.googleId || 'N/A'}
                            </div>
                        </div>
                    </div>
                    
                    {/* Edit form */}
                    <form onSubmit={handleSubmit} className={styles.editForm}>
                        <div className={styles.formGrid}>
                            <div className={styles.formGroup}>
                                <label htmlFor="tier">Tier:</label>
                                <select
                                    id="tier"
                                    value={formData.tier}
                                    onChange={(e) => handleInputChange('tier', parseInt(e.target.value))}
                                    required
                                >
                                    <option value={0}>Free</option>
                                    <option value={1}>Basic</option>
                                    <option value={2}>Plus</option>
                                </select>
                            </div>
                            
                            <div className={styles.formGroup}>
                                <label htmlFor="verified">Verified:</label>
                                <input
                                    type="checkbox"
                                    id="verified"
                                    checked={formData.verified}
                                    onChange={(e) => handleInputChange('verified', e.target.checked)}
                                    className={styles.checkbox}
                                />
                            </div>
                            
                            <div className={styles.formGroup}>
                                <label htmlFor="hasUsedFreeTrial">Has Used Free Trial:</label>
                                <input
                                    type="checkbox"
                                    id="hasUsedFreeTrial"
                                    checked={formData.hasUsedFreeTrial}
                                    onChange={(e) => handleInputChange('hasUsedFreeTrial', e.target.checked)}
                                    className={styles.checkbox}
                                />
                            </div>
                            
                            <div className={styles.formGroup}>
                                <label htmlFor="maxSavedSentences">Max Saved Sentences:</label>
                                <input
                                    type="number"
                                    id="maxSavedSentences"
                                    value={formData.maxSavedSentences}
                                    onChange={(e) => handleInputChange('maxSavedSentences', e.target.value)}
                                    placeholder="Leave empty for unlimited"
                                    min="0"
                                />
                            </div>
                            
                            <div className={styles.formGroup}>
                                <label htmlFor="maxSavedWords">Max Saved Words:</label>
                                <input
                                    type="number"
                                    id="maxSavedWords"
                                    value={formData.maxSavedWords}
                                    onChange={(e) => handleInputChange('maxSavedWords', e.target.value)}
                                    placeholder="Leave empty for unlimited"
                                    min="0"
                                />
                            </div>
                            
                            <div className={styles.formGroup}>
                                <label htmlFor="remainingAudioGenerations">Remaining Audio Generations:</label>
                                <input
                                    type="number"
                                    id="remainingAudioGenerations"
                                    value={formData.remainingAudioGenerations}
                                    onChange={(e) => handleInputChange('remainingAudioGenerations', e.target.value)}
                                    placeholder="Leave empty for unlimited"
                                    min="0"
                                />
                            </div>
                            
                            <div className={styles.formGroup}>
                                <label htmlFor="remainingImageExtracts">Remaining Image Extracts:</label>
                                <input
                                    type="number"
                                    id="remainingImageExtracts"
                                    value={formData.remainingImageExtracts}
                                    onChange={(e) => handleInputChange('remainingImageExtracts', e.target.value)}
                                    placeholder="Leave empty for unlimited"
                                    min="0"
                                />
                            </div>
                            
                            <div className={styles.formGroup}>
                                <label htmlFor="remainingSentenceAnalyses">Remaining Sentence Analyses:</label>
                                <input
                                    type="number"
                                    id="remainingSentenceAnalyses"
                                    value={formData.remainingSentenceAnalyses}
                                    onChange={(e) => handleInputChange('remainingSentenceAnalyses', e.target.value)}
                                    placeholder="Leave empty for unlimited"
                                    min="0"
                                />
                            </div>
                        </div>
                        
                        {error && (
                            <div className={styles.error}>
                                {error}
                            </div>
                        )}
                        
                        {success && (
                            <div className={styles.success}>
                                User updated successfully!
                            </div>
                        )}
                        
                        <div className={styles.formActions}>
                            <button 
                                type="button" 
                                onClick={onClose}
                                className={styles.cancelButton}
                                disabled={loading}
                            >
                                Cancel
                            </button>
                            <button 
                                type="submit"
                                className={styles.saveButton}
                                disabled={loading}
                            >
                                {loading ? 'Saving...' : 'Save Changes'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default EditUserModal; 