import { useState, useEffect } from 'react';
import styles from '@/styles/components/typing/statsdisplay.module.scss';

export default function StatsDisplay({ 
    wpm, 
    accuracy, 
    errors, 
    isActive, 
    startTime, 
    mode,
    isCompleted,
    endTime 
}) {
    const [currentTime, setCurrentTime] = useState(0);
    
    useEffect(() => {
        let interval;
        
        if (isActive && startTime) {
            interval = setInterval(() => {
                setCurrentTime(Math.floor((Date.now() - startTime) / 1000));
            }, 100);
        } else if (isCompleted && startTime && endTime) {
            // Show final time for completed paragraphs
            setCurrentTime(Math.floor((endTime - startTime) / 1000));
        } else if (!isActive && !isCompleted) {
            setCurrentTime(0);
        }
        
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [isActive, startTime, isCompleted, endTime]);
    
    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    };
    
    const getAccuracyColor = (accuracy) => {
        if (accuracy >= 95) return styles.excellent;
        if (accuracy >= 85) return styles.good;
        if (accuracy >= 70) return styles.okay;
        return styles.poor;
    };
    
    const getWPMColor = (wpm) => {
        if (wpm >= 40) return styles.excellent;
        if (wpm >= 30) return styles.good;
        if (wpm >= 20) return styles.okay;
        return styles.poor;
    };
    
    return (
        <div className={styles.statsDisplay}>
            <h3 className={styles.title}>Performance Stats</h3>
            
            <div className={styles.statsGrid}>
                {/* Live Timer - only for paragraph mode */}
                {mode === 'paragraph' && (
                    <div className={styles.statItem}>
                        <div className={styles.statLabel}>Time</div>
                        <div className={`${styles.statValue} ${isActive ? styles.active : ''}`}>
                            {formatTime(currentTime)}
                        </div>
                    </div>
                )}
                
                {/* WPM - only for paragraph mode */}
                {mode === 'paragraph' && (
                    <div className={styles.statItem}>
                        <div className={styles.statLabel}>WPM</div>
                        <div className={`${styles.statValue} ${getWPMColor(wpm)}`}>
                            {wpm}
                        </div>
                    </div>
                )}
                
                {/* Accuracy */}
                <div className={styles.statItem}>
                    <div className={styles.statLabel}>Accuracy</div>
                    <div className={`${styles.statValue} ${getAccuracyColor(accuracy)}`}>
                        {accuracy}%
                    </div>
                </div>
                
                {/* Errors */}
                <div className={styles.statItem}>
                    <div className={styles.statLabel}>Errors</div>
                    <div className={`${styles.statValue} ${errors > 0 ? styles.poor : styles.excellent}`}>
                        {errors}
                    </div>
                </div>
                
                {/* Status indicator */}
                <div className={styles.statItem}>
                    <div className={styles.statLabel}>Status</div>
                    <div className={`${styles.statValue} ${isActive ? styles.active : ''} ${isCompleted ? styles.excellent : ''}`}>
                        {isCompleted ? 'Finished!' : (isActive ? 'Typing...' : 'Ready')}
                    </div>
                </div>
            </div>
            
            {/* Performance feedback - only show most important */}
            {(accuracy <= 70 || (mode === 'paragraph' && wpm >= 40) || accuracy >= 95) && (
                <div className={styles.feedback}>
                    {accuracy <= 70 && (
                        <div className={styles.feedbackItem}>
                            <p className={styles.poor}>Focus on accuracy! 🎯</p>
                        </div>
                    )}
                    
                    {mode === 'paragraph' && wpm >= 40 && accuracy > 70 && (
                        <div className={styles.feedbackItem}>
                            <p className={styles.excellent}>Excellent speed! 🚀</p>
                        </div>
                    )}
                    
                    {accuracy >= 95 && (
                        <div className={styles.feedbackItem}>
                            <p className={styles.excellent}>Perfect accuracy! ✨</p>
                        </div>
                    )}
                </div>
            )}
            
            {/* Compact tip - only show for current mode */}
            <div className={styles.tips}>
                <div className={styles.tip}>
                    💡 {mode === 'row_drill' && 'Memorize finger positions'}
                    {mode === 'all_rows' && 'Type without looking'}
                    {mode === 'paragraph' && 'Maintain steady rhythm'}
                </div>
            </div>
        </div>
    );
} 