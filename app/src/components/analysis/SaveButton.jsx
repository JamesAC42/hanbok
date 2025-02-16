'use client';
import { useState, useEffect } from 'react';
import { MaterialSymbolsBookmarkOutlineSharp } from '@/components/icons/BookmarkOutline';
import { MaterialSymbolsBookmarkSharp } from '@/components/icons/Bookmark';
import styles from '@/styles/components/sentenceanalyzer/savebutton.module.scss';
import { useAuth } from '@/contexts/AuthContext';
import { usePopup } from '@/contexts/PopupContext';

const SaveButton = ({ sentenceId }) => {
    const [isSaved, setIsSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { isAuthenticated } = useAuth();
    const { showLimitReachedPopup, showLoginRequiredPopup } = usePopup();

    useEffect(() => {
        if (sentenceId && isAuthenticated) {
            checkSavedStatus();
        } else {
            setIsLoading(false);
        }
    }, [sentenceId, isAuthenticated]);

    const checkSavedStatus = async () => {
        try {
            const response = await fetch(`/api/sentences/${sentenceId}/saved`);
            const data = await response.json();
            if (data.success) {
                setIsSaved(data.isSaved);
            }
        } catch (error) {
            console.error('Error checking saved status:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleSave = async (event) => {
        if (!isAuthenticated) {
            showLoginRequiredPopup('sentences');
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch(`/api/sentences/${sentenceId}/save`, {
                method: isSaved ? 'DELETE' : 'POST'
            });
            const data = await response.json();

            if (data.reachedLimit) {
                showLimitReachedPopup('sentences');
                return;
            }

            if (data.success) {
                setIsSaved(!isSaved);
            }
        } catch (error) {
            console.error('Error toggling save:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button 
            className={`${styles.saveButton} ${isSaved ? styles.saved : ''} ${isLoading ? styles.loading : ''}`}
            onClick={toggleSave}
            disabled={isLoading}
            title={isSaved ? "Remove from saved" : "Save sentence"}
        >
            {isSaved ? <MaterialSymbolsBookmarkSharp /> : <MaterialSymbolsBookmarkOutlineSharp />}
        </button>
    );
};

export default SaveButton;