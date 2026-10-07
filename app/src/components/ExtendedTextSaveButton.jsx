'use client';
import { useEffect, useState } from 'react';
import { MaterialSymbolsBookmarkOutlineSharp } from '@/components/icons/BookmarkOutline';
import { MaterialSymbolsBookmarkSharp } from '@/components/icons/Bookmark';
import styles from '@/styles/components/sentenceanalyzer/savebutton.module.scss';
import { useAuth } from '@/contexts/AuthContext';
import { usePopup } from '@/contexts/PopupContext';
import { useLanguage } from '@/contexts/LanguageContext';
import FolderPicker from '@/components/library/FolderPicker';
import { fetchFolders } from '@/lib/libraryFolders';

const ExtendedTextSaveButton = ({ textId }) => {
    const [isSaved, setIsSaved] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    // After saving, people who use folders get asked where to file it.
    const [offerFolders, setOfferFolders] = useState(null);
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

    const offerFolderChoice = async () => {
        try {
            const { folders } = await fetchFolders();
            if (folders.length > 0) setOfferFolders(folders);
        } catch {
            // Folders are optional; the save itself already worked.
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
                if (!isSaved) offerFolderChoice();
                else setOfferFolders(null);
            }
        } catch (error) {
            console.error('Error toggling extended text save:', error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <span className={styles.wrap}>
            <button
                className={`${styles.saveButton} ${isSaved ? styles.saved : ''} ${isLoading ? styles.loading : ''}`}
                onClick={toggleSave}
                disabled={isLoading}
                title={isSaved ? t('extended_text.saveButtonRemove') || t('analysis.saveButton.remove') : t('extended_text.saveButtonSave') || t('analysis.saveButton.save')}
                aria-label={isSaved ? t('extended_text.saveButtonRemove') || t('analysis.saveButton.remove') : t('extended_text.saveButtonSave') || t('analysis.saveButton.save')}
                aria-pressed={isSaved}
            >
                {isSaved ? <MaterialSymbolsBookmarkSharp /> : <MaterialSymbolsBookmarkOutlineSharp />}
            </button>
            {offerFolders && (
                <FolderPicker
                    type="extended_text"
                    itemId={textId}
                    heading="Saved. Add it to a folder?"
                    folders={offerFolders}
                    onClose={() => setOfferFolders(null)}
                />
            )}
        </span>
    );
};

export default ExtendedTextSaveButton;
