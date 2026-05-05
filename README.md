# PyLearn — ADHD-Friendly Python Learning Platform

An interactive, full-stack Python learning platform built for ADHD learners: micro-lessons, in-browser code execution, AI-powered tutoring, gamification, and a suite of developer tools.

## Features

### Learning
- **Micro-lessons** — 3–10 min lessons with ELI5 summaries, real-world analogies, animated SVG visuals, and Mermaid diagrams
- **Interactive code editor** — Pyodide runs Python directly in the browser (no server round-trip)
- **Exercise types** — Fill-in-blank, debug challenge, MCQ, mini-project
- **Auto-advance** — 5-second countdown ring between lessons with next-lesson preview

### AI Tutor
- **Hint helper** — 3 progressive levels (gentle nudge → almost a spoiler)
- **Code Reviewer** — animated score ring (0–100) with feedback, suggestions, strengths
- **Line Explainer** — plain-English breakdown of every code line with concept tags
- **Socratic Mode** — teach-it-back loop until mastery is detected
- **AI Workshop** — 7 specialized AI modes for developers (see below)
- **Streaming responses** — tokens stream word-by-word via SSE (no waiting for full response)

### AI Workshop — 7 Developer Modes
| Mode | What it does |
|------|-------------|
| Production Feature Developer | Architecture + data flow + full implementation + edge cases |
| Full Application from Scratch | Startup MVP with DB schema, API, UI, and complete code |
| Repo Understanding + Refactoring | Audit existing code for structural issues and refactor |
| Senior Debugging Engineer | Root cause analysis + repair plan + production-ready fix |
| System Design + Implementation | Scalable architecture with caching strategy and code |
| Performance Optimization | Bottleneck analysis + optimized code |
| Architecture Reconstruction | Separate concerns, reduce coupling, same behavior |

### Learning Tools
- **20-Hour Plan** — AI-generated 10-session study plan
- **Quick Reference** — single-page Python cheat sheet
- **Skill Roadmap** — 5-level progression path
- **Socratic Mode** — standalone teach-it-back sessions
- **Flashcards** — AI emoji flip-cards with study mode
- **Concept Map** — React Flow interactive mind map
- **API Playground** — test real APIs with 6 free public endpoints

### Gamification
- XP, levels, streaks, leaderboard (Redis sorted set)
- 13 achievements with unlock logic
- Confetti celebrations, floating +XP animations, achievement toasts

### ADHD UX
- Focus mode (press `F`) — hides sidebar and distractions
- Pomodoro timer
- Micro-win nudges
- Skeleton loaders on every data-fetching state
- Dark mode (full Tailwind dark theme)

### Other
- **Memory Vault** — persistent AI session history
- **Dev Tools** — internal tooling panel
- **Notion export** — push XP + achievements to a Notion database
- **Supabase Realtime** — "studying now" presence badge (optional)
- **MCP server** — Claude Code integration with 5 tools + curriculum resources

## Quick Start (Docker)

```bash
cp .env.example .env
# Required: NVIDIA_API_KEY (or OPENAI_API_KEY) + SECRET_KEY
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API docs: http://localhost:8000/api/docs

## AI Provider Setup

NVIDIA NIM is the default (free tier at https://build.nvidia.com):

```bash
# .env
NVIDIA_API_KEY=nvapi-...
NVIDIA_MODEL=meta/llama-3.1-8b-instruct   # fast, recommended
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
```

Switch to OpenAI by removing `NVIDIA_API_KEY` and setting:

```bash
OPENAI_API_KEY=sk-...
```

All AI features (hint, review, explain, chat, AI Workshop) degrade gracefully if no key is set.

## Local Development

### Backend

```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
python -m app.curriculum.seed
uvicorn app.main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

### Re-seed curriculum after editing JSON

```bash
docker compose exec backend python -m app.curriculum.seed
```

The seeder upserts — safe to run repeatedly.

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL async URL |
| `SECRET_KEY` | Yes | JWT signing secret (`openssl rand -hex 32`) |
| `NVIDIA_API_KEY` | No* | NVIDIA NIM key — enables all AI features |
| `NVIDIA_MODEL` | No | Model to use (default: `meta/llama-3.1-8b-instruct`) |
| `OPENAI_API_KEY` | No* | OpenAI key — used if NVIDIA key is absent |
| `REDIS_URL` | No | Redis for leaderboard + cache (default: `redis://redis:6379`) |
| `VITE_SUPABASE_URL` | No | Enables realtime presence ("studying now" badge) |
| `NOTION_TOKEN` | No | Enables Notion progress export |

*At least one AI key recommended for full functionality.

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0 async, asyncpg, Alembic |
| Database | PostgreSQL 16 |
| Cache / Leaderboard | Redis 7 |
| AI | NVIDIA NIM / OpenAI (switchable via env) |
| Code runner | Pyodide (browser-primary) + subprocess fallback |
| Frontend | React 18, Vite 5, TypeScript, TailwindCSS 3, Zustand |
| UI libs | Framer Motion, React Flow, highlight.js, lottie-react |
| Real-time | Supabase Realtime (optional) |
| Export | Notion API (optional) |
| MCP server | `backend/mcp_server.py` |
| Infra | Docker Compose |

## Curriculum

8 modules, 16 lessons, 17 exercises:

1. Variables & Types
2. Control Flow
3. Functions
4. Data Structures
5. Object-Oriented Programming
6. File I/O & Error Handling
7. APIs & Web
8. Real Projects

## Code Execution Security

- **Browser**: Pyodide runs in a Web Worker — sandboxed by the browser
- **Backend**: `asyncio.create_subprocess_exec` with 10s timeout and stripped env vars
- **Production**: Docker container with resource limits (see `docker-compose.yml`)
