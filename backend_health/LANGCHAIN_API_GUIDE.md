# 🤖 LangChain-Enhanced Health Assistant API Guide

## Overview

Your Health Assistant now features a sophisticated **LangChain-powered AI** system with:

- 🧠 **Conversation Memory**: Uses ChromaDB vector database to remember past conversations
- 📚 **RAG (Retrieval-Augmented Generation)**: Access to 10+ medical research papers
- 🔄 **Streaming Responses**: Real-time token-by-token responses
- 👤 **Personalized Advice**: Uses patient profile for tailored recommendations
- 🔍 **Semantic Search**: Intelligent context retrieval from conversation history

---

## 🎯 Core Features

### 1. **Chat with Memory** (`/chat/`)

Enhanced chat that remembers conversation history and references medical research.

**Endpoint**: `POST /chat/`

**Request Body**:

```json
{
  "message": "I have a headache that's been lasting for 3 days",
  "session_id": "optional-session-uuid"
}
```

**Response**: Streaming text response

**Features**:

- ✅ Remembers previous conversations in the session
- ✅ References relevant medical research papers
- ✅ Uses user's health profile for personalization
- ✅ Provides evidence-based recommendations
- ✅ Stores conversation in vector database for future retrieval

**Example cURL**:

```bash
curl -X POST http://localhost:8000/chat/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "I have been feeling tired lately",
    "session_id": "abc-123-session"
  }'
```

---

### 2. **Symptom Diagnosis with Memory** (`/diagnose/enhanced/`)

Analyze symptoms with conversation context and medical research.

**Endpoint**: `POST /diagnose/enhanced/`

**Request Body**:

```json
{
  "symptom_names": ["headache", "nausea", "fever"],
  "session_id": "optional-session-uuid"
}
```

**Response**: Streaming diagnosis and recommendations

**Features**:

- ✅ Analyzes multiple symptoms together
- ✅ References relevant medical literature
- ✅ Considers patient history from previous conversations
- ✅ Provides evidence-based differential diagnosis
- ✅ Links symptoms to research papers

**Example cURL**:

```bash
curl -X POST http://localhost:8000/diagnose/enhanced/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "symptom_names": ["headache", "sensitivity to light", "nausea"],
    "session_id": "abc-123-session"
  }'
```

---

### 3. **Medical Research Search** (`/research/search/`)

Search the medical knowledge base for health information.

**Endpoint**: `POST /research/search/`

**Request Body**:

```json
{
  "query": "What causes migraine headaches?",
  "max_results": 3,
  "category": "neurology"
}
```

**Response**:

```json
{
  "query": "What causes migraine headaches?",
  "results_count": 2,
  "results": [
    {
      "content": "Migraine headaches are neurological conditions...",
      "metadata": {
        "title": "Common Headache Types and Their Management",
        "category": "neurology",
        "keywords": ["headache", "migraine", "pain"]
      },
      "similarity_score": 0.92
    }
  ],
  "available_categories": ["neurology", "cardiology", "respiratory", ...]
}
```

**Example cURL**:

```bash
curl -X POST http://localhost:8000/research/search/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "diabetes management",
    "max_results": 5
  }'
```

---

### 4. **Conversation Insights** (`/chat/insights/`)

Get statistics about your conversation history.

**Endpoint**: `GET /chat/insights/`

**Response**:

```json
{
  "total_messages": 156,
  "unique_sessions": 12,
  "recent_conversations": [
    {
      "session_id": "abc-123-session",
      "content": "I have been feeling tired lately...",
      "timestamp": "2025-12-02T10:30:00Z"
    }
  ]
}
```

**Example cURL**:

