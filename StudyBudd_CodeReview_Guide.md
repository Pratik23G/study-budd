# StudyBudd - Code Review Preparation Guide

---

## TABLE OF CONTENTS

1. [High-Level Architecture Overview](#1-high-level-architecture-overview)
2. [Frontend-Backend Communication Pattern](#2-frontend-backend-communication-pattern)
3. [Authentication Flow](#3-authentication-flow)
4. [API Service Layer (The Bridge)](#4-api-service-layer-the-bridge)
5. [Dashboard Components Deep Dive](#5-dashboard-components-deep-dive)
6. [Chat Feature](#6-chat-feature)
7. [Files & Folders Feature](#7-files--folders-feature)
8. [Flashcards Feature](#8-flashcards-feature)
9. [Quizzes Feature](#9-quizzes-feature)
10. [Share Button Functionality](#10-share-button-functionality)
11. [RAG Pipeline (AI Brain)](#11-rag-pipeline-ai-brain)
12. [State Management & Context Providers](#12-state-management--context-providers)
13. [Database Schema & Models](#13-database-schema--models)
14. [Key Code Paths (File References)](#14-key-code-paths-file-references)
15. [Common Interview/Review Questions](#15-common-interviewreview-questions)

---

## 1. HIGH-LEVEL ARCHITECTURE OVERVIEW

### The Big Picture

```
┌─────────────────────────────────────────────────────────────────────┐
│                         STUDYBUDD MONOREPO                         │
├──────────────────────────────┬──────────────────────────────────────┤
│        apps/web (Frontend)   │         apps/api (Backend)          │
│        Next.js 15 + React 19 │         FastAPI (Python 3.12+)      │
├──────────────────────────────┼──────────────────────────────────────┤
│                              │                                      │
│  ┌──────────┐  ┌──────────┐  │  ┌──────────┐  ┌──────────────────┐ │
│  │ Pages/   │  │ Custom   │  │  │ Routers  │  │ Services         │ │
│  │ Components│→│ Hooks    │──┼──│ (FastAPI) │→ │ (Business Logic) │ │
│  └──────────┘  └──────────┘  │  └──────────┘  └──────────────────┘ │
│       ↕              ↕       │       ↕               ↕              │
│  ┌──────────┐  ┌──────────┐  │  ┌──────────┐  ┌──────────────────┐ │
│  │ Context  │  │ api.js   │  │  │ Models   │  │ LLM / Together   │ │
│  │ Providers│  │ (HTTP)   │──┼──│ (SQLAlch)│  │ AI Integration   │ │
│  └──────────┘  └──────────┘  │  └──────────┘  └──────────────────┘ │
│                              │       ↕               ↕              │
│                              │  ┌──────────────────────────────────┐│
│                              │  │   Supabase (Auth + Storage)      ││
│                              │  │   PostgreSQL + pgvector           ││
│                              │  └──────────────────────────────────┘│
└──────────────────────────────┴──────────────────────────────────────┘
```

### Tech Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend Framework | Next.js 15.5.3 + React 19.1.0 | UI rendering, routing |
| Styling | Tailwind CSS 4 | Utility-first CSS |
| State Management | React Context + Custom Hooks | Global & local state |
| Backend Framework | FastAPI (Python) | REST API server |
| ORM | SQLAlchemy (async) | Database operations |
| Database | PostgreSQL + pgvector | Data + vector search |
| Auth | Supabase Auth | JWT-based authentication |
| File Storage | Supabase Storage | Cloud file hosting |
| AI/LLM | Together AI API | Chat, flashcard & quiz generation |
| Embeddings | intfloat/multilingual-e5-large-instruct | 1024-dim document embeddings |
| Migrations | Alembic | Database schema versioning |

### How Frontend Talks to Backend: YES, It's Through Hooks!

The answer is **yes** - the frontend communicates with the backend primarily through **custom React hooks** that wrap API calls. Here's the pattern:

```
Component (UI) → Custom Hook → api.js → HTTP Request → FastAPI Backend
     ↑                                                        ↓
     └────────────── State Update ← Response ← JSON ──────────┘
```

**Each feature has its own hook(s):**
- Chat: `useThreads()`, `useChatMessages()`
- Files: `useDocuments()`, `useFolders()`
- Flashcards: `useFlashcardNav()`
- Quizzes: `useQuizState()`
- Sharing: `useShareModal()`, `useQueryModal()`

---

## 2. FRONTEND-BACKEND COMMUNICATION PATTERN

### The Central API Service (`apps/web/src/lib/api.js`)

This is the **single bridge** between frontend and backend:

```javascript
// 1. Get Supabase session token
async function getAccessToken() {
  const supabase = createSupabaseBrowser();
  const { data: { session } } = await supabase.auth.getSession();
  return session?.access_token || (isDev ? "dev-token" : null);
}

// 2. Build auth headers (every request gets a Bearer token)
async function authHeaders(extra = {}) {
  const token = await getAccessToken();
  return { Authorization: `Bearer ${token}`, ...extra };
}

// 3. Exported API methods
export const api = {
  async get(path)        { /* fetch with GET    + auth */ },
  async post(path, body) { /* fetch with POST   + auth */ },
  async patch(path, body){ /* fetch with PATCH  + auth */ },
  async del(path)        { /* fetch with DELETE + auth */ },
  getAccessToken,        // exposed for SSE streaming
};
```

### Two Communication Patterns

**Pattern 1: Standard REST (Most features)**
```
Hook calls api.get/post/patch/del → Fetch API → FastAPI endpoint → JSON response
```

**Pattern 2: Server-Sent Events / SSE (Chat streaming)**
```
Hook uses raw fetch() with SSE parsing → FastAPI StreamingResponse → Token-by-token
Events: "token" (partial text) → "done" (final message + metadata)
```

### Request Flow Example: Loading Documents

```
1. FilesPage mounts
2. useDocuments() hook fires useEffect
3. Hook calls: api.get("/api/documents")
4. api.js: getAccessToken() → gets JWT from Supabase session
5. api.js: fetch("http://localhost:8000/api/documents", { headers: { Authorization: "Bearer <jwt>" } })
6. FastAPI: documents_router receives request
7. FastAPI: get_current_user() dependency validates JWT
8. FastAPI: DocumentService queries PostgreSQL via SQLAlchemy
9. FastAPI: Returns JSON array of documents
10. api.js: Parses response, returns to hook
11. Hook: Sets state with setDocuments(data)
12. Component: Re-renders with document list
```

---

## 3. AUTHENTICATION FLOW

### Registration & Login

```
┌─────────────────┐     ┌──────────────────┐     ┌──────────────────┐
│  Login/Signup    │     │  Supabase Auth   │     │  FastAPI Backend │
│  Page (React)    │     │  (Cloud Service) │     │  (JWT Validator) │
└────────┬────────┘     └────────┬─────────┘     └────────┬─────────┘
         │                       │                         │
         │  1. signInWithPassword│                         │
         │──────────────────────→│                         │
         │                       │                         │
         │  2. JWT access_token  │                         │
         │←──────────────────────│                         │
         │                       │                         │
         │  3. API call with Bearer token                  │
         │────────────────────────────────────────────────→│
         │                       │                         │
         │                       │  4. Validate JWT        │
         │                       │  (ES256 via JWKS or     │
         │                       │   HS256 via secret)     │
         │                       │                         │
         │  5. Protected data                              │
         │←────────────────────────────────────────────────│
```

### Key Auth Files

| File | Role |
|------|------|
| `apps/web/src/lib/supabase/client.js` | Browser-side Supabase client |
| `apps/web/src/lib/supabase/server.js` | Server-side Supabase client (cookies) |
| `apps/web/src/app/(auth)/login/page.js` | Login page (email + Google OAuth) |
| `apps/web/src/app/(auth)/signup/page.js` | Signup page |
| `apps/web/src/app/auth/callback/route.js` | OAuth callback handler |
| `apps/api/app/core/dependencies.py` | JWT validation + user extraction |

### Backend JWT Validation (`dependencies.py`)

```python
# The backend validates every request's JWT token:
async def get_current_user(credentials):
    token = credentials.credentials
    header = jwt.get_unverified_header(token)

    if header["alg"] in ("ES256", "RS256"):
        # Fetch signing key from Supabase JWKS endpoint
        key = get_supabase_signing_key(token)
    else:
        # HS256: Use shared JWT secret
        key = settings.supabase_jwt_secret

    payload = jwt.decode(token, key, algorithms=[...])
    return AuthenticatedUser(
        user_id=payload["sub"],
        email=payload.get("email")
    )
```

**Dev Mode Bypass**: When `debug=True` and `dev_user_id` is set, JWT validation is skipped.

---

## 4. API SERVICE LAYER (THE BRIDGE)

### How Hooks Use the API Service

Every dashboard feature follows this pattern:

```javascript
// Example: useDocuments hook (simplified)
export function useDocuments() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);

  // FETCH: Load documents on mount
  useEffect(() => {
    async function load() {
      const data = await api.get("/api/documents");  // ← api.js call
      setDocuments(data);
      setLoading(false);
    }
    load();
  }, []);

  // DELETE: Remove a document
  const deleteDocument = async (id) => {
    await api.del(`/api/documents/${id}`);              // ← api.js call
    setDocuments(prev => prev.filter(d => d.id !== id));
  };

  return { documents, loading, deleteDocument };
}
```

### Backend Receives It (`FastAPI Router`)

```python
# apps/api/app/documents/router.py
@router.get("/documents")
async def list_documents(user: CurrentUser, db: DbSession):
    # CurrentUser = JWT validated user (from dependencies.py)
    # DbSession = async SQLAlchemy session
    service = DocumentService(db)
    return await service.list_documents(user.user_id)
```

### Dependency Injection Pattern

```python
# FastAPI uses type annotations for automatic injection:
CurrentUser = Annotated[AuthenticatedUser, Depends(get_current_user)]
DbSession = Annotated[AsyncSession, Depends(get_db)]

# Every protected endpoint gets both automatically:
async def any_endpoint(user: CurrentUser, db: DbSession):
    # user.user_id → UUID of authenticated user
    # db → async database session
```

---

## 5. DASHBOARD COMPONENTS DEEP DIVE

### Dashboard Layout (`apps/web/src/app/dashboard/layout.jsx`)

```
┌──────────────────────────────────────────────────────────────────┐
│  Navbar (top bar with user avatar, notifications, theme toggle)  │
├──────────┬──────────────────────────────────────┬────────────────┤
│          │                                      │                │
│ Sidebar  │         Main Content Area            │  StudyAI Panel │
│ (320px)  │         (children pages)             │  (Right side)  │
│          │                                      │                │
│ ┌──────┐ │  Renders:                            │  Context-aware │
│ │Files │ │  - /dashboard → Home                 │  AI assistant  │
│ │Chat  │ │  - /dashboard/chat → Chat            │  that knows    │
│ │Quiz  │ │  - /dashboard/files → Files          │  what you're   │
│ │Flash │ │  - /dashboard/flashcards → Cards     │  studying      │
│ └──────┘ │  - /dashboard/quizzes → Quizzes      │                │
│          │                                      │                │
├──────────┴──────────────────────────────────────┴────────────────┤
│  Pomodoro Timer (floating, always accessible)                    │
└──────────────────────────────────────────────────────────────────┘
```

### Dashboard Home (`apps/web/src/app/dashboard/page.jsx`)

Displays:
- Greeting with user's name (from Supabase `profiles` table)
- "Continue where you left off" activity cards
- Tools grid: Pomodoro, Files, Chat, Quizzes, Flashcards
- Stats from API: `GET /api/chat/conversations` (count), `GET /api/documents` (count), etc.

---

## 6. CHAT FEATURE

### Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    Chat Page                                  │
│  ┌────────────┐  ┌──────────────────────────────────────┐    │
│  │ChatSidebar │  │         Message Area                   │    │
│  │            │  │  ┌─────────────────────────────────┐  │    │
│  │ Thread 1 ←─┤  │  │ MessageBubble (user)            │  │    │
│  │ Thread 2   │  │  │ MessageBubble (assistant)       │  │    │
│  │ Thread 3   │  │  │ MessageBubble (streaming...)    │  │    │
│  │            │  │  └─────────────────────────────────┘  │    │
│  │ [Search]   │  │                                       │    │
│  │ [+ New]    │  │  ┌─────────────────────────────────┐  │    │
│  │            │  │  │ ChatInput + Model Selector      │  │    │
│  └────────────┘  │  └─────────────────────────────────┘  │    │
│                  └──────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

### Hooks

**`useThreads()`** - Conversation list management
- `threads` - Array of conversation objects
- `loadThreads()` - Fetches `GET /api/chat/conversations`
- `renameThread(id, title)` - `PATCH /api/chat/conversations/{id}`
- `deleteThread(id)` - `DELETE /api/chat/conversations/{id}`
- `searchThreads(query)` - Client-side filtering

**`useChatMessages(threadId)`** - Message handling + SSE streaming
- `messages` - Array of message objects
- `sendMessage(text)` - Sends via SSE stream
- `isStreaming` - Boolean for loading state
- Auto-scroll to bottom on new messages

### SSE Streaming Flow (The Most Complex Part)

```
Frontend (useChatMessages)                    Backend (chat/service.py)
─────────────────────────                     ────────────────────────
1. User types message
2. fetch("/api/chat/stream", {
     method: "POST",
     body: { message, conversation_id }
   })
                                              3. Receive message
                                              4. Build message history
                                              5. FIRST LLM call (with RAG tool)
                                                 → Model decides: need docs?
                                              6. If YES → execute search_my_documents
                                                 → Vector similarity search
                                                 → Append results to context
                                              7. SECOND LLM call (streaming)
                                                 → Generate response with context
8. Parse SSE events:
   event: token                               ← yield "event: token\ndata: word\n\n"
   data: "The"

   event: token                               ← yield "event: token\ndata: answer\n\n"
   data: "answer"

   event: done                                ← yield "event: done\ndata: {json}\n\n"
   data: {"message_id":..., "sources":[...]}

9. Update messages state
10. Save conversation metadata
```

### Backend Chat Service

```python
# apps/api/app/chat/service.py (simplified)
async def stream_chat(user_id, message, conversation_id):
    # 1. Get or create conversation
    conv = await get_or_create_conversation(conversation_id)

    # 2. Load message history
    history = await get_messages(conv.id)

    # 3. Build messages array with system prompt
    messages = [{"role": "system", "content": SYSTEM_PROMPT}]
    messages += history + [{"role": "user", "content": message}]

    # 4. First call: Check if RAG tool needed
    response = llm.chat_with_tools(messages, tools=[SEARCH_TOOL])

    # 5. If tool called → execute search → append results
    if has_tool_calls(response):
        search_results = await execute_search(user_id, query)
        messages.append(tool_result_message(search_results))

    # 6. Stream final response
    async for token in llm.stream(messages):
        yield f"event: token\ndata: {token}\n\n"

    # 7. Save messages to DB
    yield f"event: done\ndata: {json.dumps(metadata)}\n\n"
```

---

## 7. FILES & FOLDERS FEATURE

### Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                        Files Page                                │
│  ┌──────────────┐  ┌──────────────────────────────────────────┐  │
│  │FolderSidebar │  │  FilterSortBar (type filter, sort)       │  │
│  │              │  ├──────────────────────────────────────────┤  │
│  │ All Files    │  │  DocumentRow (file1.pdf)  [Share][Del]   │  │
│  │ Folder A  ←──┤  │  DocumentRow (file2.txt)  [Share][Del]   │  │
│  │ Folder B     │  │  DocumentRow (notes.csv)  [Share][Del]   │  │
│  │ [+ Folder]   │  │                                          │  │
│  └──────────────┘  └──────────────────────────────────────────┘  │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │ UploadModal  │  │ ShareModal   │  │ AskDocumentModal    │    │
│  │ (drag-drop)  │  │ (link+email) │  │ (query single doc)  │    │
│  └──────────────┘  └──────────────┘  └─────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### Hooks

**`useDocuments()`**
```javascript
// Key operations:
api.get("/api/documents")                    // List all documents
api.post("/api/documents/upload", formData)   // Upload (multipart)
api.del(`/api/documents/${id}`)              // Delete document
```

**`useFolders()`**
```javascript
api.post("/api/folders", { name })                          // Create folder
api.get("/api/folders")                                     // List folders
api.patch(`/api/folders/${folderId}`, { name })             // Rename
api.del(`/api/folders/${folderId}`)                         // Delete
api.patch(`/api/folders/${fid}/documents/${did}`, {})       // Move doc to folder
```

### File Upload Flow

```
1. User drops file in UploadModal (react-dropzone)
2. Frontend creates FormData with file + optional folder_id
3. POST /api/documents/upload (multipart/form-data)
4. Backend validates: file type (PDF/TXT/CSV/PNG/JPG), size (≤10MB)
5. Upload to Supabase Storage: bucket="documents", path="{user_id}/{uuid}.{ext}"
6. Save metadata to PostgreSQL `documents` table
7. Trigger RAG processing: extract text → chunk → embed → store vectors
8. Return document object to frontend
9. Hook updates state, new file appears in list
```

### Backend Document Processing (After Upload)

```
Upload → Text Extraction → Chunking → Embedding → Storage
                ↓              ↓           ↓          ↓
         pypdf/direct    900-char      Together    document_chunks
         reading         chunks with   AI embed    table with
                         150-char      (1024-dim)  pgvector
                         overlap
```

---

## 8. FLASHCARDS FEATURE

### Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                     Flashcards Page                               │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  DeckSwitcher (dropdown of flashcard sets, color-coded)  │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │                  FlashcardViewer                          │    │
│  │  ┌──────────────────────────────────────────────────┐    │    │
│  │  │                                                  │    │    │
│  │  │     FRONT: What is photosynthesis?               │    │    │
│  │  │                                                  │    │    │
│  │  │        (click or Space to flip)                  │    │    │
│  │  │                                                  │    │    │
│  │  └──────────────────────────────────────────────────┘    │    │
│  │  [← Prev]    Card 3 of 15    [Next →]                   │    │
│  └──────────────────────────────────────────────────────────┘    │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  GenerateModal                                            │    │
│  │  Topic: [Biology]  Docs: [Select files]  Count: [15]     │    │
│  │  [Generate Flashcards]                                    │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### Hook: `useFlashcardNav()`

```javascript
// State managed:
- decks[]            // All flashcard sets
- activeDeckIndex    // Currently selected deck
- cardIndex          // Current card within deck
- flipped            // Is card showing front or back?

// API calls:
api.get("/api/flashcards/sets")                    // Load all sets
api.post("/api/flashcards/generate", {             // Generate new set
  topic, title, document_ids, folder_id, num_cards
})
api.del(`/api/flashcards/sets/${setId}`)           // Delete set

// Keyboard shortcuts:
Space → flip card
ArrowLeft → previous card
ArrowRight → next card
```

### Generation Flow

```
Frontend                              Backend
────────                              ───────
1. User selects topic + docs
2. POST /api/flashcards/generate
   { topic, document_ids, num_cards }
                                      3. RAG retrieve: top 12 chunks from selected docs
                                      4. Build prompt with FLASHCARD_SYSTEM_PROMPT
                                      5. LLM generates JSON:
                                         {"flashcards": [
                                           {"front": "Q?", "back": "A"},
                                           ...
                                         ]}
                                      6. Parse JSON response
                                      7. Create FlashcardSet + Flashcard records
                                      8. Store source_chunks for attribution
9. Receive new deck
10. Add to decks state
11. Navigate to new deck
```

---

## 9. QUIZZES FEATURE

### Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                       Quizzes Page                                │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  QuizSetSwitcher (dropdown of quiz sets)                  │    │
│  └──────────────────────────────────────────────────────────┘    │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────┐    │
│  │  QuizView (during quiz)           OR    ResultsView      │    │
│  │                                                          │    │
│  │  Q3: What organelle does               Score: 8/10       │    │
│  │      photosynthesis?                   ────────────      │    │
│  │                                        Q1: ✓             │    │
│  │  ○ A) Mitochondria                    Q2: ✓             │    │
│  │  ● B) Chloroplast  ←selected          Q3: ✗             │    │
│  │  ○ C) Nucleus                         ...               │    │
│  │  ○ D) Ribosome                                          │    │
│  │                                                          │    │
│  │  [Check Answer]                                          │    │
│  └──────────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────────┘
```

### Hook: `useQuizState()`

```javascript
// State managed:
- quizSets[]          // All quiz sets
- activeSetIndex      // Currently selected quiz
- questionIndex       // Current question
- selectedAnswer      // User's chosen option
- answers{}           // Map of question_id → user's answer
- showResults         // Show score breakdown

// API calls:
api.get("/api/quizzes/sets")                       // Load all sets
api.post("/api/quizzes/generate", {                // Generate new quiz
  topic, title, document_ids, folder_id, num_questions
})
api.del(`/api/quizzes/sets/${setId}`)              // Delete set

// Features:
- Shake animation on wrong answer (useShake hook)
- Explanation shown after answering
- Pomodoro integration (quiz-aware study sessions)
```

### Generation Flow (Same Pattern as Flashcards)

```
POST /api/quizzes/generate →
  RAG retrieval (top 12 chunks) →
    LLM with QUIZ_SYSTEM_PROMPT →
      JSON: {"questions": [{
        "question": "...",
        "options": ["A", "B", "C", "D"],
        "correct_option": "B",
        "explanation": "..."
      }]} →
        Create QuizSet + QuizQuestion records →
          Return to frontend
```

---

## 10. SHARE BUTTON FUNCTIONALITY

### Architecture

```
┌─────────────┐     ┌──────────────┐     ┌───────────────────┐
│  ShareModal  │     │   Backend    │     │   Shared Page     │
│  (Files page)│     │   Service    │     │   /shared/[token] │
└──────┬──────┘     └──────┬───────┘     └────────┬──────────┘
       │                    │                       │
       │ 1. POST /share-links                      │
       │ { expires_in_hours,│                       │
       │   recipient_emails }                      │
       │──────────────────→│                       │
       │                    │                       │
       │ 2. Generate token │                       │
       │ (crypto-secure)   │                       │
       │                    │                       │
       │ 3. Return share URL                       │
       │←──────────────────│                       │
       │                    │                       │
       │ 4. User copies link / sends emails        │
       │                    │                       │
       │                    │  5. GET /shared/{token}
       │                    │←─────────────────────│
       │                    │                       │
       │                    │  6. Verify access:    │
       │                    │  - Not expired?       │
       │                    │  - Not revoked?       │
       │                    │  - Email in recipients?│
       │                    │                       │
       │                    │  7. Return document   │
       │                    │─────────────────────→│
```

### Hook: `useShareModal()`

```javascript
// Operations:
createShareLink(docId, { expires_in_hours, recipient_emails })
  → POST /api/documents/{docId}/share-links
  → Returns: { share_token, share_url }

// The share URL format:
// {WEB_BASE_URL}/shared/{share_token}
```

### Share Access Levels

| Level | Description |
|-------|-------------|
| `"owner"` | Creator of the share link |
| `"recipient"` | Email listed in recipient_emails |
| `"link"` | Anyone with the token (if no email restriction) |

### Shared Document Page (`/shared/[token]`)

- Public page (no auth required for link-based access)
- Shows document preview
- Download button
- Import to own account (if authenticated)

### Backend Share Endpoints

```
POST   /api/documents/{id}/share-links          → Create share link
GET    /api/documents/shared/{token}             → Resolve & view
GET    /api/documents/shared/{token}/download    → Download file
POST   /api/documents/shared/{token}/import      → Copy to own account
DELETE /api/documents/{id}/share-links/{share_id}→ Revoke link
GET    /api/documents/shared/{token}/recipients  → List recipients
```

---

## 11. RAG PIPELINE (AI BRAIN)

### What is RAG?

**Retrieval-Augmented Generation**: Instead of the AI making up answers, it first searches your uploaded documents for relevant information, then generates answers based on that context.

### The Full Pipeline

```
Step 1: INDEXING (happens after file upload)
──────────────────────────────────────────
Document → Text Extraction → Chunking → Embedding → Vector Storage

PDF "biology.pdf"
    ↓
"Photosynthesis is the process by which plants convert..."
    ↓
Chunk 1: "Photosynthesis is the process..." (900 chars)
Chunk 2: "...convert light energy into..." (900 chars, 150 overlap)
Chunk 3: "...chemical energy stored in..." (900 chars, 150 overlap)
    ↓
[0.12, -0.45, 0.78, ...] (1024-dimensional vector per chunk)
    ↓
Stored in document_chunks table with pgvector


Step 2: RETRIEVAL (happens during chat/generation)
──────────────────────────────────────────────────
User Query → Embed Query → Vector Similarity Search → Top-K Chunks

"What is photosynthesis?"
    ↓
[0.11, -0.44, 0.79, ...] (query embedding)
    ↓
SELECT * FROM document_chunks
ORDER BY embedding <=> query_embedding  -- cosine similarity
LIMIT 12
    ↓
Returns most relevant chunks from user's documents


Step 3: GENERATION (LLM produces answer)
────────────────────────────────────────
System Prompt + Retrieved Context + User Question → LLM → Answer

[System: "You are a study assistant..."]
[Context: "Chunk 1: Photosynthesis is... Chunk 2: Plants use chlorophyll..."]
[User: "What is photosynthesis?"]
    ↓
LLM (Llama 3.3 70B via Together AI)
    ↓
"Photosynthesis is the process by which plants convert light energy
into chemical energy, using chlorophyll in their chloroplasts..."
```

### RAG in Chat vs Flashcards/Quizzes

| Feature | RAG Usage |
|---------|-----------|
| Chat | Tool-calling: LLM decides when to search (`search_my_documents` tool) |
| Flashcards | Always retrieves top 12 chunks from selected documents |
| Quizzes | Always retrieves top 12 chunks from selected documents |
| Ask Document | Retrieves from single specific document |

---

## 12. STATE MANAGEMENT & CONTEXT PROVIDERS

### Provider Hierarchy (Root Layout)

```jsx
// apps/web/src/app/layout.js
<ThemeProvider>           // Light/dark mode
  <NotificationsProvider> // Toast notifications
    <PomodoroProvider>    // Global timer state
      <StudyAIPanelProvider> // AI panel context
        {children}
      </StudyAIPanelProvider>
    </PomodoroProvider>
  </NotificationsProvider>
</ThemeProvider>
```

### Context Providers Explained

| Provider | Hook | What It Manages |
|----------|------|-----------------|
| `ThemeProvider` | `useTheme()` | Dark/light mode, localStorage persistence |
| `NotificationsProvider` | `useNotifications()` | Toast queue, read/unread tracking |
| `PomodoroProvider` | `usePomodoro()` | Timer state, settings, localStorage |
| `StudyAIPanelProvider` | `useStudyAIPanel()` | AI panel open/close, context-aware chat |

### StudyAI Panel (Context-Aware AI)

The StudyAI panel is a **context-aware assistant** embedded in the dashboard:

```javascript
// When studying flashcards, it knows the current card:
setStudyContext({
  type: "flashcard",
  front: "What is mitosis?",
  back: "Cell division process..."
});

// When taking a quiz, it knows the current question:
setStudyContext({
  type: "quiz",
  question: "What organelle...",
  options: ["A", "B", "C", "D"]
});

// The AI panel uses this context in its prompt:
// "The student is currently studying this flashcard: [front/back]"
```

### State Management Patterns Used

1. **React Context** - Global UI state (theme, notifications, pomodoro, AI panel)
2. **useState/useEffect** - Local component state in custom hooks
3. **useCallback** - Memoized functions returned from hooks
4. **localStorage** - Persistence for theme, pomodoro settings, chat model
5. **Supabase Session** - Auth state managed by Supabase client

---

## 13. DATABASE SCHEMA & MODELS

### Entity Relationship Diagram

```
                    ┌──────────────┐
                    │    User      │ (Supabase Auth - external)
                    │  (user_id)   │
                    └──────┬───────┘
                           │ owns
          ┌────────────────┼────────────────┐
          ↓                ↓                ↓
   ┌──────────┐    ┌──────────────┐  ┌──────────────────┐
   │ folders  │    │ conversations│  │ flashcard_sets   │
   │          │    │ (Supabase)   │  │                  │
   └────┬─────┘    └──────┬───────┘  └────────┬─────────┘
        │                 │                    │
        ↓                 ↓                    ↓
   ┌──────────┐    ┌──────────────┐  ┌──────────────────┐
   │documents │    │  messages    │  │  flashcards      │
   │          │    │ (Supabase)   │  │  (front, back)   │
   └────┬─────┘    └──────────────┘  └──────────────────┘
        │
   ┌────┴──────────────┐
   ↓                   ↓
┌─────────────┐  ┌───────────────────┐
│document_    │  │processing_        │
│shares       │  │documents          │
│             │  │                   │
└─────┬───────┘  └────────┬──────────┘
      ↓                   ↓
┌─────────────┐  ┌───────────────────┐
│document_    │  │document_chunks    │
│share_       │  │(content, embedding│
│recipients   │  │ pgvector 1024-dim)│
└─────────────┘  └───────────────────┘

   ┌──────────────────┐
   │  quiz_sets       │ (also owned by user)
   └────────┬─────────┘
            ↓
   ┌──────────────────┐
   │  quiz_questions  │
   │  (question,      │
   │   options[],     │
   │   correct_option,│
   │   explanation)   │
   └──────────────────┘
```

### Key Tables

| Table | Key Columns | Notes |
|-------|------------|-------|
| `documents` | id, user_id, folder_id, filename, file_type, file_size, storage_path | Core file metadata |
| `folders` | id, user_id, name | Document organization |
| `document_shares` | id, document_id, share_token, expires_at, is_revoked | Share links |
| `document_share_recipients` | id, share_id, recipient_email | Email-based access control |
| `processing_documents` | id, title, status (pending/processing/ready/error) | RAG indexing status |
| `document_chunks` | id, document_id, chunk_index, content, embedding (vector 1024) | RAG vector storage |
| `flashcard_sets` | id, user_id, title, document_ids (JSON), source_chunks (JSON) | Flashcard collections |
| `flashcards` | id, set_id, front, back, position | Individual cards |
| `quiz_sets` | id, user_id, title, document_ids (JSON) | Quiz collections |
| `quiz_questions` | id, set_id, question, options (JSON), correct_option, explanation | Individual questions |
| `conversations` | id, user_id, title (Supabase-managed) | Chat threads |
| `messages` | id, conversation_id, role, content, sources (Supabase-managed) | Chat messages |

### Migrations (Alembic)

```
20260129 → create_documents_table
20260211 → add_processing_tables (RAG)
20260212 → pgvector_public_schema
20260221 → add_folders
20260224 → add_document_shares + profile policies
20260302 → fix_embedding_dimension (→ 1024)
20260302 → add_flashcard_quiz_tables
20260302 → add_flashcard_set_source_chunks
```

---

## 14. KEY CODE PATHS (FILE REFERENCES)

### Frontend Critical Files

| File | Purpose |
|------|---------|
| `apps/web/src/lib/api.js` | Central API service (THE bridge) |
| `apps/web/src/lib/supabase/client.js` | Browser Supabase client |
| `apps/web/src/app/layout.js` | Root layout with all providers |
| `apps/web/src/app/dashboard/layout.jsx` | Dashboard shell + sidebar + AI panel |
| `apps/web/src/app/dashboard/page.jsx` | Dashboard home |
| `apps/web/src/app/dashboard/chat/hooks/useChatMessages.js` | SSE streaming logic |
| `apps/web/src/app/dashboard/chat/hooks/useThreads.js` | Conversation management |
| `apps/web/src/app/dashboard/files/hooks/useDocuments.js` | Document CRUD |
| `apps/web/src/app/dashboard/files/hooks/useFolders.js` | Folder management |
| `apps/web/src/app/dashboard/files/hooks/useShareModal.js` | Share functionality |
| `apps/web/src/app/dashboard/flashcards/hooks/useFlashcardNav.js` | Flashcard state |
| `apps/web/src/features/quiz/hooks/useQuizState.js` | Quiz state |
| `apps/web/src/app/components/StudyAIPanelProvider.jsx` | Context-aware AI |
| `apps/web/src/app/components/PomodoroProvider.jsx` | Pomodoro timer |
| `apps/web/src/app/components/ThemeProvider.jsx` | Dark/light mode |

### Backend Critical Files

| File | Purpose |
|------|---------|
| `apps/api/app/main.py` | FastAPI app, middleware, router registration |
| `apps/api/app/core/config.py` | Settings (env vars, defaults) |
| `apps/api/app/core/dependencies.py` | JWT validation, dependency injection |
| `apps/api/app/core/database.py` | Async SQLAlchemy setup |
| `apps/api/app/core/supabase.py` | Supabase Storage client |
| `apps/api/app/documents/router.py` | Document endpoints |
| `apps/api/app/documents/service.py` | Document business logic + sharing |
| `apps/api/app/chat/router.py` | Chat endpoints |
| `apps/api/app/chat/service.py` | Chat logic + SSE streaming |
| `apps/api/app/chat/tools.py` | RAG tool definition for chat |
| `apps/api/app/processing/service.py` | RAG pipeline (chunk, embed, search) |
| `apps/api/app/flashcards/service.py` | Flashcard generation |
| `apps/api/app/quizzes/service.py` | Quiz generation |
| `apps/api/app/inference/llm.py` | Together AI LLM client |
| `apps/api/app/inference/prompts.py` | System prompts for all AI features |

---

## 15. COMMON INTERVIEW/REVIEW QUESTIONS

### Architecture Questions

**Q: How does the frontend communicate with the backend?**
A: Through custom React hooks that use a centralized `api.js` service. The api.js wraps fetch() calls with automatic JWT token injection from Supabase Auth. Each feature (chat, files, flashcards, quizzes) has dedicated hooks that encapsulate API calls and state management.

**Q: Why use hooks instead of a state management library like Redux?**
A: The app uses React Context for global state (theme, notifications, pomodoro) and custom hooks for feature-specific state. This is sufficient because each feature's state is relatively isolated - chat state doesn't need to know about flashcard state. Hooks + Context keeps things simple without the boilerplate of Redux.

**Q: How does authentication work end-to-end?**
A: Supabase Auth handles registration/login and issues JWTs. The frontend stores the session via Supabase client. On every API call, `api.js` extracts the access_token from the Supabase session and sends it as a Bearer token. The FastAPI backend validates the JWT using either ES256 (JWKS) or HS256 (shared secret) and extracts the user_id.

**Q: What is the role of SSE in the chat feature?**
A: Server-Sent Events enable real-time token-by-token streaming of AI responses. The frontend makes a POST to `/api/chat/stream` and receives incremental `token` events that update the UI in real-time, followed by a `done` event with metadata. This provides a ChatGPT-like typing effect.

### Feature-Specific Questions

**Q: How does the RAG pipeline work?**
A: After upload, documents are: (1) text-extracted, (2) chunked into 900-char segments with 150-char overlap, (3) embedded into 1024-dim vectors via Together AI, (4) stored in PostgreSQL with pgvector. During queries, the user's question is embedded and a cosine similarity search finds the most relevant chunks, which are fed to the LLM as context.

**Q: How does the chat decide when to search documents?**
A: The chat uses tool-calling. The first LLM call includes a `search_my_documents` tool definition. The model autonomously decides whether the query needs document context. If it calls the tool, the backend executes a vector search, appends results, and makes a second streaming call with the context.

**Q: How does document sharing work?**
A: When sharing, the backend generates a cryptographically secure token and optionally associates recipient emails. The share URL is `{WEB_BASE_URL}/shared/{token}`. Access is verified by checking: (1) token validity, (2) not expired, (3) not revoked, (4) email in recipients list (if restricted). Recipients can view, download, or import (copy) the document.

**Q: How are flashcards and quizzes generated?**
A: Both follow the same pattern: (1) RAG retrieval of top 12 chunks from selected documents, (2) LLM call with a specialized system prompt requesting structured JSON output, (3) Parse the JSON response, (4) Store as database records (FlashcardSet/Flashcard or QuizSet/QuizQuestion).

**Q: What is the StudyAI Panel?**
A: It's a context-aware AI assistant embedded in the dashboard layout. It knows what you're currently studying (current flashcard, quiz question) via React Context (`StudyAIPanelProvider`). It uses ephemeral chats (not saved by default) but has a "Save to Chat" feature to persist useful conversations.

### Code Quality Questions

**Q: How is error handling done?**
A: Frontend: api.js throws on non-OK responses, hooks catch errors and set error state. Backend: FastAPI raises HTTPException with status codes and detail messages. The backend also has structured logging for debugging.

**Q: How is the codebase organized?**
A: Monorepo with `apps/web` (frontend) and `apps/api` (backend). Frontend uses Next.js App Router with feature-based organization (each dashboard feature has its own `components/` and `hooks/` directories). Backend uses domain-driven modules (documents, chat, flashcards, quizzes, processing) each with their own router, service, and models.

**Q: What database patterns are used?**
A: Async SQLAlchemy with `asyncpg` driver, connection pooling configured for Supabase's pgbouncer, CASCADE deletes for related records, JSONB columns for flexible metadata (source_chunks, document_ids), and pgvector indexes for similarity search.

**Q: How does the frontend handle loading and streaming states?**
A: Each hook manages its own `loading` boolean. For chat streaming, there's an `isStreaming` state that's true while SSE events are being received. Components show loading spinners or skeleton UIs based on these states. Optimistic updates are used for chat (user message appears immediately before the API responds).

### Design Decision Questions

**Q: Why Supabase for auth instead of custom auth?**
A: Supabase provides battle-tested JWT auth with built-in Google OAuth, session management, and user profiles - no need to implement password hashing, token refresh, or OAuth flows from scratch.

**Q: Why Together AI instead of OpenAI?**
A: Together AI provides access to open-source models (Llama 3.3 70B) with tool-calling support, streaming, and structured JSON generation at competitive pricing.

**Q: Why pgvector instead of a dedicated vector DB like Pinecone?**
A: pgvector keeps everything in one PostgreSQL database, reducing infrastructure complexity. For the scale of a study app, pgvector's performance is more than sufficient and simplifies deployment.

**Q: Why SSE instead of WebSockets for chat?**
A: SSE is simpler for unidirectional streaming (server → client), which is all chat needs. The client sends messages via regular POST requests. WebSockets would add unnecessary complexity for bidirectional communication that isn't needed here.

---

## QUICK REFERENCE: REQUEST FLOW CHEAT SHEET

```
┌──────────────────────────────────────────────────────────────────────┐
│  EVERY REQUEST FOLLOWS THIS PATH:                                    │
│                                                                      │
│  Component → Hook → api.js → getAccessToken() → fetch() with JWT    │
│       ↑                                              ↓               │
│       └── setState(data) ← parse JSON ← FastAPI endpoint            │
│                                              ↓                       │
│                                     get_current_user() (JWT check)   │
│                                              ↓                       │
│                                     Service class (business logic)   │
│                                              ↓                       │
│                                     SQLAlchemy (database query)      │
│                                              ↓                       │
│                                     PostgreSQL / Supabase Storage    │
└──────────────────────────────────────────────────────────────────────┘
```

---

*Generated for StudyBudd Code Review Preparation*
