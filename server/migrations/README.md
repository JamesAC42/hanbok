# Migration Scripts

This directory contains migration scripts for the database.

## Available Migrations

- `migrate_words.js`: Migrates words from the old format to the new format.
- `migrate_sentences.js`: Migrates sentences from the old format to the new format.
- `cleanup_empty_analysis.js`: Cleans up empty analysis objects.
- `user_polyfill.js`: Adds missing fields to user documents.
- `populate_feature_usage.js`: Populates feature usage statistics.
- `populate_decks_and_cards.js`: Creates flashcard decks and cards based on users' saved words.

## Running Migrations

To run a migration script, use the following command:

```bash
node server/migrations/script_name.js
```

For example, to run the `populate_decks_and_cards.js` migration:

```bash
node server/migrations/populate_decks_and_cards.js
```

## populate_decks_and_cards.js

This migration script creates flashcard decks and cards based on users' saved words. It performs the following actions:

1. For each user, it retrieves all their saved words.
2. Groups the words by language.
3. For each language group, it creates a deck with the language name.
4. For each word in the language group, it creates a flashcard and links it to the deck.

The script sets all cards to the "new" state, making them immediately available for review.

### Prerequisites

- MongoDB connection (configured in .env file)
- Existing users and words collections 