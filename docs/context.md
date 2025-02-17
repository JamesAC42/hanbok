PROJECT: Korean Sentence Analysis App (Hangul.study)
TYPE: Educational Web Application
PURPOSE: Help Korean language learners understand and break down Korean sentences with detailed grammatical and cultural analysis

CORE FUNCTIONALITY:
1. Input: Users paste any Korean sentence (from songs, dramas, books, etc.)
2. Analysis: LLM provides comprehensive breakdown of:
   - Morphological components (every particle, ending, and stem)
   - Grammar patterns and structures
   - Formality levels and variations
   - Cultural context and usage notes
3. Learning System: Stores analyzed components for future reference

KEY FEATURES:
- Complete morphological breakdown of sentences
- Explains grammar patterns with TOPIK level indicators
- Shows formal/informal variations
- Provides cultural context and usage notes
- Progressive learning system that remembers encountered words/patterns
- Audio pronunciation via TTS (stored in cloud)
- Links related sentences using same vocabulary/grammar

DATA STRUCTURES:
1. Sentence Components:
   - Original text as appears in sentence
   - Dictionary form (e.g., 하다 form for verbs)
   - Part of speech
   - English meaning
   - Grammar role
   - Conjugation steps (for verbs)
   - Particle functions (for nouns)
   - Usage notes and context

2. Grammar Points:
   - Pattern name and level
   - Explanation for learners
   - Example sentences
   - Usage context
   - Related patterns

3. Cultural/Usage Notes:
   - Formality level explanations
   - Situational usage guidance
   - Cultural context
   - Common mistakes to avoid

SPECIAL HANDLING:
1. Korean Language Features:
   - Agglutinative grammar
   - Honorific system
   - Formal/informal speech levels
   - Particle combinations
   - Bound morphemes
   - Sound changes
   - Regional dialects
   - Contractions
   - Modern internet language

2. Edge Cases:
   - Idiomatic expressions
   - Slang and abbreviations
   - Mixed language use (Konglish)
   - Regional variations
   - Multiple meaning words
   - Complex conjugations
   - Compound verbs
   - Borrowed words

TECHNICAL IMPLEMENTATION:
- MongoDB for storing analysis data
- AWS S3 for audio storage
- React frontend with Tailwind CSS
- Comprehensive grammar pattern database
- Intelligent caching of analyzed sentences
- Progressive enhancement of stored data

TARGET USERS:
- Korean language learners (all levels)
- K-pop/K-drama fans
- Students preparing for TOPIK
- Self-study learners
- Anyone wanting to understand Korean sentences in context

EXAMPLE TEST SENTENCES:
[Include the test sentences from our previous discussion]

KEY PRINCIPLES:
1. Every component of a sentence must be explained
2. Information should be presented in learner-friendly way
3. Cultural context is as important as grammar
4. Progressive learning through connected sentences
5. Balance between detailed analysis and practical usage
6. Support for varying formality levels
7. Recognition of real-world language use

This app bridges the gap between textbook Korean and real-world usage by providing detailed, contextual analysis while building a personalized learning database.