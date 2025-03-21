@echo off
echo ===============================================
echo Flashcard Reset Utility
echo ===============================================
echo.
echo This script will reset all flashcards to their initial state:
echo - Review state: "new"
echo - Interval: 0 days
echo - Next review date: Yesterday (to make them immediately due)
echo - Ease factor: 2.5 (default)
echo.
echo WARNING: This operation cannot be undone!
echo.

set /p confirmAll=Reset ALL cards for ALL users? (y/n): 

if /i "%confirmAll%"=="y" (
    echo Resetting all cards for all users...
    node resetAllCards.js
    goto end
)

set /p userId=Enter user ID (leave blank to quit): 
if "%userId%"=="" goto end

set /p deckId=Enter deck ID (leave blank for all decks): 
if "%deckId%"=="" (
    echo Resetting all cards for user %userId%...
    node resetAllCards.js %userId%
) else (
    echo Resetting cards in deck %deckId% for user %userId%...
    node resetAllCards.js %userId% %deckId%
)

:end
echo.
echo Reset operation completed.
pause 