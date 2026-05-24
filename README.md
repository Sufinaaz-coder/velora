# SheLaunch AI — Local Setup Guide

AI-powered business growth platform for India's women entrepreneurs.

---

## Prerequisites

Before running locally, install these:

| Tool | Version | Install |
|------|---------|---------|
| Node.js | v20+ | https://nodejs.org |
| pnpm | v9+ | `npm install -g pnpm` |
| PostgreSQL | v14+ | https://www.postgresql.org/download/ |

---

## Environment Variables

Create a `.env` file (or set these in your shell) before starting:

```env
# Required — PostgreSQL connection string
DATABASE_URL=postgresql://USER:PASSWORD@localhost:5432/shelaunch

# Required — Your Groq API key (https://console.groq.com)
GROQ_API_KEY=gsk_your_key_here

# Optional — Valkey/Redis URL (falls back to in-memory if not set)
VALKEY_URL=redis://localhost:6379

# Optional — Session secret
SESSION_SECRET=your-random-secret-here
```

> **Note:** The app works fully without Valkey/Redis — it uses an in-memory fallback automatically.

---

## Valkey / Redis (Optional but Recommended)

Valkey is used for:
- **AI response caching** — Caches Groq responses for 24 hours (saves API cost)
- **Rate limiting** — 20 AI calls per user per hour
- **Session memory** — Remembers business context across features
- **Trending niches** — Tracks popular business categories in real-time
- **Dashboard stats** — Cache hit/miss metrics shown on the dashboard

If you don't set `VALKEY_URL`, all of the above still works using in-memory storage (data resets on server restart).

To run Valkey/Redis locally:
```bash
# Using Docker:
docker run -d -p 6379:6379 valkey/valkey:latest

# Or install Redis directly (macOS):
brew install redis && brew services start redis
```

---

## Setup Steps

### 1. Install dependencies
```bash
pnpm install
```

### 2. Set up the database
Create a PostgreSQL database:
```sql
CREATE DATABASE shelaunch;
```

Then push the schema:
```bash
pnpm --filter @workspace/db run push
```

### 3. Start the API server
In one terminal:
```bash
# Set env vars first
export DATABASE_URL="postgresql://USER:PASSWORD@localhost:5432/shelaunch"
export GROQ_API_KEY="gsk_your_key_here"
export PORT=8080

pnpm --filter @workspace/api-server run dev
```

The API server starts on **http://localhost:8080**

### 4. Start the frontend
In a second terminal:
```bash
export PORT=3000

pnpm --filter @workspace/shelaunch run dev
```

The frontend starts on **http://localhost:3000**

### 5. Open the app
Visit **http://localhost:3000** in your browser.

---

## Project Structure

```
shelaunch-local/
├── artifacts/
│   ├── api-server/       ← Express 5 + Socket.io backend
│   │   ├── src/
│   │   │   ├── lib/
│   │   │   │   ├── groq.ts      ← Groq AI client + caching
│   │   │   │   ├── valkey.ts    ← Valkey/Redis with in-memory fallback
│   │   │   │   ├── socket.ts    ← Socket.io realtime
│   │   │   │   └── logger.ts    ← Pino logger
│   │   │   └── routes/
│   │   │       ├── ai/
│   │   │       │   ├── business-launch.ts
│   │   │       │   ├── campaign.ts
│   │   │       │   └── conversations.ts   ← AI Assistant (streaming)
│   │   │       ├── dashboard.ts
│   │   │       ├── trending.ts
│   │   │       └── history.ts
│   │   └── build.mjs
│   └── shelaunch/        ← React + Vite frontend
│       └── src/
│           ├── pages/    ← All app pages
│           └── components/
├── lib/
│   ├── db/               ← Drizzle ORM schema + PostgreSQL
│   ├── api-spec/         ← OpenAPI spec (source of truth)
│   ├── api-zod/          ← Generated Zod validation schemas
│   └── api-client-react/ ← Generated TanStack Query hooks
├── package.json
└── pnpm-workspace.yaml
```

---

## Features

- **Business Launch Generator** — AI generates brand names, slogans, strategy, hashtags
- **Festival Campaign Generator** — Diwali, Eid, Women's Day campaigns with full copy
- **AI Assistant** — Streaming chat powered by Groq (llama-3.3-70b-versatile)
- **Trending** — Live market interest scores for Indian business categories
- **History** — Saved generations for launches and campaigns
- **Dashboard** — Analytics with Valkey realtime metrics

---

## Tech Stack

- **AI:** Groq (`llama-3.3-70b-versatile`)
- **Backend:** Express 5, Socket.io, Pino
- **Database:** PostgreSQL + Drizzle ORM
- **Cache/Realtime:** Valkey (Redis-compatible) with in-memory fallback
- **Frontend:** React, Vite, Tailwind CSS, shadcn/ui, Framer Motion
- **Validation:** Zod + OpenAPI codegen (Orval)
