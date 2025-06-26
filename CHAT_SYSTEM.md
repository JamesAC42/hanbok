# Chat System Documentation

## Overview

The chat system provides users with AI-powered tutoring capabilities for Korean language learning. Users can start conversations to ask questions about grammar, vocabulary, and sentence analysis.

## Tier Limitations

### Free Tier (Tier 0)
- **User Messages per Conversation**: 1
- **Conversations per Sentence**: 1
- **Total Conversations**: Unlimited

### Basic Tier (Tier 1)
- **User Messages per Conversation**: 200
- **Conversations per Sentence**: 1
- **Total Conversations**: Unlimited

### Plus Tier (Tier 2)
- **User Messages per Conversation**: 200
- **Conversations per Sentence**: Unlimited
- **Total Conversations**: Unlimited

## Database Schema

### Conversations Collection
```javascript
{
  conversationId: Number,        // Unique ID
  userId: Number,               // Owner of the conversation
  title: String,                // Auto-generated or user-set title
  sentenceId: Number | null,    // Optional linked sentence
  dateCreated: Date,            // Creation timestamp
  lastUpdated: Date,            // Last activity timestamp
  messageCount: Number,         // Total messages in conversation
  userMessageCount: Number,     // User messages only (for tier limits)
  isDeleted: Boolean            // Soft delete flag
}
```

### Conversation Messages Collection
```javascript
{
  messageId: Number,            // Unique ID
  conversationId: Number,       // Parent conversation
  role: String,                 // 'user' | 'assistant' | 'system'
  content: String,              // Message content
  timestamp: Date,              // Creation timestamp
  metadata: Object | null       // Optional metadata (tokens, etc.)
}
```

## API Endpoints

### Create Conversation
```
POST /api/conversations
Authorization: Required

Body:
{
  "initialMessage": "Can you help me with Korean grammar?",
  "sentenceId": 123 // Optional
}

Response:
{
  "success": true,
  "conversation": {
    "conversationId": 1,
    "title": "Can you help me with Korean grammar?",
    "sentenceId": 123,
    "dateCreated": "2024-01-01T00:00:00Z",
    "lastUpdated": "2024-01-01T00:00:00Z",
    "messageCount": 1,
    "userMessageCount": 1
  }
}
```

### Get User Conversations (Paginated)
```
GET /api/conversations?page=1&limit=20
Authorization: Required

Response:
{
  "success": true,
  "conversations": [...],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 50,
    "pages": 3
  }
}
```

### Get Single Conversation with Messages
```
GET /api/conversations/:conversationId
Authorization: Required

Response:
{
  "success": true,
  "conversation": {
    "conversationId": 1,
    "title": "Grammar Help",
    "sentence": { /* sentence object if linked */ },
    "messages": [
      {
        "messageId": 1,
        "role": "user",
        "content": "Can you help me with Korean grammar?",
        "timestamp": "2024-01-01T00:00:00Z"
      },
      {
        "messageId": 2,
        "role": "assistant",
        "content": "I'd be happy to help! What specific grammar topic?",
        "timestamp": "2024-01-01T00:00:01Z"
      }
    ]
  }
}
```

### Add Message to Conversation
```
POST /api/conversations/:conversationId/messages
Authorization: Required

Body:
{
  "role": "user",
  "content": "What is the difference between -이/가 and -은/는?"
}

Response:
{
  "success": true,
  "message": {
    "messageId": 3,
    "role": "user",
    "content": "What is the difference between -이/가 and -은/는?",
    "timestamp": "2024-01-01T00:00:02Z"
  }
}
```

### Update Conversation Title
```
PUT /api/conversations/:conversationId/title
Authorization: Required

Body:
{
  "title": "Korean Particles Discussion"
}

Response:
{
  "success": true,
  "message": "Conversation title updated successfully"
}
```

### Delete Conversation
```
DELETE /api/conversations/:conversationId
Authorization: Required

Response:
{
  "success": true,
  "message": "Conversation deleted successfully"
}
```

## React Hook Usage

### useConversations Hook

```javascript
import { useConversations } from '@/hooks/useConversations';

function MyComponent() {
  const { 
    createConversationFromSentence, 
    askAboutWord, 
    askAboutGrammar,
    isCreating 
  } = useConversations();

  // Create conversation about a specific sentence
  const handleSentenceQuestion = async () => {
    const result = await createConversationFromSentence(
      { sentenceId: 123, text: "안녕하세요" },
      "Can you explain this greeting?"
    );
    
    if (result.success) {
      // User is automatically navigated to /tutor
      console.log('Conversation created:', result.conversation);
    } else {
      alert(result.error);
    }
  };

  // Ask about a specific word
  const handleWordQuestion = async () => {
    await askAboutWord("안녕하세요", "greeting context");
  };

  // Ask about grammar
  const handleGrammarQuestion = async () => {
    await askAboutGrammar("-(으)ㄹ 것이다", ["갈 것이다", "먹을 것이다"]);
  };

  return (
    <div>
      <button onClick={handleSentenceQuestion} disabled={isCreating}>
        Ask about sentence
      </button>
      <button onClick={handleWordQuestion} disabled={isCreating}>
        Ask about word
      </button>
      <button onClick={handleGrammarQuestion} disabled={isCreating}>
        Ask about grammar
      </button>
    </div>
  );
}
```

## UI Features

### Tutor Page (/tutor)
- **Collapsible sidebar** with conversation history
- **Main chat area** with message bubbles
- **Auto-scroll** to latest messages
- **Responsive design** for mobile devices
- **Loading states** and error handling
- **Empty state** with tier information

### Conversation History
- **Paginated list** of conversations
- **Quick delete** with confirmation
- **Title editing** capabilities
- **Sentence linking** indicators
- **Last updated** timestamps

### Message Interface
- **Auto-resizing textarea** for input
- **Enter to send** (Shift+Enter for new line)
- **Message timestamps** and role indicators
- **Loading animation** while AI responds
- **Error handling** with retry options

## Error Handling

### Tier Limit Errors
```javascript
// 403 Forbidden responses for tier violations
{
  "success": false,
  "message": "Your tier allows maximum 1 user message(s) per conversation. Upgrade for more messages."
}

{
  "success": false,
  "message": "Your tier allows maximum 1 conversation(s) per sentence. Upgrade to Plus for unlimited conversations."
}
```

### Common Error Responses
- **401 Unauthorized**: User not logged in
- **404 Not Found**: Conversation or sentence not found
- **403 Forbidden**: Tier limits exceeded
- **400 Bad Request**: Invalid input data
- **500 Internal Server Error**: Server-side issues

## Integration Points

### Sentence Analysis Integration
- Create conversations linked to specific sentence analyses
- Access sentence context within conversations
- Cross-reference between analysis and chat history

### User Tier System Integration
- Real-time tier limit validation
- Dynamic UI based on user tier
- Upgrade prompts when limits are reached

### Mobile Responsiveness
- Full-screen sidebar on mobile
- Touch-friendly interface
- Optimized input handling for mobile keyboards

## Future Enhancements

1. **AI Integration**: Connect with language model APIs
2. **Voice Messages**: Audio input/output capabilities
3. **Conversation Sharing**: Share conversations with teachers/friends
4. **Export Options**: Export conversations as text/PDF
5. **Smart Suggestions**: AI-generated follow-up questions
6. **Context Awareness**: Better integration with user's learning progress
7. **Conversation Templates**: Quick-start templates for common questions
8. **Message Reactions**: Like/dislike feedback system 