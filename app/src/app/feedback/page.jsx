'use client';

import { useState, useEffect } from 'react';
import styles from '@/styles/components/pagelayout.module.scss';
import feedbackStyles from '@/styles/components/feedback.module.scss';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import Link from 'next/link';
import { MingcuteCommentFill } from '@/components/icons/CommentFill';
import ContentPage from '@/components/ContentPage';

// Move FeedbackItem outside the main component
const FeedbackItem = ({ 
    item, 
    level = 0, 
    onReply, 
    onDelete, 
    replyingTo,
    replyText,
    onReplyTextChange,
    onSubmitReply,
    onCancelReply,
    formatDate,
    isAuthenticated,
    userId,
    t
}) => {
    const isOwnComment = userId === item.userId;

    return (
        <div className={`${feedbackStyles.feedbackItem} ${isOwnComment ? feedbackStyles.ownComment : ''}`} 
        >
            <div className={feedbackStyles.feedbackHeader}>
                <span className={feedbackStyles.userName}>
                    {item.userName}
                    {isOwnComment && <span className={feedbackStyles.youBadge}>{t('feedback.youBadge')}</span>}
                </span>
                <span className={feedbackStyles.date}>{formatDate(item.dateCreated)}</span>
            </div>
            <div className={feedbackStyles.feedbackText}>{item.text}</div>
            <div className={feedbackStyles.feedbackActions}>
                {isAuthenticated && !item.isDeleted && (
                    <>
                        <button 
                            onClick={() => onReply(item.feedbackId)}
                            className={feedbackStyles.actionButton}
                        >
                            {t('feedback.actions.reply')}
                        </button>
                        {userId === item.userId && (
                            <button 
                                onClick={() => onDelete(item.feedbackId)}
                                className={`${feedbackStyles.actionButton} ${feedbackStyles.delete}`}
                            >
                                {t('feedback.actions.delete')}
                            </button>
                        )}
                    </>
                )}
            </div>
            {replyingTo === item.feedbackId && (
                <form onSubmit={(e) => onSubmitReply(e, item.feedbackId)} className={feedbackStyles.replyForm}>
                    <textarea
                        value={replyText}
                        onChange={(e) => onReplyTextChange(e.target.value)}
                        placeholder={t('feedback.replyPlaceholder')}
                    />
                    <div className={feedbackStyles.formActions}>
                        <button type="submit">{t('feedback.actions.submit')}</button>
                        <button type="button" onClick={onCancelReply}>{t('feedback.actions.cancel')}</button>
                    </div>
                </form>
            )}
            {item.replies?.map((reply) => (
                <FeedbackItem 
                    key={reply.feedbackId} 
                    item={reply} 
                    level={level + 1}
                    onReply={onReply}
                    onDelete={onDelete}
                    replyingTo={replyingTo}
                    replyText={replyText}
                    onReplyTextChange={onReplyTextChange}
                    onSubmitReply={onSubmitReply}
                    onCancelReply={onCancelReply}
                    formatDate={formatDate}
                    isAuthenticated={isAuthenticated}
                    userId={userId}
                    t={t}
                />
            ))}
        </div>
    );
};

