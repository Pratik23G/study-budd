# StudyBudd Production Readiness Report

**Date:** March 19, 2026
**Prepared by:** Pratik Gurung + Claude Code
**Project:** StudyBudd — AI-Powered Study Platform

---

## 1. Executive Summary

This document details all changes made to prepare StudyBudd for production
deployment. The primary goal was to protect the Together AI API key from
excessive usage and abuse, while keeping the app functional for a LinkedIn
demo with a $20-30 API budget.

Three phases of work were completed:
- **Phase 1:** Backend rate limiting and daily token budget enforcement
- **Phase 2:** Token usage optimization (reduced costs by ~50%)
- **Phase 3:** Frontend error handling and request debouncing

---

## 2. Problem Statement

### Before These Changes

| Risk                        | Status Before     |
|-----------------------------|-------------------|
| Rate limiting               | None              |
| Token usage tracking        | None              |
| Daily spending cap          | None              |
| Frontend error handling     | Browser `alert()` |
| Chat request debouncing     | None              |
| Max tokens per chat         | 1024 (excessive)  |
| RAG context chunks          | 12 (excessive)    |

**Impact:** Any authenticated user could send unlimited requests to the AI
endpoints, draining the Together AI API key with no warning. A single user
running a loop could exhaust a $25 budget in minutes.

---

## 3. Architecture Overview

```
User Request Flow (After Changes):

  [Browser] ──> [Supabase Auth] ──> [Rate Limiter] ──> [Token Budget] ──> [Together AI]
      │               │                   │                  │                │
      │          401 if no JWT       429 if over        503 if daily      API call
      │                               limit             budget hit
      │
      │<── Friendly error message shown in UI (not browser alert)
```

### Protection Layers

```
Layer 1: Authentication (pre-existing)
  - Supabase JWT required on all AI endpoints
  - Unauthenticated users cannot access AI features

Layer 2: Rate Limiting (NEW)
  - Per-user, per-action sliding window
  - Chat: 10 requests/minute
  - Generation: 3 requests/hour (shared between flashcards + quizzes)

Layer 3: Token Budget (NEW)
  - Global daily cap: 200,000 tokens
  - Auto-resets at UTC midnight
  - Blocks all AI requests when exceeded

Layer 4: Frontend Debouncing (NEW)
  - 1-second minimum between chat sends
  - Prevents accidental double-sends
```

---

## 4. Files Changed

### New Files Created

| File                                | Purpose                              |
|-------------------------------------|--------------------------------------|
| `apps/api/app/core/rate_limiter.py` | In-memory per-user rate limiter      |
| `apps/api/app/core/token_budget.py` | Global daily token budget tracker    |
| `plan_deployment.md`                | Deployment plan with Mermaid diagrams|

### Backend Files Modified

| File                                    | Changes Made                                    |
|-----------------------------------------|-------------------------------------------------|
| `apps/api/app/core/config.py`           | Added rate limit + budget settings, reduced max_tokens 1024 -> 512 |
| `apps/api/app/main.py`                  | Initialize token budget, added budget info to /health endpoint |
| `apps/api/app/chat/router.py`           | Added rate limit + budget checks before chat endpoints |
| `apps/api/app/chat/service.py`          | Added token usage tracking on streaming chat responses |
| `apps/api/app/flashcards/router.py`     | Added rate limit + budget checks before flashcard generation |
| `apps/api/app/quizzes/router.py`        | Added rate limit + budget checks before quiz generation |
| `apps/api/app/inference/client.py`      | Added token usage tracking on all LLM calls |
| `apps/api/app/flashcards/service.py`    | Reduced RAG top_k: 12 -> 6 |
| `apps/api/app/quizzes/service.py`       | Reduced RAG top_k: 12 -> 6 |

### Frontend Files Modified

| File                                                              | Changes Made                                          |
|-------------------------------------------------------------------|-------------------------------------------------------|
| `apps/web/src/app/dashboard/chat/hooks/useChatMessages.js`        | Added debouncing, friendly error messages for 429/503 |
| `apps/web/src/app/dashboard/flashcards/hooks/useFlashcardNav.js`  | Friendly error messages for 429/503 responses         |
| `apps/web/src/features/quiz/hooks/useQuizState.js`                | Friendly error messages for 429/503 responses         |
| `apps/web/src/app/dashboard/flashcards/components/GenerateModal.jsx` | Replaced alert() with inline error banner          |
| `apps/web/src/features/quiz/components/GenerateQuizModal.jsx`     | Replaced alert() with inline error banner             |

