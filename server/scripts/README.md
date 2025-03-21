# Flashcard System Management Scripts

This directory contains utility scripts for managing the flashcard system.

## Reset Flashcards Utility

The reset utility allows you to reset flashcards to their initial state. This is useful if you want to:
- Start fresh with all your cards
- Reset a specific deck to study it from the beginning
- Reset all cards for a specific user

### What does resetting do?

When you reset flashcards, the following properties are changed:
- Review state: "new"
- Interval days: 0
- Ease factor: 2.5 (default)
- Next review date: Yesterday (to make them immediately due)
- Step index: null
- Repetition number: 0
- Lapses: 0

**Note:** Review history is preserved for reference, but the cards will behave as if they're brand new.

### How to use

#### For Windows users:

1. Open a command prompt in the server directory
2. Navigate to the scripts folder: `cd scripts`
3. Run the batch file: `resetCards.bat`
4. Follow the prompts:
   - Reset all cards for all users? (y/n)
   - If no, enter a user ID
   - Optionally, enter a deck ID to only reset cards in that deck

#### For Linux/Mac users:

1. Open a terminal in the server directory
2. Navigate to the scripts folder: `cd scripts`
3. Make the script executable: `chmod +x resetCards.sh`
4. Run the shell script: `./resetCards.sh`
5. Follow the prompts as with the Windows version

#### Direct Node.js usage:

For more advanced users, you can run the Node script directly:

```
node resetAllCards.js [userId] [deckId]
```

- No parameters: Reset ALL cards for ALL users
- userId only: Reset all cards for the specified user
- userId and deckId: Reset only cards in the specified deck for the specified user

### Examples

#### Reset all cards for user with ID 8:
```
node resetAllCards.js 8
```

#### Reset cards in deck with ID 3 for user with ID 8:
```
node resetAllCards.js 8 3
```

## Warning

These operations cannot be undone! Use with caution.

If you want to be extra cautious, consider backing up your database before running these scripts. 