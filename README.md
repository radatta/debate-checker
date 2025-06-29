# Real-Time Debate Checker

> A full-stack platform that transcribes live debates, detects factual statements, and fact-checks them with AI – broadcasting verified verdicts and visual analytics in real time

---

## Overview

- **Purpose / Goal** – Provide audiences and analysts with immediate, transparent insight into the accuracy of spoken claims during live political, academic, or broadcast debates.
- **Intended Users** – Journalists, fact-checkers, debate moderators, broadcasters, civic tech organizations, or any viewer who wants a truth-meter while watching debates.
- **Problem Solved** – Manual fact-checking is time-consuming and usually published _after_ an event. This project automates the pipeline end-to-end so viewers receive verifiable information while the debate is still happening.

---

## Features

- 🎙️ **Live Speech-to-Text** – Streams audio/video into AssemblyAI and returns near-instant transcripts.
- 🔍 **Automatic Claim Detection** – NLP logic flags sentences that sound like factual assertions (dates, numbers, citations, etc.).
- 🤖 **AI Fact-Checking** – Each claim is sent to Perplexity's API which returns a verdict (TRUE/FALSE/PARTIALLY_TRUE/MISLEADING/UNVERIFIABLE), confidence score, evidence, reasoning, and source links.
- 📈 **Distributed Processing** – BullMQ + Redis queue allow horizontal scaling and retries for heavy verification workloads.
- ⚡ **Real-Time Updates** – Socket.io pushes new claims and verdicts instantly to connected dashboards and overlays.
- 📊 **Interactive Analytics** – D3/Visx charts for verdict distribution, claim timelines, and per-speaker stats.
- 🗄️ **Persistent Storage** – Postgres tables (via Supabase) for debates, claims, verdicts; RedisJSON for millisecond read access.
- 🎨 **Modern UI** – Tailwind CSS + shadcn/ui components yield an accessible, mobile-friendly interface.
- 🛠️ **One-Click Worker** – A single Bun script (`bun scripts/start-worker.ts`) boots a dedicated fact-checking worker.
- 🌐 **Edge-ready** – Next.js 14 App Router routes optionally deploy to Vercel Edge for lower latency.
- 👩‍💻 **Dev-Friendly** – TypeScript everywhere, Husky pre-commit hooks, Jest/Vitest ready (placeholders), Docker-compose templates (planned).

---

## Tech Stack

### Frontend

- **Next.js 14 (React 18 App Router)**
- **TypeScript**
- **Tailwind CSS + shadcn/ui**
- **SWR / React Query** (SWR-style hooks)
- **D3.js / Visx** for charts
- **Socket.io-client** for real-time state

### Backend

