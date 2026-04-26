# PyLearn — ADHD-Friendly Python Dashboard

An interactive Python learning platform designed for ADHD learners: micro-lessons, gamification, in-browser code execution, and AI-powered assistance.

## Features

- **Micro-lessons** — 3–7 min lessons with ELI5 summaries, real-world analogies, Mermaid diagrams
- **Interactive code editor** — Monaco editor + Pyodide (runs Python in the browser, no server needed)
- **Gamification** — XP, levels, streaks, achievements, confetti celebrations
- **AI tools** — Hint helper (3 levels), Code Reviewer (score ring), Line Explainer, Socratic mode
- **Learning frameworks** — 20-hour fast plan, quick reference cards, 5-level skill roadmap
- **ADHD UX** — Focus mode (F key), Pomodoro timer, micro-win nudges, skeleton loaders
- **PWA** — Works offline, installable on desktop/mobile
- **Dark mode** — Full dark theme via Tailwind

## Quick Start (Docker)

```bash
cp .env.example .env
# Edit .env — add your OPENAI_API_KEY and a strong SECRET_KEY
docker compose up --build
```

Open http://localhost:5173

## Local Development

### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Start Postgres separately, then:
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

Open http://localhost:5173

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `DATABASE_URL` | Yes | PostgreSQL async URL (`postgresql+asyncpg://user:pass@host/db`) |
| `SECRET_KEY` | Yes | JWT signing secret (generate with `openssl rand -hex 32`) |
| `OPENAI_API_KEY` | No | Enables AI features (hint, review, explain, chat). Falls back gracefully if absent. |
| `ALLOWED_ORIGINS` | No | Comma-separated CORS origins (default: `http://localhost:5173`) |

## Tech Stack

| Layer | Tech |
|-------|------|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0 async, asyncpg, Alembic |
| Auth | passlib[bcrypt], python-jose |
| AI | OpenAI gpt-4o-mini |
| Database | PostgreSQL 16 |
| Frontend | React 18, Vite 5, TypeScript, TailwindCSS 3 |
| State | Zustand |
| Editor | @monaco-editor/react |
| Charts | recharts |
| Animations | framer-motion, canvas-confetti |
| Code runner | Pyodide (browser) + subprocess (backend fallback) |
| PWA | vite-plugin-pwa |

## Curriculum

8 modules covering the full Python journey:

1. Variables & Types
2. Control Flow
3. Functions
4. Data Structures
5. Object-Oriented Programming
6. File I/O & Error Handling
7. APIs & Web
8. Real Projects

Each module has 5+ lessons and 3+ exercises (fill-in-blank, debug, MCQ, mini-project).

## Code Execution Security

- **Browser**: Pyodide runs in a Web Worker — sandboxed by the browser
- **Backend**: `asyncio.create_subprocess_exec` with 10s timeout and stripped environment variables
- **Production**: Docker container with `--network none` and `--memory 128m` (see `docker-compose.yml`)
