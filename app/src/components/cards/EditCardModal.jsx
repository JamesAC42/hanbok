'use client';
import { useState, useEffect } from 'react';
import styles from '@/styles/components/editCardModal.module.scss';
import { useLanguage } from '@/contexts/LanguageContext';
import { MaterialSymbolsCancel } from '@/components/icons/Close';

const EditCardModal = ({ card, isOpen, onClose, onSave, onDelete, deckId, mode = 'edit' }) => {
    const { t } = useLanguage();
    const [front, setFront] = useState('');
    const [back, setBack] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState(null);

    const isCreateMode = mode === 'create';

    // Update form values when card changes or when switching to create mode
    useEffect(() => {
        if (isCreateMode) {
            setFront('');
            setBack('');
            setError(null);
        } else if (card) {
            setFront(card.customFront || card.content?.originalWord || '');
            setBack(card.customBack || card.content?.translatedWord || '');
            setError(null);
        }
    }, [card, isCreateMode]);

    if (!isOpen) return null;

    const handleSave = async () => {
        if (!front.trim() || !back.trim()) {
            setError(t('cards.editModal.fieldsRequired'));
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            let response, data;

            if (isCreateMode) {
                // Create new card
                response = await fetch(`/api/decks/${deckId}/cards`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        front: front.trim(),
                        back: back.trim(),
                    }),
                });
                data = await response.json();

                if (data.success) {
                    onSave(data.card);
                    onClose();
                } else {
                    setError(data.error || t('cards.editModal.createError'));
                }
            } else {
                // Update existing card
                response = await fetch(`/api/decks/${deckId}/cards/${card.flashcardId}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        action: 'update',
                        customFront: front.trim(),
                        customBack: back.trim(),
                    }),
                });
                data = await response.json();

                if (data.success) {
                    onSave({
                        customFront: front.trim(),
                        customBack: back.trim()
                    });
                    onClose();
                } else {
                    setError(data.error || t('cards.editModal.saveError'));
                }
            }
        } catch (err) {
            console.error('Error saving card:', err);
            setError(isCreateMode ? t('cards.editModal.createError') : t('cards.editModal.saveError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm(t('cards.editModal.confirmDelete'))) {
            return;
        }

        setIsSubmitting(true);
        setError(null);

        try {
            const response = await fetch(`/api/decks/${deckId}/cards/${card.flashcardId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: 'delete',
                }),
            });

            const data = await response.json();

            if (data.success) {
                onDelete(card.flashcardId);
                onClose();
            } else {
                setError(data.error || t('cards.editModal.deleteError'));
            }
        } catch (err) {
            console.error('Error deleting card:', err);
            setError(t('cards.editModal.deleteError'));
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCancel = () => {
        setError(null);
        onClose();
    };

    return (
        <div className={styles.modalOverlay} onClick={handleCancel}>
            <div className={styles.modal} onClick={(e) => e.stopPropagation()}>
                <div className={styles.modalHeader}>
                    <h3>{isCreateMode ? t('cards.editModal.createTitle') : t('cards.editModal.title')}</h3>
                    <button 
                        className={styles.closeButton}
                        onClick={handleCancel}
                        aria-label={t('common.close')}
                    >
                        <MaterialSymbolsCancel />
                    </button>
                </div>

                <div className={styles.modalBody}>
                    {error && (
                        <div className={styles.error}>
                            {error}
                        </div>
                    )}

                    <div className={styles.fieldGroup}>
                        <label htmlFor="front">{t('cards.front')}</label>
                        <textarea
                            id="front"
                            value={front}
                            onChange={(e) => setFront(e.target.value)}
                            placeholder={t('cards.editModal.frontPlaceholder')}
                            disabled={isSubmitting}
                            rows={3}
                        />
                    </div>

                    <div className={styles.fieldGroup}>
                        <label htmlFor="back">{t('cards.back')}</label>
                        <textarea
                            id="back"
                            value={back}
                            onChange={(e) => setBack(e.target.value)}
                            placeholder={t('cards.editModal.backPlaceholder')}
                            disabled={isSubmitting}
                            rows={3}
                        />
                    </div>
                </div>

                <div className={styles.modalFooter}>
                    {!isCreateMode && (
                        <button
                            className={styles.deleteButton}
                            onClick={handleDelete}
                            disabled={isSubmitting}
                        >
                            {t('common.delete')}
                        </button>
                    )}
                    
                    <div className={styles.actionButtons}>
                        <button
                            className={styles.cancelButton}
                            onClick={handleCancel}
                            disabled={isSubmitting}
                        >
                            {t('common.cancel')}
                        </button>
                        
                        <button
                            className={styles.saveButton}
                            onClick={handleSave}
                            disabled={isSubmitting || !front.trim() || !back.trim()}
                        >
                            {isSubmitting ? t('common.saving') : (isCreateMode ? t('cards.editModal.create') : t('common.save'))}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default EditCardModal; 