---

## 5. Detailed Change Descriptions

### 5.1 Rate Limiter (`rate_limiter.py`)

**What it does:**
Implements a sliding-window rate limiter that tracks request timestamps
per (user_id, action) pair. When a user exceeds the allowed number of
requests within the time window, subsequent requests are rejected with
HTTP 429.

**How it works:**
1. Each request records a timestamp in an in-memory dictionary
2. On each check, timestamps older than the window are pruned
3. If remaining count >= max_requests, the request is denied
4. The rate limiter is a singleton shared across all routes

**Configuration (via environment variables):**
- `RATE_LIMIT_CHAT_MAX=10` (requests per window)
- `RATE_LIMIT_CHAT_WINDOW=60` (window in seconds)
- `RATE_LIMIT_GENERATE_MAX=3` (requests per window)
- `RATE_LIMIT_GENERATE_WINDOW=3600` (window in seconds)

**Limitations:**
- In-memory only — resets on server restart
- Not shared across multiple server processes/instances
- Sufficient for single-instance deployments (Railway, Render, Fly.io)

### 5.2 Token Budget (`token_budget.py`)

**What it does:**
Tracks total token consumption across ALL users per UTC day. When the
daily limit is reached, all AI endpoints return HTTP 503 until midnight
UTC when the counter resets.

**How it works:**
1. `check()` — returns True if budget remains, False if exhausted
2. `record(n)` — deducts n tokens from the daily budget
3. `_maybe_reset()` — auto-resets at UTC midnight (no cron needed)

**Token counting strategy:**
- For `generate_json()` (flashcards/quizzes): Uses `response.usage.total_tokens`
  from Together AI's response object (exact count when available)
- For streaming chat: Estimates tokens as `input_chars / 4 + output_chunks`
- Fallback: `(input_chars + output_chars) / 4` when exact count unavailable

**Configuration:**
- `DAILY_TOKEN_BUDGET=200000` (default: 200K tokens/day)

### 5.3 Config Changes (`config.py`)

- `together_max_tokens`: 1024 -> 512 (halves output cost)
- Added 5 new settings: rate limits (4) + daily budget (1)
- All configurable via environment variables for easy production tuning

### 5.4 Token Optimization

| Change                    | Before | After | Cost Reduction |
|---------------------------|--------|-------|----------------|
| Chat max output tokens    | 1024   | 512   | ~50% output    |
| Flashcard RAG chunks      | 12     | 6     | ~50% input     |
| Quiz RAG chunks           | 12     | 6     | ~50% input     |

**Why this is safe:**
- 512 tokens is approximately 400 words — more than enough for a study
  assistant response
- 6 RAG chunks still provide sufficient context for quality flashcard/quiz
  generation (each chunk is ~900 characters with 150-char overlap)

### 5.5 Frontend Error Handling

**Before:** Browser `alert()` popups with raw error messages.

**After:**
- Chat: Error messages appear inline as assistant messages (styled differently)
- Flashcard/Quiz modals: Red error banner appears inside the modal
- All errors are human-readable:
  - 429: "You've reached the generation limit. Please wait..."
  - 503: "Daily AI usage limit reached. The service will reset tomorrow."
  - 401: "Your session has expired. Please log in again."

### 5.6 Chat Debouncing

Added a 1-second minimum gap between chat sends using a `useRef` timestamp.
Prevents accidental double-sends and reduces unnecessary API calls.

---

## 6. Health Endpoint

The `/health` endpoint now returns token budget status:

```json
{
    "status": "healthy",
    "database_connected": true,
    "token_budget": {
        "used": 45230,
        "remaining": 154770,
        "daily_limit": 200000
    }
}
```

This allows monitoring of API usage without needing to check the
Together AI dashboard.

---

## 7. Cost Estimation

### Together AI Pricing (Llama 3.3 70B Instruct Turbo)

| Type     | Price per 1M tokens |
|----------|---------------------|
| Input    | ~$0.88              |
| Output   | ~$0.88              |
| Embedding| ~$0.016             |

### Projected Usage

