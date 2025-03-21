#!/bin/bash

echo "==============================================="
echo "Flashcard Reset Utility"
echo "==============================================="
echo
echo "This script will reset all flashcards to their initial state:"
echo "- Review state: \"new\""
echo "- Interval: 0 days"
echo "- Next review date: Yesterday (to make them immediately due)"
echo "- Ease factor: 2.5 (default)"
echo
echo "WARNING: This operation cannot be undone!"
echo

read -p "Reset ALL cards for ALL users? (y/n): " confirmAll

if [[ $confirmAll == "y" || $confirmAll == "Y" ]]; then
    echo "Resetting all cards for all users..."
    node resetAllCards.js
    exit 0
fi

read -p "Enter user ID (leave blank to quit): " userId
if [[ -z "$userId" ]]; then
    exit 0
fi

read -p "Enter deck ID (leave blank for all decks): " deckId
if [[ -z "$deckId" ]]; then
    echo "Resetting all cards for user $userId..."
    node resetAllCards.js $userId
else
    echo "Resetting cards in deck $deckId for user $userId..."
    node resetAllCards.js $userId $deckId
fi

echo
echo "Reset operation completed."
read -p "Press Enter to continue..." 