'use client';

import { useState, useEffect } from 'react';
import styles from '@/styles/components/pagelayout.module.scss';
import feedbackStyles from '@/styles/components/feedback.module.scss';
import Image from 'next/image';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { MingcuteCommentFill } from '@/components/icons/CommentFill';

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
    userId 
}) => {
    const isOwnComment = userId === item.userId;

    return (
        <div className={`${feedbackStyles.feedbackItem} ${isOwnComment ? feedbackStyles.ownComment : ''}`} 
        >
            <div className={feedbackStyles.feedbackHeader}>
                <span className={feedbackStyles.userName}>
                    {item.userName}
                    {isOwnComment && <span className={feedbackStyles.youBadge}>You</span>}
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
                            Reply
                        </button>
                        {userId === item.userId && (
                            <button 
                                onClick={() => onDelete(item.feedbackId)}
                                className={`${feedbackStyles.actionButton} ${feedbackStyles.delete}`}
                            >
                                Delete
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
                        placeholder="Write a reply..."
                    />
                    <div className={feedbackStyles.formActions}>
                        <button type="submit">Submit</button>
                        <button type="button" onClick={onCancelReply}>Cancel</button>
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
                />
            ))}
        </div>
    );
};

const Feedback = () => {
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
            setError('Failed to load feedback');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFeedback();
    }, [page]);

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
                setError(data.error);
                setTimeout(() => setError(null), 5000);
            }
        } catch (err) {
            console.error('Failed to submit feedback:', err);
            setError('Failed to submit feedback. Please try again.');
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
            }
        } catch (err) {
            console.error('Failed to delete feedback:', err);
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
        <div className={styles.pageContainer}>
            <div className={styles.pageContent}>
                <div className={feedbackStyles.feedbackContent}>
                    <h1 className={styles.pageTitle}>Feedback Forum</h1>

                    <p>
                        Please share your feedback and suggestions with us. We value your input and are always looking for ways to improve our service.
                    </p>
                    
                    {isAuthenticated ? (
                        <form onSubmit={(e) => handleSubmit(e)} className={feedbackStyles.newFeedbackForm}>
                            <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Share your thoughts or suggestions..."
                            />
                            <button type="submit">Submit Feedback</button>
                        </form>
                    ) : (
                        <div className={feedbackStyles.loginPrompt}>
                            Please <Link href="/login">log in</Link> to share your feedback
                        </div>
                    )}
                    
                    { error ? (
                        <div className={feedbackStyles.error}>{error}</div>
                    ) : null}

                    {loading ? (
                        <div className={feedbackStyles.loading}>Loading...</div>
                    ) : feedback.length === 0 ? (
                        <div className={feedbackStyles.emptyState}>
                            <MingcuteCommentFill />
                            <p>No comments yet. Be the first to share your thoughts!</p>
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
                                Previous
                            </button>
                            <span>Page {page} of {totalPages}</span>
                            <button 
                                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                                disabled={page === totalPages}
                            >
                                Next
                            </button>
                        </div>
                    )}
                </div>
            </div>
            <div className={styles.girlContainer}>
                <Image
                    src="/images/girl1.png"
                    alt="girl"
                    width={1920}
                    height={1080}
                    priority
                />
            </div>
        </div>
    );
};

export default Feedback;
