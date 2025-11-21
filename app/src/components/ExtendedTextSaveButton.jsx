'use client';
import { useEffect, useState } from 'react';
import { MaterialSymbolsBookmarkOutlineSharp } from '@/components/icons/BookmarkOutline';
import { MaterialSymbolsBookmarkSharp } from '@/components/icons/Bookmark';
import styles from '@/styles/components/sentenceanalyzer/savebutton.module.scss';
import { useAuth } from '@/contexts/AuthContext';
import { usePopup } from '@/contexts/PopupContext';
import { useLanguage } from '@/contexts/LanguageContext';

const ExtendedTextSaveButton = ({ textId }) => {
    const [isSaved, setIsSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const { isAuthenticated } = useAuth();
    const { showLimitReachedPopup, showLoginRequiredPopup } = usePopup();
    const { t } = useLanguage();

    useEffect(() => {
        if (textId && isAuthenticated) {
            checkSavedStatus();
        } else {
            setIsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [textId, isAuthenticated]);

    const checkSavedStatus = async () => {
        try {
            const response = await fetch(`/api/extended-text/${textId}/saved`);
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

    const toggleSave = async () => {
        if (!isAuthenticated) {
            showLoginRequiredPopup('extended texts');
            return;
        }

        try {
            setIsLoading(true);
            const response = await fetch(`/api/extended-text/${textId}/save`, {
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
            console.error('Error toggling extended text save:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <button
            className={`${styles.saveButton} ${isSaved ? styles.saved : ''} ${isLoading ? styles.loading : ''}`}
            onClick={toggleSave}
            disabled={isLoading}
            title={isSaved ? t('extended_text.saveButtonRemove') || t('analysis.saveButton.remove') : t('extended_text.saveButtonSave') || t('analysis.saveButton.save')}
        >
            {isSaved ? <MaterialSymbolsBookmarkSharp /> : <MaterialSymbolsBookmarkOutlineSharp />}
        </button>
    );
};

export default ExtendedTextSaveButton;