const Feedback = () => {
    const { t } = useLanguage();
    const [feedback, setFeedback] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newComment, setNewComment] = useState('');
    const [replyText, setReplyText] = useState('');
    const [replyingTo, setReplyingTo] = useState(null);
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const { user, isAuthenticated } = useAuth();

    const fetchFeedback = async () => {
        try {
            const response = await fetch(`/api/feedback?page=${page}&limit=20`);
            const data = await response.json();
            
            if (data.success) {
                setFeedback(data.feedback);
                setTotalPages(data.totalPages);
            } else {
                throw new Error(data.error);
            }
        } catch (err) {
            setError(t('feedback.errors.loadFailed'));
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedback();
        document.title = t('feedback.pageTitle');
    }, [page, t]);

    const handleSubmit = async (e, parentId = null) => {
        e.preventDefault();
        const text = parentId ? replyText : newComment;
        
        if (!text || !text.trim()) return;

        try {
            const response = await fetch('/api/feedback', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    text,
                    parentId
                }),
                credentials: 'include'
            });

            const data = await response.json();
            
            if (data.success) {
                await fetchFeedback();
                setNewComment('');
                setReplyText('');
                setReplyingTo(null);
            } else {
                setError(t('feedback.errors.submitFailed'));
                setTimeout(() => setError(null), 5000);
            }
        } catch (err) {
            console.error('Failed to submit feedback:', err);
            setError(t('feedback.errors.submitFailed'));
            setTimeout(() => setError(null), 5000);
        }
    };

    const handleDelete = async (feedbackId) => {
        try {
            const response = await fetch(`/api/feedback/${feedbackId}`, {
                method: 'DELETE',
                credentials: 'include'
            });

            if (response.ok) {
                await fetchFeedback();
            } else {
                setError(t('feedback.errors.deleteFailed'));
                setTimeout(() => setError(null), 5000);
            }
        } catch (err) {
            console.error('Failed to delete feedback:', err);
            setError(t('feedback.errors.deleteFailed'));
            setTimeout(() => setError(null), 5000);
        }
    };

    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: 'numeric',
            minute: 'numeric',
            hour12: true
        });
    };

    const handleReplyTextChange = (text) => {
        setReplyText(text);
    };

    const handleCancelReply = () => {
        setReplyingTo(null);
        setReplyText('');
    };

    return (
        <ContentPage>
            <div className={styles.pageContainer}>
                <div className={styles.pageContent}>
                    <div className={feedbackStyles.feedbackContent}>
                        <h1 className={styles.pageTitle}>{t('feedback.title')}</h1>

                        <p>{t('feedback.description')}</p>
                        
                        {isAuthenticated ? (
                            <form onSubmit={(e) => handleSubmit(e)} className={feedbackStyles.newFeedbackForm}>
                                <textarea
                                    value={newComment}
                                    onChange={(e) => setNewComment(e.target.value)}
                                    placeholder={t('feedback.submitPlaceholder')}
                                />
                                <button type="submit">{t('feedback.submitButton')}</button>
                            </form>
                        ) : (
                            <div className={feedbackStyles.loginPrompt}>
                                {t('feedback.loginPrompt')} <Link href="/login">log in</Link>
                            </div>
                        )}
                        
                        {error && <div className={feedbackStyles.error}>{error}</div>}

                        {loading ? (
                            <div className={feedbackStyles.loading}>{t('feedback.loading')}</div>
                        ) : feedback.length === 0 ? (
                            <div className={feedbackStyles.emptyState}>
                                <MingcuteCommentFill />
                                <p>{t('feedback.emptyState')}</p>
                            </div>
                        ) : (
                            <div className={feedbackStyles.feedbackList}>
                                {feedback.map((item) => (
                                    <FeedbackItem 
                                        key={item.feedbackId} 
                                        item={item}
                                        onReply={setReplyingTo}
                                        onDelete={handleDelete}
                                        replyingTo={replyingTo}
                                        replyText={replyText}
                                        onReplyTextChange={handleReplyTextChange}
                                        onSubmitReply={handleSubmit}
                                        onCancelReply={handleCancelReply}
                                        formatDate={formatDate}
                                        isAuthenticated={isAuthenticated}
                                        userId={user?.userId}
                                        t={t}
                                    />
                                ))}
                            </div>
                        )}

                        {totalPages > 1 && (
                            <div className={feedbackStyles.pagination}>
                                <button 
                                    onClick={() => setPage(p => Math.max(1, p - 1))}
                                    disabled={page === 1}
                                >
                                    {t('feedback.actions.previous')}
                                </button>
                                <span>
                                    {t('feedback.pagination.page').replace('{current}', page).replace('{total}', totalPages)}
                                </span>
                                <button 
                                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                    disabled={page === totalPages}
                                >
                                    {t('feedback.actions.next')}
                                </button>
                            </div>
                        )}
                    </div>
                    <div className={feedbackStyles.girl}>
                        <Image
                            src="/images/hanbokgirl.png"
                            alt="girl"
                            width={1024}
                            height={1536}
                            priority
                        />
                    </div>
                </div>
            </div>
        </ContentPage>
    );
};

export default Feedback;