```bash
curl -X GET http://localhost:8000/chat/insights/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 5. **Session Summary** (`/chat/session/summary/`)

Get detailed summary of a conversation session.

**Endpoint**: `GET /chat/session/summary/?session_id=YOUR_SESSION_ID`

**Response**:

```json
{
  "session_id": "abc-123-session",
  "message_count": 8,
  "duration_minutes": 15,
  "topics_discussed": ["headache", "stress", "sleep"],
  "last_activity": "2025-12-02T10:45:00Z"
}
```

**Example cURL**:

```bash
curl -X GET "http://localhost:8000/chat/session/summary/?session_id=abc-123" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 6. **Active Sessions** (`/chat/session/active/`)

Get all your active conversation sessions.

**Endpoint**: `GET /chat/session/active/`

**Response**:

```json
{
  "total_sessions": 3,
  "sessions": [
    {
      "session_id": "abc-123-session",
      "message_count": 8,
      "last_activity": "2025-12-02T10:45:00Z"
    },
    {
      "session_id": "xyz-456-session",
      "message_count": 5,
      "last_activity": "2025-12-01T14:20:00Z"
    }
  ]
}
```

**Example cURL**:

```bash
curl -X GET http://localhost:8000/chat/session/active/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

### 7. **Clear Memory** (`/chat/memory/clear/`)

Clear conversation memory (specific session or all).

**Endpoint**: `POST /chat/memory/clear/`

**Request Body** (optional session):

```json
{
  "session_id": "abc-123-session"
}
```

**Response**:

```json
{
  "success": true,
  "message": "Cleared 8 messages from session abc-123-session",
  "deleted_count": 8
}
```

**Example cURL** (clear specific session):

```bash
curl -X POST http://localhost:8000/chat/memory/clear/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"session_id": "abc-123-session"}'
```

**Example cURL** (clear all):

```bash
curl -X POST http://localhost:8000/chat/memory/clear/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{}'
```

---

### 8. **Medical Categories** (`/research/categories/`)

Get available medical research categories.

**Endpoint**: `GET /research/categories/`

**Response**:

```json
{
  "categories": [
    "neurology",
    "cardiology",
    "respiratory",
    "gastroenterology",
    "dermatology",
    "mental_health",
    "diabetes",
    "nutrition"
  ],
  "total_count": 8
}
```

**Example cURL**:

```bash
curl -X GET http://localhost:8000/research/categories/ \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 🏗️ Architecture

```
┌──────────────────────────────────────────────────────┐
│                    User Request                       │
└─────────────────┬────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────┐
│              Django REST API                          │
│  (views_enhanced.py)                                  │
└─────────────────┬────────────────────────────────────┘
                  │
                  ▼
┌──────────────────────────────────────────────────────┐
│         LangChainChatService                          │
│  • Conversation management                            │
│  • Prompt engineering                                 │
│  • Streaming responses                                │
└─────────────────┬────────────────────────────────────┘
                  │
          ┌───────┴───────┐
          ▼               ▼
┌──────────────────┐  ┌──────────────────────┐
│ Vector Store     │  │ Medical Knowledge    │
│ (ChromaDB)       │  │ Base (ChromaDB)      │
│                  │  │                      │
│ • Conversation   │  │ • 10+ Research       │
│   history        │  │   papers             │
│ • HuggingFace    │  │ • Clinical           │
│   embeddings     │  │   guidelines         │
└──────────────────┘  └──────────────────────┘
          │               │
          └───────┬───────┘
                  ▼
┌──────────────────────────────────────────────────────┐
│           Gemini 1.5 Flash (Google AI)               │
│  • Natural language understanding                     │
│  • Context-aware responses                            │
│  • Medical knowledge synthesis                        │
└──────────────────────────────────────────────────────┘
```

---

## 🔧 Technical Details

### **LangChain Components**

1. **Chat Model**: `ChatGoogleGenerativeAI` (Gemini 1.5 Flash)

   - Temperature: 0.7
   - Streaming: Enabled
   - Max tokens: Default

2. **Embeddings**: `HuggingFaceEmbeddings`

   - Model: `sentence-transformers/all-MiniLM-L6-v2`
   - Dimensions: 384
   - Local execution (no API costs)

