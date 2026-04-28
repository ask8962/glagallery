# GLA Bot Architecture

This document details the architecture of the **GLA Bot** (Campus AI Assistant), a resilient and cost-effective AI chat system integrated into CampusHub.

## 🎯 Overview

GLA Bot is designed to provide students with instant answers about campus events, clubs, and platform features. It prioritizes **reliability** (uptime) and **low latency** using a multi-provider fallback strategy and aggressive caching.

## 🏗️ Core Architecture

```mermaid
graph TD
    User[Frontend Client] -->|POST /api/chat| API[Next.js API Route]
    API -->|1. Auth Check| FirebaseAuth[Firebase Auth]
    API -->|2. Rate Limit| UpstashRate[Upstash Ratelimit]
    API -->|3. Cache Check| UpstashRedis[Upstash Redis Cache]
    
    UpstashRedis -- Miss --> AI[AI Provider Engine]
    UpstashRedis -- Hit --> API
    
    subgraph "AI Provider Engine (Fallbacks)"
        AI -->|Try Primary| Claude[Claude 3.5 Sonnet]
        Claude -- Error/Limit --> Gemini[Gemini 1.5 Flash]
        Gemini -- Error/Limit --> Groq[Llama 3.1 8B (Groq)]
    end
    
    AI -->|Response| UpstashRedis
    UpstashRedis --> API
    API --> User
```

## 🧩 Key Components

### 1. Multi-AI Fallback Engine (`lib/ai-providers.ts`)

To ensure 99.9% availability despite individual provider outages or rate limits, the bot uses a tiered fallback system:

| Priority | Provider | Model | Use Case |
| :--- | :--- | :--- | :--- |
| **1. Primary** | **Anthropic** | `claude-3-5-sonnet` | Complex reasoning, high accuracy. |
| **2. Secondary** | **Google** | `gemini-1.5-flash` | Fast, cost-effective backup. |
| **3. Fallback** | **Groq** | `llama-3.1-8b-instant` | Ultra-fast, essentially free/cheap, ensures response. |

**Circuit Breaker Logic:**
- If a provider fails 2 times in 5 minutes, the circuit breaker opens for 15 minutes.
- Traffic is automatically routed to the next healthy provider during this window.

### 2. Caching Layer (Upstash Redis)

- **Key Strategy**: Improving speed and reducing API costs.
- **Cache Key**: `chat:{userId}:{hash(lastMessage + historyContext)}`
- **TTL**: 24 hours.
- **Impact**: Common questions like "What is CampusHub?" are served instantly from cache without hitting AI APIs.

### 3. Rate Limiting (`app/api/chat/route.ts`)

To prevent abuse and manage costs:
- **Limit**: 50 messages per hour per user.
- **Identifier**: Firebase User ID.
- **Engine**: Upstash Ratelimit (Sliding Window).

### 4. System Prompt (`lib/system-prompt.ts`)

The bot operates with a strict persona and knowledge base:
- **Persona**: Friendly senior student/guide.
- **Knowledge**: Hardcoded context about CampusHub features, navigation, and mock campus data.
- **Guardrails**:
    - "I cannot do your homework."
    - "I cannot reveal personal information of other students."

## 🔒 Security

1.  **Authentication**: The `/api/chat` endpoint verifies the Firebase ID Token in the `Authorization` header.
2.  **Environment Variables**: API keys (`ANTHROPIC_API_KEY`, `GOOGLE_GENERATIVE_AI_KEY`, `GROQ_API_KEY`) are stored in `.env.local` and never exposed to the client.
3.  **Input Sanitization**: User input is trimmed and truncated to prevent massive payload attacks.

## 🚀 Deployment Checklist

- [ ] Set `ANTHROPIC_API_KEY`
- [ ] Set `GOOGLE_GENERATIVE_AI_KEY`
- [ ] Set `GROQ_API_KEY`
- [ ] Set `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`
- [ ] Ensure `ENABLE_GROQ_FALLBACK=true` context variable is set.
