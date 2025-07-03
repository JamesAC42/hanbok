'use client';

import { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from '@/styles/components/LyricComments.module.scss';
import { MaterialSymbolsChatBubbleOutline } from '@/components/icons/ChatBubble';
import { MaterialSymbolsThumbUpOutline, MaterialSymbolsThumbUp } from '@/components/icons/ThumbUp';
import { MaterialSymbolsThumbDownOutline, MaterialSymbolsThumbDown } from '@/components/icons/ThumbDown';
import { MaterialSymbolsDelete } from '@/components/icons/Delete';

const LyricComments = ({ lyricId }) => {
    const { user } = useAuth();
    const { t } = useLanguage();
    const [comments, setComments] = useState([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [newComment, setNewComment] = useState('');
    const [rateLimitError, setRateLimitError] = useState('');
    const [votingComments, setVotingComments] = useState(new Set());
    const votingRef = useRef(new Set());

    useEffect(() => {
        fetchComments();
    }, [lyricId]);

    const fetchComments = async () => {
        try {
            setLoading(true);
            const response = await fetch(`/api/lyrics/${lyricId}/comments`, {
                credentials: 'include'
            });
            
            if (response.ok) {
                const data = await response.json();
                if (data.success) {
                    setComments(data.comments);
                }
            }
        } catch (error) {
            console.error('Error fetching comments:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmitComment = async (e) => {
        e.preventDefault();
        
        if (!user) {
            window.location.href = '/login';
            return;
        }

        if (!newComment.trim()) {
            return;
        }

        try {
            setSubmitting(true);
            setRateLimitError('');
            
            const response = await fetch(`/api/lyrics/${lyricId}/comments`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    content: newComment.trim()
                }),
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.success) {
                setComments([data.comment, ...comments]);
                setNewComment('');
                // Update the comment count in the parent page
                window.dispatchEvent(new CustomEvent('commentAdded', { detail: { lyricId } }));
            } else {
                if (response.status === 429) {
                    setRateLimitError(data.message);
                } else {
                    console.error('Error submitting comment:', data.message);
                }
            }
        } catch (error) {
            console.error('Error submitting comment:', error);
        } finally {
            setSubmitting(false);
        }
    };

    const handleVote = async (commentId, voteType) => {
        if (!user) {
            window.location.href = '/login';
            return;
        }

        // Prevent spam clicking - check both ref and state
        if (votingRef.current.has(commentId) || votingComments.has(commentId)) {
            return;
        }

        // Immediately add to both voting ref and state to prevent spam
        votingRef.current.add(commentId);
        setVotingComments(prev => new Set(prev).add(commentId));

        try {
            const response = await fetch(`/api/lyrics/comments/${commentId}/vote`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    voteType: voteType
                }),
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.success) {
                setComments(comments.map(comment => 
                    comment.commentId === commentId
                        ? {
                            ...comment,
                            upvotes: data.upvotes,
                            downvotes: data.downvotes,
                            userVote: data.userVote
                        }
                        : comment
                ));
            }
        } catch (error) {
            console.error('Error voting on comment:', error);
        } finally {
            // Remove from both voting ref and state
            votingRef.current.delete(commentId);
            setVotingComments(prev => {
                const newSet = new Set(prev);
                newSet.delete(commentId);
                return newSet;
            });
        }
    };

    const handleDeleteComment = async (commentId) => {
        if (!user) {
            return;
        }

        if (!confirm(t('lyrics.comments.confirmDelete', 'Are you sure you want to delete this comment?'))) {
            return;
        }

        try {
            const response = await fetch(`/api/lyrics/comments/${commentId}`, {
                method: 'DELETE',
                credentials: 'include'
            });
            
            const data = await response.json();
            
            if (data.success) {
                setComments(comments.filter(comment => comment.commentId !== commentId));
                // Update the comment count in the parent page
                window.dispatchEvent(new CustomEvent('commentDeleted', { detail: { lyricId } }));
            }
        } catch (error) {
            console.error('Error deleting comment:', error);
        }
    };

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    const getCharacterCount = () => {
        return newComment.length;
    };

    const isOverLimit = () => {
        return newComment.length > 1000;
    };

    return (
        <div className={styles.commentsSection}>
            <h3 className={styles.commentsTitle}>
                <MaterialSymbolsChatBubbleOutline />
                {t('lyrics.comments.title', 'Comments')} ({comments.length})
            </h3>

            {/* Comment Form */}
            {user ? (
                <form onSubmit={handleSubmitComment} className={styles.commentForm}>
                    <textarea
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        placeholder={t('lyrics.comments.placeholder', 'Share your thoughts about this song...')}
                        className={`${styles.commentInput} ${isOverLimit() ? styles.overLimit : ''}`}
                        disabled={submitting}
                        rows={3}
                    />
                    <div className={styles.commentFormFooter}>
                        <div className={styles.characterCount}>
                            <span className={isOverLimit() ? styles.overLimit : ''}>
                                {getCharacterCount()}/1000
                            </span>
                        </div>
                        <button
                            type="submit"
                            disabled={submitting || !newComment.trim() || isOverLimit()}
                            className={styles.submitButton}
                        >
                            {submitting ? t('lyrics.comments.submitting', 'Posting...') : t('lyrics.comments.submit', 'Post Comment')}
                        </button>
                    </div>
                    {rateLimitError && (
                        <div className={styles.rateLimitError}>
                            {rateLimitError}
                        </div>
                    )}
                </form>
            ) : (
                <div className={styles.loginPrompt}>
                    <p>{t('lyrics.comments.loginPrompt', 'Please log in to leave a comment')}</p>
                    <a href="/login" className={styles.loginButton}>
                        {t('lyrics.comments.loginButton', 'Sign In')}
                    </a>
                </div>
            )}

            {/* Comments List */}
            <div className={styles.commentsList}>
                {loading ? (
                    <div className={styles.loading}>
                        {t('lyrics.comments.loading', 'Loading comments...')}
                    </div>
                ) : comments.length === 0 ? (
                    <div className={styles.noComments}>
                        {t('lyrics.comments.noComments', 'No comments yet. Be the first to share your thoughts!')}
                    </div>
                ) : (
                    comments.map((comment) => (
                        <div key={comment.commentId} className={styles.comment}>
                            <div className={styles.commentHeader}>
                                <div className={styles.commentAuthor}>
                                    {comment.user.name}
                                </div>
                                <div className={styles.commentDate}>
                                    {formatDate(comment.dateCreated)}
                                </div>
                                {user && user.userId === comment.user.userId && (
                                    <button
                                        onClick={() => handleDeleteComment(comment.commentId)}
                                        className={styles.deleteButton}
                                        title={t('lyrics.comments.delete', 'Delete comment')}
                                    >
                                        <MaterialSymbolsDelete />
                                    </button>
                                )}
                            </div>
                            <div className={styles.commentContent}>
                                {comment.content}
                            </div>
                            <div className={styles.commentActions}>
                                <button
                                    onClick={() => handleVote(comment.commentId, 'upvote')}
                                    className={`${styles.voteButton} ${comment.userVote === 'upvote' ? styles.voted : ''}`}
                                    disabled={!user || votingComments.has(comment.commentId)}
                                    title={user ? t('lyrics.comments.upvote', 'Upvote') : t('lyrics.comments.loginToVote', 'Sign in to vote')}
                                >
                                    {comment.userVote === 'upvote' ? <MaterialSymbolsThumbUp /> : <MaterialSymbolsThumbUpOutline />}
                                    {comment.upvotes}
                                </button>
                                <button
                                    onClick={() => handleVote(comment.commentId, 'downvote')}
                                    className={`${styles.voteButton} ${comment.userVote === 'downvote' ? styles.voted : ''}`}
                                    disabled={!user || votingComments.has(comment.commentId)}
                                    title={user ? t('lyrics.comments.downvote', 'Downvote') : t('lyrics.comments.loginToVote', 'Sign in to vote')}
                                >
                                    {comment.userVote === 'downvote' ? <MaterialSymbolsThumbDown /> : <MaterialSymbolsThumbDownOutline />}
                                    {comment.downvotes}
                                </button>
                            </div>
                        </div>
                    ))
                )}
            </div>
        </div>
    );
};

export default LyricComments; 