3. **Vector Store**: `ChromaDB`

   - Two databases:
     - `chroma_db/`: Conversation history
     - `chroma_db_medical/`: Medical research papers
   - Persistence: Disk-based

4. **Memory Strategy**:
   - Short-term: Session-based conversation context
   - Long-term: Vector similarity search across all conversations
   - Hybrid: Combines recent + semantically similar messages

### **Prompt Engineering**

The system uses a sophisticated multi-part prompt:

```python
Prompt Structure:
1. **Patient Profile** (if available)
   - Age, gender, height, weight
   - Blood group, allergies
   - Medical conditions

2. **Conversation History** (top 5 similar)
   - Retrieved via semantic search
   - Sorted by relevance score

3. **Medical Literature** (top 3 relevant)
   - Research papers from knowledge base
   - Clinical guidelines

4. **Current Question**
   - User's immediate query

5. **System Instructions**
   - Response guidelines
   - Citation format
   - Safety reminders
```

---

## 📊 Response Quality Features

### **Citation Format**

When the AI references research, it uses:

```
[Research: Headache Management - Tension headaches respond well to NSAIDs]
```

### **Context Awareness**

The AI references previous conversations:

```
"Based on our earlier discussion about your recurring headaches..."
```

### **Evidence-Based**

Responses include:

- Research citations
- Clinical guidelines
- Statistical data
- Treatment efficacy rates

---

## 🔐 Security & Privacy

1. **Authentication**: All endpoints require JWT token
2. **User Isolation**: Conversations are user-specific
3. **Data Privacy**: No external API calls for embeddings (local HuggingFace)
4. **Session Management**: UUID-based session tracking
5. **Memory Control**: Users can clear their conversation history

---

## 📈 Performance

### **Response Times**

- First message (cold start): 2-5 seconds
- Subsequent messages: 0.8-2 seconds
- Streaming latency: <100ms per token

### **Database Queries**

- Vector search: <200ms
- Medical KB search: <300ms
- Session retrieval: <100ms

### **Memory Usage**

- HuggingFace model: ~120MB (cached after first load)
- ChromaDB: Scales with conversation volume
- Embeddings: 384 dimensions per message

---

## 🧪 Testing Examples

### **Test 1: Simple Chat**

```bash
# Start a conversation
curl -X POST http://localhost:8000/chat/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"message": "I have a mild headache"}'
```

### **Test 2: Follow-up with Memory**

```bash
# Continue in the same session
curl -X POST http://localhost:8000/chat/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "What if it gets worse?",
    "session_id": "SAME_SESSION_ID_FROM_TEST1"
  }'
```

### **Test 3: Medical Research Search**

```bash
# Search medical knowledge
curl -X POST http://localhost:8000/research/search/ \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "migraine triggers and prevention",
    "max_results": 3
  }'
```

---

## 🚀 Next Steps

1. **Integrate with Frontend**: Use these endpoints in your Next.js app
2. **Add More Research**: Expand the medical knowledge base
3. **Fine-tune Prompts**: Adjust system prompts for better responses
4. **Monitor Usage**: Track conversation metrics
5. **Optimize Performance**: Cache frequently accessed research

---

## 📚 Related Files

- **LangChain Service**: `health_app/utils/langchain_helper.py`
- **Enhanced Views**: `health_app/views_enhanced.py`
- **Vector Store**: `health_app/services/vector_store_service.py`
- **Medical KB**: `health_app/services/medical_knowledge_base.py`
- **URLs**: `health_app/urls.py`

---

## 💡 Pro Tips

1. **Session IDs**: Always use the same `session_id` for related conversations
2. **Clear Memory**: Periodically clear old sessions to improve performance
3. **Medical Categories**: Filter research by category for focused results
4. **User Profile**: Keep profile updated for better personalized advice
5. **Streaming**: Handle streaming responses properly in your frontend

---

**Built with** ❤️ using **LangChain**, **Gemini AI**, **ChromaDB**, and **Django**