- **Node 18+, executed with [Bun](https://bun.sh) runtime** – chosen for faster install/start.
- **Next.js API Routes** for REST/Edge endpoints
- **BullMQ + Redis / RedisJSON** for job queueing & pub-sub
- **Supabase (PostgreSQL, Realtime, Auth)**
- **Perplexity API** for factual verification
- **AssemblyAI** for speech-to-text

### Architecture & Design

- **Event-Driven Pipeline** – Each stage (transcribe ➜ detect ➜ queue ➜ verify ➜ broadcast) is decoupled via jobs & websockets.
- **Hexagonal / Ports-and-Adapters** flavour – external services abstracted in `src/lib/*` so they can be swapped or mocked.
- **Optimistic UI** – Claims appear instantly with a _Verifying…_ badge which updates when the verdict job finishes.

---

## How It Works (Workflow)

1. **Ingest** – Browser or server sends an audio/video stream.
2. **Transcription** – `/api/transcribe-assemblyai` calls AssemblyAI to receive real-time text.
3. **Claim Detection** – `/api/detect-claims` runs lightweight regex + NLP heuristics (see `src/lib/claim-detection.ts`).
4. **Queue** – Detected claim IDs are enqueued in Redis (`claimQueue`).
5. **Fact-Checking Worker** – `startClaimWorker()` pulls jobs, queries Perplexity, and stores verdicts.
6. **Broadcast** – Supabase Realtime & Socket.io emit changes to clients; UI overlays animate new verdicts.
7. **Visualize** – Dashboard components render transcripts, statistics, and charts in real time.

---

## Setup & Installation

### Prerequisites

- **Bun 1.0+** (replaces npm/yarn)
- **Node 18+**
- **Docker** _(recommended)_ or locally running instances of:
  - **PostgreSQL 14+** (or Supabase project)
  - **Redis 6+** with the `json` module
- A **Perplexity API key** (set `PPLX_KEY`)

### Environment Variables

Create `.env.local`

```bash
NEXT_PUBLIC_SUPABASE_URL=...
SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=yourRedisPw
PPLX_KEY=yourPerplexityKey
# Production redis (optional)
PROD_REDIS_HOST=...
PROD_REDIS_PORT=...
PROD_REDIS_PASSWORD=...
```

### Steps

```bash
# 1. Clone
git clone https://github.com/radatta/debate-checker && cd debate-checker

# 2. Install dependencies
bun install

# 3. Run database migrations (if using local Postgres)
#    Or push SQL inside Supabase Studio
bunx supabase db push

# 4. Start Next.js dev server
bun run dev

# 5. In another terminal, start the BullMQ worker
bun run worker   # alias for "bun scripts/start-worker.ts"

# 6. Open http://localhost:3000 and create a new debate.
```

## Usage Examples

```bash
# Detect claims in a test string
curl -X POST http://localhost:3000/api/detect-claims \
  -H 'Content-Type: application/json' \
  -d '{"text": "The Earth is the third planet from the Sun and 149.6 million km away."}'

# Expected JSON
{
  "claims": [
    {
      "text": "The Earth is the third planet from the Sun and 149.6 million km away.",
      "status": "PENDING"
    }
  ]
}
```

```typescript
// Client-side hook to subscribe to live debate updates
const { debate, isLive } = useRealtimeDebate(initialDebate);
```

---

## Project Structure (high-level)

```
src/
├─ app/                # Next.js route handlers & pages
│  └─ api/             # REST / Edge routes (transcription, claims, queue)
├─ components/         # Reusable UI & analytics components
│  └─ analytics/       # Charts (verdict distribution, timelines, etc.)
├─ lib/                # Core domain logic (queue, claim-detection, perplexity)
│  └─ supabase/        # Client/server helpers & middleware
scripts/               # Operational scripts (BullMQ worker, seeding)
supabase/              # SQL migrations & config
```

- **Entry Points** – `src/app/page.tsx` (home), `src/app/api/*` (backend), `scripts/start-worker.ts` (worker).
- **Domain Models** – See `src/lib/types.ts` for Debate, Claim, and Verdict enums.

---

## Challenges & Learnings

- **Streaming Latency** – Balancing transcription speed versus accuracy required tuning Whisper vs Rev AI and caching partial segments.
- **Structured AI Responses** – Parsing Perplexity's natural-language output into strict JSON demanded regex + robust fallbacks.
- **Concurrency & Scaling** – BullMQ with exponential back-off and Redis cluster solved race conditions during peak bursts.
- **Real-time Consistency** – Combining Supabase Realtime and Socket.io taught important lessons about duplicate events and idempotency.

---

## Future Improvements

- 🌍 **Multi-Language Support** – Auto-detect language and switch transcription/fact-check models.
- 🔄 **Contextual Re-verification** – Re-run fact-checks when new evidence appears (e.g., a follow-up article).
- 🔐 **User Auth & Roles** – Allow verified analysts to override AI verdicts.
- 👀 **Observer Mode** – Lightweight embed widget for live streams.
- 🧪 **Testing Suite** – Integration tests with Vitest + MSW.
- ☁️ **Cloudflare Worker Edge Ingest** – Push first stage of pipeline even closer to viewers.

---

## Credits & Inspiration

- **Perplexity AI** – Fact-checking API.
- **Supabase** – Postgres + Realtime backbone.
- **BullMQ & RedisJSON** – Queue & real-time store.
- **Tailwind CSS / shadcn/ui** – UI framework inspiration.
- _Politics-focused fact-checking sites_ such as PolitiFact and FactCheck.org provided UX ideas.
- Project scaffold initially inspired by the [Next.js 14 App Router example](https://github.com/vercel/next.js/tree/canary/examples/app-directory).

---

> Built with ❤️, caffeine, and a desire for a more informed public discourse.
