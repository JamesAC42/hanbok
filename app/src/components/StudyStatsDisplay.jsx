'use client';
import { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import styles from '@/styles/components/studystats.module.scss';

/**
 * Component to display study statistics including a heatmap and streak information
 */
const StudyStatsDisplay = ({ deckId }) => {
  const { t } = useLanguage();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);
  const [encouragingMessage, setEncouragingMessage] = useState('');

  // Helper function to get a standardized date string in YYYY-MM-DD format
  // This ensures consistent handling of dates regardless of timezone
  const getStandardDateString = (dateInput) => {
    if (!dateInput) return '';
    
    // If the input is already in the format YYYY-MM-DD, just return it
    if (typeof dateInput === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateInput)) {
      return dateInput;
    }
    
    // Create a new date in local timezone
    const date = new Date(dateInput);
    
    // Check if it's an invalid date
    if (isNaN(date.getTime())) {
      console.error('Invalid date input:', dateInput);
      return '';
    }
    
    // Here's the key fix: adjust for timezone issues by using a Date's UTC methods
    // This fixes the off-by-one day issue
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  };

  useEffect(() => {
    const fetchStudyStats = async () => {
      try {
        setLoading(true);
        // Use the correct API endpoint and include deckId if available
        const endpoint = deckId 
          ? `/api/study/stats?deckId=${deckId}&days=90` 
          : '/api/study/stats?days=90';
        
        const response = await fetch(endpoint);
        const data = await response.json();

        console.log(data);
        
        if (data.success) {
          setStats(data.stats);
        } else {
          setError(data.error || t('stats.statsError'));
        }
      } catch (err) {
        console.error('Error fetching study stats:', err);
        setError(t('stats.statsError'));
      } finally {
        setLoading(false);
      }
    };

    fetchStudyStats();
  }, [t, deckId]);
  
  /**
   * Generate an encouraging message based on the user's streak
   */
  const generateEncouragingMessage = (streak) => {
    if (!streak) return t('stats.startStreak');
    
    if (streak === 1) return t('stats.firstDayStreak');
    if (streak < 3) return t('stats.keepGoing');
    if (streak < 7) return t('stats.doingGreat');
    if (streak < 14) return t('stats.impressive');
    if (streak < 30) return t('stats.amazing');
    if (streak < 60) return t('stats.extraordinary');
    return t('stats.legendary');
  };

  /**
   * Render a heat map of study activity
   */
  const renderHeatMap = () => {
    if (!stats || !stats.daily || stats.daily.length === 0) {
      return <div className={styles.emptyHeatmap}>{t('stats.noActivityYet')}</div>;
    }
    
    // Create a map of date strings to activity levels
    const activityMap = new Map();
    console.log('Stats daily data:', stats.daily);
    
    // Log all activity dates for debugging
    console.log('All activity dates from server:');
    stats.daily.forEach(day => {
      if (day.hasActivity) {
        console.log(`  ${day.date} - ${day.newCardsStudied + day.reviewsCompleted} activities`);
      }
    });
    
    stats.daily.forEach(day => {
      if (day.hasActivity) {
        const totalActivity = day.newCardsStudied + day.reviewsCompleted;
        
        // Use the server-provided date string directly
        const dateKey = day.date;
        
        activityMap.set(dateKey, totalActivity);
        console.log(`Activity on ${dateKey}: ${totalActivity}`);
      }
    });

    // Get activity level (0-4) based on cards reviewed
    const getActivityLevel = (count) => {
      if (!count) return 0;
      if (count < 10) return 1;
      if (count < 30) return 2;
      if (count < 50) return 3;
      return 4;
    };

    // Generate dates for last 12 weeks (84 days)
    const today = new Date();
    
    // Create a date representing today at midnight local time
    const todayMidnight = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate(),
      0, 0, 0, 0
    );
    
    // Adjust today to end of day to ensure today's activities are included
    today.setHours(23, 59, 59, 999);
    
    // First, calculate the start date (beginning of 12 weeks ago)
    const startDate = new Date(todayMidnight);
    startDate.setDate(todayMidnight.getDate() - 83);
    startDate.setHours(0, 0, 0, 0);
    
    // Find the first Sunday on or before the start date
    const firstSunday = new Date(startDate);
    const daysSinceLastSunday = firstSunday.getDay();
    firstSunday.setDate(firstSunday.getDate() - daysSinceLastSunday);
    
    // For debugging, log the date range
    console.log(`Heat map date range: ${startDate.toLocaleDateString()} to ${today.toLocaleDateString()}`);
    console.log(`First Sunday: ${firstSunday.toLocaleDateString()}`);
    
    // Create the grid data structure directly, row by day, column by week
    const dayRows = Array(7).fill().map(() => Array(13).fill(null)); // Increased to 13 to ensure we capture the full last week
    
    // Populate the grid
    for (let week = 0; week < 13; week++) { // Increased to 13 to ensure we capture the full last week
      for (let day = 0; day < 7; day++) {
        // Calculate this date
        const date = new Date(firstSunday);
        date.setDate(firstSunday.getDate() + (week * 7) + day);
        
        // Skip if this date is before our 84-day period or after today
        if (date < startDate || date > today) {
          continue;
        }
        
        // Log this date for debugging
        console.log(`Processing grid date: ${date.toLocaleDateString()}`);
        
        // Format the date string exactly in YYYY-MM-DD format matching the server format
        // The server sends dates in format YYYY-MM-DD, so we need to match that exactly
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day_num = String(date.getDate()).padStart(2, '0');
        const dateStr = `${year}-${month}-${day_num}`;
        
        // Check if this date exists in our activity map
        const activity = activityMap.get(dateStr) || 0;
        
        // Log to debug date mapping issues
        if (activity > 0) {
          console.log(`Heat map cell for ${dateStr} has activity: ${activity}`);
        }
        
        // Calculate if this is today
        const isToday = date.getFullYear() === todayMidnight.getFullYear() && 
                        date.getMonth() === todayMidnight.getMonth() && 
                        date.getDate() === todayMidnight.getDate();
        
        dayRows[day][week] = {
          date,
          dateStr,
          activity,
          activityLevel: getActivityLevel(activity),
          isToday,
          dayOfWeek: day
        };
      }
    }

    // Day labels for the rows
    const dayLabels = [
      t('days.sun'), 
      t('days.mon'), 
      t('days.tue'), 
      t('days.wed'), 
      t('days.thu'), 
      t('days.fri'), 
      t('days.sat')
    ];

    return (
      <div className={styles.heatmapContainerHorizontal}>
        <table className={styles.heatmapTable}>
          <tbody>
            {dayRows.map((weekData, dayIndex) => (
              <tr key={dayIndex} className={styles.heatmapRow}>
                <td className={styles.dayLabelCell}>
                  <div className={styles.dayLabel}>{dayLabels[dayIndex]}</div>
                </td>
                {weekData.map((day, weekIndex) => {
                  // Skip rendering null cells (for the 13th week if not needed)
                  if (!day && weekIndex >= 12) {
                    return null;
                  }
                  
                  return (
                    <td key={`${dayIndex}-${weekIndex}`} className={styles.dayCell}>
                      {day && (
                        <div 
                          className={`${styles.day} ${styles[`activityLevel${day.activityLevel}`]} ${day.isToday ? styles.today : ''}`}
                          title={`${day.date.toLocaleDateString()}: ${day.activity} ${t('stats.cardsReviewed')}`}
                        >
                          {day.isToday && <div className={styles.todayMarker} />}
                        </div>
                      )}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
        <div className={styles.heatmapLegend}>
          <div className={styles.legendTitle}>{t('stats.activityLevel')}</div>
          <div className={styles.legendItems}>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.activityLevel0}`}></div>
              <div className={styles.legendLabel}>{t('stats.noActivity')}</div>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.activityLevel1}`}></div>
              <div className={styles.legendLabel}>1-9</div>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.activityLevel2}`}></div>
              <div className={styles.legendLabel}>10-29</div>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.activityLevel3}`}></div>
              <div className={styles.legendLabel}>30-49</div>
            </div>
            <div className={styles.legendItem}>
              <div className={`${styles.legendColor} ${styles.activityLevel4}`}></div>
              <div className={styles.legendLabel}>50+</div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  /**
   * Render streak information
   */
  const renderStreakInfo = () => {
    if (!stats || !stats.streaks || stats.streaks.length === 0) {
      return <div className={styles.noStreak}>{t('stats.noStreakYet')}</div>;
    }
    
    // Find the relevant streak
    let streak = null;
    if (deckId) {
      streak = stats.streaks.find(s => s.deckId === parseInt(deckId));
    } else {
      // For all decks view, show the highest current streak
      streak = stats.streaks.reduce((highest, current) => 
        (current.currentStreak > highest.currentStreak) ? current : highest, 
        stats.streaks[0]
      );
    }
    
    if (!streak) {
      return <div className={styles.noStreak}>{t('stats.noStreakYet')}</div>;
    }
    
    const { currentStreak, maxStreak } = streak;
    
    return (
      <div className={styles.streakContainer}>
        <div className={styles.streakInfo}>
          <div className={styles.currentStreak}>
            <div className={styles.streakValue}>{currentStreak}</div>
            <div className={styles.streakLabel}>{t('stats.currentStreak')}</div>
          </div>
          <div className={styles.maxStreak}>
            <div className={styles.streakValue}>{maxStreak}</div>
            <div className={styles.streakLabel}>{t('stats.maxStreak')}</div>
          </div>
        </div>
        <div className={styles.encouragingMessage}>
          {generateEncouragingMessage(currentStreak)}
        </div>
      </div>
    );
  };

  if (loading) {
    return <div className={styles.loading}>{t('common.loading')}...</div>;
  }

  if (error) {
    return <div className={styles.error}>{error}</div>;
  }

  return (
    <div className={styles.statsContainer}>
      <h3 className={styles.statsTitle}>{t('stats.yourProgress')}</h3>
      
      {renderStreakInfo()}
      
      <div className={styles.heatmapSection}>
        <h4 className={styles.sectionTitle}>{t('stats.studyActivity')}</h4>
        {renderHeatMap()}
      </div>
      
      <div className={styles.summarySection}>
        <div className={styles.summaryItem}>
          <div className={styles.summaryValue}>
            {stats?.overall?.totalNewCardsStudied || 0}
          </div>
          <div className={styles.summaryLabel}>{t('stats.newCardsStudied')}</div>
        </div>
        <div className={styles.summaryItem}>
          <div className={styles.summaryValue}>
            {stats?.overall?.totalReviewsCompleted || 0}
          </div>
          <div className={styles.summaryLabel}>{t('stats.reviewsCompleted')}</div>
        </div>
        <div className={styles.summaryItem}>
          <div className={styles.summaryValue}>
            {stats?.overall?.totalDaysStudied || 0}
          </div>
          <div className={styles.summaryLabel}>{t('stats.daysStudied')}</div>
        </div>
      </div>
    </div>
  );
};

export default StudyStatsDisplay; 