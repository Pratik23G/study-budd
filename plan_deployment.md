# StudyBudd Deployment & API Cost Optimization Plan

## Overview

Deploy StudyBudd to Vercel (frontend) with a protected FastAPI backend,
optimized to keep Together AI costs under $25 for a LinkedIn demo.

---

## Architecture

```mermaid
graph TB
    subgraph "Frontend - Vercel"
        A[Next.js App] -->|Supabase Auth| B[JWT Token]
    end

    subgraph "Backend - FastAPI"
        B -->|Bearer Token| C[Auth Middleware]
        C --> D{Rate Limiter}
        D -->|Allowed| E[API Routes]
        D -->|Blocked| F[429 Too Many Requests]
        E --> G[Token Budget Check]
        G -->|Under Limit| H[AI Services]
        G -->|Over Limit| I[503 Budget Exceeded]
    end

    subgraph "AI Services"
        H --> J[Chat Service]
        H --> K[Flashcard Generator]
        H --> L[Quiz Generator]
        H --> M[Embedding Service]
    end

    subgraph "Together AI"
        J -->|Llama 3.3 70B| N[LLM API]
        K -->|Llama 3.3 70B| N
        L -->|Llama 3.3 70B| N
        M -->|e5-large| O[Embedding API]
    end

    subgraph "Database - Supabase"
        P[(PostgreSQL + pgvector)]
        Q[Auth Service]
        E --> P
        C --> Q
    end
```

---

## Request Flow with Protections

```mermaid
sequenceDiagram
    participant U as User
    participant FE as Frontend (Vercel)
    participant RL as Rate Limiter
    participant TB as Token Budget
    participant AI as Together AI
    participant DB as Supabase DB

    U->>FE: Sends chat/generate request
    FE->>RL: POST /api/chat/stream (JWT)

    alt Not Authenticated
        RL-->>FE: 401 Unauthorized
    end

    alt Rate Limit Exceeded
        RL-->>FE: 429 Too Many Requests
    end

    RL->>TB: Check daily token usage
    alt Budget Exceeded
        TB-->>FE: 503 Daily limit reached
    end

    TB->>AI: Forward request
    AI-->>TB: Stream response + token count
    TB->>DB: Log token usage
    TB-->>FE: Stream response to user
    FE-->>U: Display answer
```

---

## Rate Limiting Strategy

```mermaid
graph LR
    subgraph "Per-User Limits (per minute)"
        A[Chat Messages] -->|10/min| D[Rate Limiter]
        B[Flashcard Gen] -->|3/hour| D
        C[Quiz Gen] -->|3/hour| D
    end

    subgraph "Global Limits (per day)"
        D --> E{Daily Token Budget}
        E -->|Under 200K tokens| F[Allow]
        E -->|Over 200K tokens| G[Block All Users]
    end
```

---

## Token Optimization Changes

```mermaid
graph TD
    subgraph "Before (Current)"
        A1[Chat max_tokens: 1024]
        B1[RAG top_k: 12 chunks]
        C1[No caching]
        D1[No usage tracking]
        E1[No rate limits]
    end

    subgraph "After (Optimized)"
        A2[Chat max_tokens: 512]
        B2[RAG top_k: 6 chunks]
        C2[Embedding cache]
        D2[Token usage logging per request]
        E2[Per-user + global rate limits]
    end

    A1 -.->|~50% fewer output tokens| A2
    B1 -.->|~50% fewer input tokens| B2
    C1 -.->|Skip redundant API calls| C2
    D1 -.->|Monitor spending| D2
    E1 -.->|Prevent abuse| E2
```

---

## Estimated Token Budget

```mermaid
pie title Token Budget Breakdown ($25 Together AI)
    "Chat Messages (~60%)" : 60
    "Flashcard Generation (~15%)" : 15
    "Quiz Generation (~15%)" : 15
    "Embeddings (~5%)" : 5
    "Buffer (~5%)" : 5
```

---

## Cost Estimation

```
+-------------------------+------------------+------------------+
| Scenario                | Tokens Used      | Estimated Cost   |
+-------------------------+------------------+------------------+
| LinkedIn Demo (~50 ppl) | ~1.5M tokens     | ~$1.50 - $3.00   |
| Medium traffic (200 ppl)| ~6M tokens       | ~$6.00 - $10.00  |
| Heavy usage (500 ppl)   | ~15M tokens      | ~$13.00 - $20.00 |
| Daily cap (safety net)  | 200K tokens/day  | ~$0.18/day max   |
+-------------------------+------------------+------------------+
```

---

## Implementation Checklist

```
Phase 1: API Protection (Must-have before deploy)
=================================================
[x] Add in-memory rate limiter middleware to FastAPI
    - 10 requests/min per user for chat
    - 3 requests/hour per user for flashcard/quiz generation
[x] Add global daily token budget tracker
    - Hard cap at 200K tokens/day
    - Return 503 when exceeded
[x] Verify all AI endpoints require Supabase JWT auth

Phase 2: Token Optimization
============================
[x] Reduce chat max_tokens: 1024 -> 512
[x] Reduce flashcard/quiz RAG top_k: 12 -> 6
[x] Add token usage logging per request
[ ] Cache document embeddings (skip re-embedding)

Phase 3: Frontend Safeguards
==============================
[x] Add request debouncing on chat input
[x] Show user-friendly error on rate limit (429)
[x] Show user-friendly error on budget exceeded (503)

Phase 4: Deploy
================
[ ] Replace Together AI API key with your own
[ ] Deploy frontend to Vercel
[ ] Deploy backend (Railway / Render / Fly.io)
[ ] Set environment variables in production
[ ] Test end-to-end flow
```

---

## Deployment Architecture

```mermaid
graph TB
    subgraph "Vercel"
        FE[Next.js Frontend]
    end

    subgraph "Railway / Render"
        BE[FastAPI Backend]
    end

    subgraph "Supabase Cloud"
        DB[(PostgreSQL + pgvector)]
        AUTH[Auth Service]
    end

    subgraph "Together AI"
        LLM[Llama 3.3 70B API]
        EMB[Embedding API]
    end

    FE -->|HTTPS| BE
    BE -->|SQL| DB
    BE -->|JWT Verify| AUTH
    BE -->|Inference| LLM
    BE -->|Vectors| EMB
    FE -->|Auth Flow| AUTH
```

---

## Files to Modify

```
apps/api/
  app/
    main.py              -> Add rate limiter middleware
    core/
      config.py          -> Add rate limit + budget settings
      rate_limiter.py    -> NEW: Rate limiting logic
      token_budget.py    -> NEW: Daily token budget tracker
    inference/
      client.py          -> Add token usage logging
    chat/
      service.py         -> Reduce max_tokens
    flashcards/
      service.py         -> Reduce top_k
    quizzes/
      service.py         -> Reduce top_k

apps/web/
  src/app/
    dashboard/chat/
      hooks/useChatMessages.js -> Add debounce + error handling
```