| Scenario                  | Est. Tokens   | Est. Cost      |
|---------------------------|---------------|----------------|
| LinkedIn demo (~50 users) | ~1.5M tokens  | $1.50 - $3.00  |
| Medium traffic (200 users)| ~6M tokens    | $6.00 - $10.00 |
| Heavy usage (500 users)   | ~15M tokens   | $13.00 - $20.00|
| Daily cap (safety net)    | 200K/day max  | ~$0.18/day     |

With the daily cap, the absolute maximum daily spend is ~$0.18, meaning
a $25 budget lasts at minimum **138 days** even under constant maximum load.

---

## 8. Remaining Issues & Recommendations

### Issues Still To Be Resolved

| Issue                              | Priority | Notes                                   |
|------------------------------------|----------|-----------------------------------------|
| Replace Eshaan's API key           | Critical | Get your own Together AI key before deploy |
| Deploy backend                     | Critical | Needs a host (Railway/Render/Fly.io)    |
| CORS configuration                 | High     | Currently `allow_origins=["*"]` — should restrict to Vercel domain |
| Embedding caching                  | Medium   | Re-embedding same docs wastes tokens    |
| Persistent rate limiting           | Low      | Current in-memory limiter resets on restart |
| Token usage database logging       | Low      | Currently logs to console only           |

### Guardrails Considered

| Guardrail                    | Status      | Rationale                                |
|------------------------------|-------------|------------------------------------------|
| Supabase JWT auth            | Existing    | All AI endpoints require authentication  |
| Per-user rate limiting       | Implemented | Prevents single-user abuse               |
| Global daily token cap       | Implemented | Hard spending ceiling                    |
| Frontend debouncing          | Implemented | Prevents accidental rapid-fire           |
| Input length validation      | Not needed  | Together AI has its own context limits   |
| Prompt injection filtering   | Not needed  | App is a study tool, not a public chatbot|
| IP-based rate limiting       | Not needed  | Auth-gated endpoints are sufficient      |
| Per-user daily limits        | Optional    | Global cap is sufficient for demo scale  |

### Why Some Guardrails Were Skipped

- **Input validation/sanitization:** The app sends user input directly to
  Together AI (not to a database query), so SQL injection is not applicable.
  Prompt injection is low-risk because the LLM only has access to the user's
  own documents via RAG.

- **IP-based rate limiting:** All AI endpoints already require Supabase
  authentication. An attacker would need valid credentials, making IP-based
  limits redundant at demo scale.

- **Per-user daily limits:** The global daily cap (200K tokens) provides
  sufficient protection. Per-user limits would add complexity without
  meaningful benefit for a 50-200 user demo.

---

## 9. Deployment Checklist

```
Pre-Deploy:
[x] Rate limiting implemented
[x] Token budget implemented
[x] Token usage optimized
[x] Frontend error handling updated
[ ] Get own Together AI API key
[ ] Update .env with new API key

Deploy:
[ ] Deploy frontend to Vercel
[ ] Deploy backend to Railway/Render/Fly.io
[ ] Set environment variables in production
[ ] Restrict CORS to Vercel domain
[ ] Test end-to-end flow

Post-Deploy:
[ ] Monitor /health endpoint for token usage
[ ] Verify rate limiting works in production
[ ] Share LinkedIn demo link
```

---

## 10. Environment Variables Reference

| Variable                    | Default              | Description                        |
|-----------------------------|----------------------|------------------------------------|
| `TOGETHER_API_KEY`          | (required)           | Your Together AI API key           |
| `TOGETHER_MODEL`            | Llama-3.3-70B-Turbo  | LLM model for chat/generation      |
| `TOGETHER_MAX_TOKENS`       | 512                  | Max output tokens per response     |
| `TOGETHER_TEMPERATURE`      | 0.7                  | LLM temperature for chat           |
| `RATE_LIMIT_CHAT_MAX`       | 10                   | Max chat requests per window       |
| `RATE_LIMIT_CHAT_WINDOW`    | 60                   | Chat rate limit window (seconds)   |
| `RATE_LIMIT_GENERATE_MAX`   | 3                    | Max generation requests per window |
| `RATE_LIMIT_GENERATE_WINDOW`| 3600                 | Generation rate limit window (sec) |
| `DAILY_TOKEN_BUDGET`        | 200000               | Global daily token limit           |
