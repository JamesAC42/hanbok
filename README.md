# Hanbok

[Visit Hanbok](https://hanbokstudy.com)

Originally a Korean language learning app, Hanbok is now a general purpose language learning tool that supports:

- Korean
- Japanese
- Chinese
- Spanish
- Italian
- French
- German
- Dutch
- Russian
- Turkish

## Features

- Sentence analysis
- Word analysis
- Grammar analysis
- Cultural analysis
- Image analysis
- Text to speech
- Vocabulary builder
- Cultural insights

## Demo

### Basic Sentence Analysis
![Basic sentence analysis demo](./screenshots/1.gif)
Break down sentences into their components to understand grammar patterns, vocabulary, and usage.

### Image Text Extraction
![Image text extraction demo](./screenshots/2.gif)
Extract and analyze text from images to learn from real-world materials.

## Roadmap

Exciting new features coming soon:

- Spaced Repetition Flashcards
- Interactive Grammar Exercises  
- Structured Daily Lessons
- Real-time Voice Conversation Practice
- Typing practice for different languages

## Development and running locally

To run the app locally, you will need:

- Node.js
- npm
- redis
- mongodb

1. Clone the repo
2. Run `npm install` in both the `/server` and `/app` directories
3. Create a `.env` file in the `/server` directory with the following variables:

```
ANTHROPIC_API_KEY=          <-- Optional, depends on which LLM you want to use
GOOGLE_CLIENT_ID=           <-- For Google OAuth
GOOGLE_CLIENT_SECRET=       <-- For Google OAuth
ELEVENLABS_API_KEY=         <-- For text to speech
GEMINI_API_KEY=             <-- Optional, depends on which LLM you want to use
OPENAI_API_KEY=             <-- Optional, depends on which LLM you want to use
REDIS_PW=                   <-- For redis - leave blank if you don't want/need authentication for your server locally
LOCAL=true                  <-- For local development
SECURE_SESSION=false        <-- For local development
MONGODB_USER=               <-- For mongodb
MONGODB_PASSWORD=           <-- For mongodb
MONGODB_HOST=               <-- For mongodb
MONGODB_PORT=               <-- For mongodb
MONGODB_DB=hanbok           <-- Name of MongoDB database, should be hanbok
AWS_BUCKET_NAME=            <-- For AWS S3 to store audio files
AWS_REGION=                 <-- For AWS S3 to store audio files
AWS_ACCESS_KEY_ID=          <-- For AWS S3 to store audio files
AWS_SECRET_ACCESS_KEY=      <-- For AWS S3 to store audio files
STRIPE_PUBLISHABLE_KEY=     <-- For Stripe payment processing
STRIPE_SECRET_KEY=          <-- For Stripe payment processing
STRIPE_WEBHOOK_SECRET=      <-- For Stripe payment processing
CLIENT_URL=                 <-- Redirect URL for Stripe payment processing
```

You'll need to then make the hanbok database in MongoDB and create a user for it with the same credentials you put in the `.env`

To run the server, run `node index` or `nodemon index` in the `/server` directory.

To run the client in development mode, run `npm run dev` in the `/app` directory.