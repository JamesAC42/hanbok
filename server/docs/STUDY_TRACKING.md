# Study Progress and Streak Tracking

This document explains the new study tracking features implemented in the spaced repetition system.

## Overview

The spaced repetition system now includes:

1. **Daily Study Progress Tracking**: Records how many new cards and reviews a user completes each day
2. **Study Streak Tracking**: Tracks consecutive days of study for each deck
3. **Adaptive New Card Introduction**: Limits new cards based on how many have already been studied that day

## Database Collections

Two new collections have been added to support these features:

### Study Progress Collection (`study_progress`)

Tracks daily study activity for each deck:

- `userId`: User ID who studied cards
- `deckId`: Deck ID being studied  
- `date`: Date of study activity (truncated to day)
- `newCardsStudied`: Number of new cards studied today
- `reviewsCompleted`: Number of reviews completed today
- `timeSpent`: Optional tracking of time spent studying in seconds
- `lastUpdated`: Timestamp of the last update to this record
- `studiedCardIds`: Array of card IDs that have been studied today

### Study Streaks Collection (`study_streaks`)

Tracks streak information for each user's decks:

- `userId`: User ID who is tracking streaks
- `deckId`: Deck ID being tracked
- `currentStreak`: Current streak in days
- `maxStreak`: Maximum streak achieved in days
- `currentStreakStartDate`: Date when the current streak started
- `maxStreakStartDate`: Date when the maximum streak started
- `maxStreakEndDate`: Date when the maximum streak ended
- `lastStudyDate`: Last date the user studied this deck
- `studyDates`: Array of dates when user studied

## How It Works

### Recording Study Progress

Each time a user rates a card:

1. The system updates their daily study progress.
2. If the card was in "new" state and is now in "learning", it increments the new cards count.
3. Every review increments the reviews completed count.

### Tracking Streaks

Streaks are updated when:

1. A user studies at least one card in a deck.
2. If the user studied yesterday, the streak increases.
3. If the user missed a day or more, the streak resets to 1.
4. Maximum streak records are maintained for achievement purposes.

### Initiating Study Sessions

When initiating a new study session:

1. The system checks how many new cards the user has already studied today.
2. It only introduces the remaining quota of new cards.
3. This allows users to start and stop study sessions throughout the day while maintaining their daily limits.

## API Endpoints

### Get Study Statistics

`GET /api/study/stats`

Returns comprehensive statistics about a user's study habits, including:

- Overall statistics (total cards studied, days with activity)
- Daily study data for the last 30 days
- Current and maximum streaks
- Today's progress broken down by deck

Query parameters:
- `deckId`: Optional. Filter stats to a specific deck
- `days`: Optional. Number of days to include in daily stats (default: 30)

### Deck Study Session

`GET /api/decks/:deckId/study`

The session initiation endpoint now includes additional information:

- Daily progress data (new cards studied today, remaining quota)
- Current streak information

## Integration with Card Updates

The `updateCardProgress.js` controller has been enhanced to:

1. Update study progress when a card is rated
2. Update streak information
3. Handle the transition from "new" to "learning" state

This happens automatically with each card review and requires no additional client-side logic. 