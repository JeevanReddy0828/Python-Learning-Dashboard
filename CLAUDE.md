# PyLearn — ADHD Python Dashboard

## What this project is
A full-stack, ADHD-friendly Python learning platform. Micro-lessons (3–10 min), in-browser code execution via Pyodide, LangGraph-powered AI tutor, gamification (XP, levels, streaks, leaderboard), persistent Memory Vault, Dev Tools suite, and session history for all learning tools.

## Full stack

| Layer | Tech |
|-------|------|
| Backend | Python 3.12, FastAPI, SQLAlchemy 2.0 async, asyncpg, Alembic |
| Database | PostgreSQL 16 |
| Cache / Leaderboard | Redis 7 (`redis[asyncio]`) |
| AI tutor | LangGraph + langchain-openai → gpt-4o-mini **or** NVIDIA NIM (switchable via env) |
| Code runner | Pyodide (in-browser, primary) + subprocess (backend fallback) |
| Export | Notion API (`notion-client`) |
| Frontend | React 18, Vite 5, TypeScript, TailwindCSS 3, Zustand |
| UI libs | Framer Motion, @xyflow/react (React Flow), highlight.js, lottie-react |
| Real-time | Supabase Realtime presence (optional) |
| MCP server | `backend/mcp_server.py` — registered in `.claude/settings.json` |
| Infra | Docker Compose (db + redis + backend + frontend) |

## Running locally

```bash
# Start everything (first run takes ~2 min to pull images)
docker compose up

# Frontend:   http://localhost:5173
# Backend API: http://localhost:8000/docs
# Redis:       localhost:6379
```

### First-time env setup
```bash
cp .env.example .env
# Required: set OPENAI_API_KEY (or NVIDIA_API_KEY) and a strong SECRET_KEY
# Optional: SUPABASE_URL, SUPABASE_ANON_KEY, NOTION_TOKEN, NOTION_DATABASE_ID
```

### Re-seed curriculum after editing JSON data
```bash
docker compose exec backend python -m app.curriculum.seed
```

The seeder **upserts** lessons — safe to run repeatedly, content edits are applied.

### Apply new Alembic migrations
```bash
docker compose exec backend alembic upgrade head
```

### Backend only (without Docker)
```bash
cd backend
pip install -r requirements.txt
alembic upgrade head
python -m app.curriculum.seed
uvicorn app.main:app --reload --port 8000
```

### Frontend only (without Docker)
```bash
cd frontend
npm install
npm run dev
```

### Run the MCP server (for Claude Code integration)
```bash
cd backend
python mcp_server.py   # stdio mode — Claude Code connects automatically via .claude/settings.json
```

## Auto-commit hook
A `Stop` hook in `.claude/settings.json` automatically commits all modified tracked files after every Claude response. It runs:
```
git add -u  →  git diff --cached  →  git commit -m "auto: YYYY-MM-DD HH:MM"
```
If there are no changes, it silently skips. To disable: remove the `"hooks"` block from `.claude/settings.json`.

## Directory map

```
backend/
  mcp_server.py              ← Custom MCP server (5 tools + curriculum resources)
  requirements.txt
  alembic/
    versions/
      001_initial_schema.py  ← base schema
      002_memory_vault.py    ← memory_vault, chat_sessions, chat_messages tables
  app/
    main.py                  ← FastAPI app factory, all routers registered
    config.py                ← Settings (reads .env): DB, Redis, Supabase, Notion, AI provider chain
    database.py              ← Async engine + session
    deps.py                  ← get_current_user dependency
    models/
      user.py                ← User ORM + relationships to memory_entries, chat_sessions
      module.py / lesson.py / exercise.py / progress.py / achievement.py / streak.py
      memory.py              ← MemoryVaultEntry, ChatSession, ChatMessage
    schemas/                 ← Pydantic v2 request/response models
    routers/
      auth.py                ← POST /register /login GET /me
      users.py               ← GET/PATCH /me, GET /me/stats
      modules.py             ← GET /modules (Redis-cached 2 min per user)
      lessons.py             ← GET /{id}, POST /{id}/start, POST /{id}/complete
      exercises.py           ← GET /{id}, POST /{id}/submit, GET /{id}/hint
      progress.py            ← GET /summary /weekly /weak-areas
      achievements.py        ← GET / /earned
      streaks.py             ← GET / POST /check-in
      code_execution.py      ← POST /run (sandboxed subprocess)
      ai.py                  ← POST /hint /review /explain /chat (chat persists to DB + Redis)
      leaderboard.py         ← GET / (top 20), GET /me, POST /sync  ← Redis sorted set
      export.py              ← POST /notion  ← creates/updates Notion page
      memory.py              ← Full CRUD for vault entries + session history (9 endpoints)
    services/
      auth_service.py        ← bcrypt + JWT
      gamification_service.py← XP/level/achievement logic
      code_execution_service.py
      ai_service.py          ← hint/review/explain + chat (routes to LangGraph agent)
      ai_agent.py            ← LangGraph StateGraph agent with 3 tools + Redis history
      cache_service.py       ← Redis: cache_get/set/del, leaderboard_upsert/get, presence
    curriculum/
      seed.py                ← Idempotent upsert seeder
      data/
        modules.json         ← 8 modules
        lessons.json         ← 16 lessons (rich HTML content, eli5, analogy, diagram)
        exercises.json       ← 17 exercises (fill_blank, debug, mcq, mini_project)
        achievements.json    ← 13 achievements

frontend/src/
  lib/
    supabase.ts              ← Supabase client + joinPresence() helper (optional)
  api/index.ts               ← All API wrappers (authApi, modulesApi, lessonsApi, exercisesApi,
                                progressApi, achievementsApi, streaksApi, codeApi, aiApi,
                                leaderboardApi, exportApi, memoryApi)
  types/index.ts             ← All TypeScript interfaces (incl. MemoryEntry, ChatSessionSummary,
                                ChatSessionDetail, ChatMessageRecord)
  store/
    authStore.ts             ← user, token, login/logout, refreshUser
    gamificationStore.ts     ← XP events (addXPEvent also increments local xp), confetti, level
    lessonStore.ts           ← currentLesson, currentExerciseIndex, AIPanelMode
    modulesStore.ts          ← modules[], refresh() — used in RootLayout sidebar
    uiStore.ts               ← darkMode, focusMode, sidebarOpen, pomodoro
  hooks/
    useToolSessions.ts       ← localStorage CRUD hook for per-tool sessions (max 20 per tool)
  pages/
    DashboardPage.tsx        ← Stats, weekly chart, module cards, Leaderboard, WeakAreasPanel
    LessonPage.tsx           ← Learn tab + Practice tab, StudyingNow badge, MicroWin nudge
    ModulesPage.tsx
    LearningToolsPage.tsx    ← 7 tabs + Sessions panel sidebar (auto-saves generated content)
    MemoryVaultPage.tsx      ← Vault tab (notes/code/insights) + Session History tab
    DevToolsPage.tsx         ← 6 real-world dev tool tabs (see below)
    ProfilePage.tsx          ← XP bar, stats grid, radar chart, NotionExport button
    AchievementsPage.tsx
    DailyChallengePage.tsx
  components/
    ai/                      ← AIPanel, CodeHelper, CodeReviewer, CodeExplainer, SocraticMode
    curriculum/
      LessonContent.tsx      ← highlight.js auto-highlighting + ConceptVisual + Mermaid
      ConceptVisual.tsx      ← 16 animated SVG visuals, one per lesson slug
      LottieHero.tsx         ← Animated gradient banner with floating syntax tokens per lesson
      StudyingNow.tsx        ← Supabase Realtime presence badge ("3 students studying now")
    exercises/               ← ExerciseRouter, FillInBlanks, MCQQuiz, DebugChallenge, MiniProject
    learning/
      ConceptMap.tsx         ← React Flow interactive draggable mind map (AI-generated)
      VisualFlashcards.tsx   ← Flip-card flashcards with Study Mode
      SocraticStandalone.tsx ← Standalone Socratic chat (topic → explain → reexplain → mastered)
      LearningPlanGenerator, QuickReference, LevelRoadmap
      SessionsPanel.tsx      ← Sessions sidebar (restore/delete/clear per tool)
    tools/
      HoppscotchPlayground.tsx ← 6 free public APIs, Run Request + "Open in Hoppscotch" buttons
    devtools/
      GitHubTrending.tsx     ← GitHub Search API, filter Today/Week/Month/Forks, topic search
      PyPIExplorer.tsx       ← PyPI JSON API, package info + one-click install command copy
      RegexLab.tsx           ← Live regex highlighting, match list, generated Python re code
      JsonDictConverter.tsx  ← Bidirectional JSON↔Python dict (null/None, true/True, false/False)
      PEPBrowser.tsx         ← peps.python.org/api/peps.json, filter by status/type, featured PEPs
      CurlConverter.tsx      ← Parse curl commands → Python requests code, auto-detect JSON body
    dashboard/
      Leaderboard.tsx        ← Redis-backed XP leaderboard, top 20, you highlighted
      WeeklyProgressChart, StatsGrid, SkillRadarChart, WeakAreasPanel
    gamification/            ← XPBar, StreakCounter, ConfettiCelebration, AchievementToast
    adhd/                    ← PomodoroTimer, MicroWin, FocusModeToggle
    profile/
      NotionExport.tsx       ← Export progress to Notion workspace
```

## Sidebar nav items (RootLayout)
```
/dashboard      🏠  Dashboard
/modules        📚  Learn
/achievements   🏆  Achievements
/daily          ⚡  Daily Challenge
/learning-tools 🧠  Learning Tools
/memory         🗄️  Memory Vault
/dev-tools      🛠️  Dev Tools
/profile        👤  Profile
```

## Learning Tools page tabs (7 total) + Sessions

| Tab | Component | What it does |
|-----|-----------|-------------|
| ⚡ 20-Hour Plan | LearningPlanGenerator | AI-generated 10-session study plan |
| 📄 Quick Reference | QuickReference | Single-page Python cheat sheet |
| 🗺️ Skill Roadmap | LevelRoadmap | 5-level progression path |
| 🧠 Socratic Mode | SocraticStandalone | Teach-it-back loop until mastered |
| 🃏 Flashcards | VisualFlashcards | AI emoji flip-cards with study mode |
| 🕸️ Concept Map | ConceptMap | React Flow interactive AI mind map |
| 🔌 API Playground | HoppscotchPlayground | Test real APIs, link to Hoppscotch |

Each tool has an `onGenerated(content)` callback. Generated content is saved to localStorage via `useToolSessions`. The `🕐 Sessions` button (with count badge) in the toolbar opens `SessionsPanel` to restore or delete past sessions.

## Dev Tools page tabs (6 total)

| Tab | Component | Data source |
|-----|-----------|------------|
| 📈 GitHub Trending | GitHubTrending | GitHub Search API (public, no auth) |
| 📦 PyPI Explorer | PyPIExplorer | pypi.org/pypi/{pkg}/json |
| 🔍 Regex Lab | RegexLab | Client-side JS RegExp |
| 🔄 JSON↔Dict | JsonDictConverter | Client-side converter |
| 📜 PEP Browser | PEPBrowser | peps.python.org/api/peps.json |
| 🌐 cURL→Python | CurlConverter | Client-side parser |

## Memory Vault page (`/memory`)

Two tabs:
- **Vault** — create/edit/delete memory entries. Types: `note` / `code` / `insight` / `resource`. Filter by type, search by title/content/tags, link to a lesson slug.
- **Session History** — browse past AI chat sessions (from `chat_sessions` + `chat_messages` DB tables). Each session shows timestamp, message count, and expandable message thread.

Memory entries are stored in PostgreSQL (`memory_vault` table). Chat sessions are persisted to DB on every `/api/v1/ai/chat` call in addition to Redis.

## MCP server (`backend/mcp_server.py`)

Registered in `.claude/settings.json` — Claude Code connects automatically.

**Resources** (browsable curriculum):
- `pylearn://curriculum/overview` — all modules + lesson summaries
- `pylearn://curriculum/modules` / `lessons` / `exercises`
- `pylearn://curriculum/lesson/{slug}` — single lesson content

**Tools** (callable by AI):
- `search_curriculum(query)` — full-text search across all lessons
- `run_python(code, stdin?)` — execute Python safely, 10s timeout
- `get_lesson_for_topic(topic)` — maps a concept to the right lesson
- `generate_quiz(lesson_slug, count)` — returns MCQ questions with answers
- `explain_error(error_message, code?)` — plain-English breakdown of Python errors

## External integrations

| Service | Where | What it does |
|---------|-------|-------------|
| **Redis** | `docker-compose.yml` + `cache_service.py` | Modules cache (2 min TTL), XP leaderboard sorted set, study presence, AI chat history (2 hr TTL) |
| **LangGraph** | `services/ai_agent.py` | Stateful tutor agent, Redis-backed conversation history, 3 tools |
| **Hoppscotch** | `HoppscotchPlayground.tsx` | In-app API tester + deep-link to hoppscotch.io |
| **Supabase** | `lib/supabase.ts` + `StudyingNow.tsx` | Realtime Presence — shows who's studying the same lesson |
| **Notion** | `routers/export.py` + `NotionExport.tsx` | Exports XP, lessons, achievements to a Notion database page |

Optional services (Supabase, Notion) degrade gracefully when env vars are not set.

## API routes summary

```
POST /api/v1/auth/register|login       GET /api/v1/auth/me
GET|PATCH /api/v1/users/me             GET /api/v1/users/me/stats
GET /api/v1/modules                    GET /api/v1/modules/{slug}
GET /api/v1/lessons/{id}               POST /api/v1/lessons/{id}/start|complete
GET /api/v1/exercises/{id}             POST /api/v1/exercises/{id}/submit
GET /api/v1/exercises/{id}/hint
GET /api/v1/progress                   GET /api/v1/progress/weekly|weak-areas
GET /api/v1/achievements               GET /api/v1/achievements/earned
GET /api/v1/streaks                    POST /api/v1/streaks/check-in
POST /api/v1/code/run
POST /api/v1/ai/hint|review|explain|chat
GET /api/v1/leaderboard                GET /api/v1/leaderboard/me   POST /api/v1/leaderboard/sync
POST /api/v1/export/notion
GET|POST /api/v1/memory/entries        GET|PUT|DELETE /api/v1/memory/entries/{id}
GET /api/v1/memory/sessions            GET /api/v1/memory/sessions/{id}
DELETE /api/v1/memory/sessions/{id}    GET /api/v1/memory/stats
GET /api/health
```

## Architecture decisions

### AI provider chain
`config.py` exposes `ai_api_key`, `ai_model`, `ai_base_url`, `ai_provider` computed from env:
1. **ZAI** — if `ZAI_API_KEY` is set
2. **NVIDIA NIM** — if `NVIDIA_API_KEY` is set (current default, model: `google/gemma-4-31b-it`)
3. **OpenAI** — fallback if `OPENAI_API_KEY` is set

`ai_service.py` and `ai_agent.py` both read these — no other changes needed to switch.
`_check_ai_configured()` in `routers/ai.py` checks `settings.ai_api_key` (not `openai_api_key`).

Note: NVIDIA models don't support `response_format=json_object`. The review and explain endpoints extract JSON with regex instead.

### Chat persistence (dual storage)
Every `/api/v1/ai/chat` call:
1. Saves messages to Redis (2 hr TTL) for fast in-session retrieval by LangGraph
2. Persists the full session to PostgreSQL (`chat_sessions` + `chat_messages`) for permanent history browsable in Memory Vault → Session History tab

### LangGraph chat vs simple OpenAI
`ai_service.chat()` routes through `ai_agent.py` which runs a `StateGraph` with 3 tools and Redis-backed conversation history. Falls back to raw OpenAI if LangGraph fails. Single-shot calls (hint, review, explain) still use direct OpenAI.

### Redis caching pattern
Modules list is cached per user with a 2-min TTL. Any action that changes progress (exercise submit, lesson complete) should call `cache_service.cache_del(f"modules:{user_id}")` to invalidate. Currently the frontend calls `refreshModules()` which re-fetches and re-caches.

### Tool sessions (localStorage)
`useToolSessions(toolId)` stores up to 20 sessions per tool in `localStorage` under key `tool-sessions-{toolId}`. `SessionsPanel` is the shared UI — add `onGenerated(content)` prop to any tool component, call it when content is produced, and the session is saved automatically.

### Supabase presence (optional)
`StudyingNow` only renders when `VITE_SUPABASE_URL` is set. No Supabase account = component is silent.

### highlight.js in lessons
`LessonContent` runs `hljs.highlightElement()` on every `<pre><code>` block after render via `useEffect`. Language auto-detected. Style: `atom-one-dark`.

### React Flow concept map
`ConceptMap` uses `@xyflow/react` with 3 custom node types (root, child, grandchild). The AI returns JSON which `buildGraph()` converts to `nodes[]` + `edges[]`. Fully draggable, zoomable, with MiniMap.

### Why Pyodide over backend for code execution?
- Instant feedback (no network round-trip)
- Safer — runs in browser sandbox
- Backend code execution (`/api/v1/code/run`) is the fallback and for grading

### XP flow
1. User passes exercise → `exercisesApi.submit()` → backend awards XP to `users.xp`
2. Frontend: `gamificationStore.addXPEvent(amount)` → animates floating +XP **and** increments local `xp`
3. `ExerciseRouter.handleResult` calls `authStore.refreshUser()` + `leaderboardApi.sync()` → syncs DB truth + updates Redis leaderboard
4. `RootLayout` `useEffect([user])` calls `gamificationStore.setXP(user.xp, user.level)` → XP bar reflects DB

### Module progress refresh
`useModulesStore.refresh()` is called after every exercise pass and lesson completion. `RootLayout` uses `useModulesStore` so the sidebar % updates without page reload.

### Auto-advance between lessons
`LessonDetail` includes `next_lesson_id` and `next_lesson_title` (computed by backend from `order_index + 1` in same module). `ExerciseRouter` shows a completion screen with a 5-second SVG countdown ring, then navigates to next lesson or `/modules`.

## Conventions

- **No `any` types** — use the interfaces in `src/types/index.ts`
- **API calls in components** use `src/api/index.ts` wrappers, never raw axios
- **Tailwind dark mode** via `dark:` classes; `uiStore.darkMode` toggles `document.documentElement.classList`
- **Skeleton loaders** for every data-fetching state (see `DashboardPage` for pattern)
- **No comments** unless the WHY is non-obvious
- **Graceful degradation** — all optional integrations (Supabase, Notion, Redis) must not crash when unconfigured

## Common tasks

### Add a new lesson
1. Add entry to `backend/app/curriculum/data/lessons.json`
2. Add exercises to `backend/app/curriculum/data/exercises.json`
3. Add animated visual to `ConceptVisual.tsx` (slug → SVG component) and token metadata to `LottieHero.tsx`
4. Run seeder: `docker compose exec backend python -m app.curriculum.seed`

### Add a new Learning Tools tab
1. Create component in `frontend/src/components/learning/` or `tools/`
2. Add `onGenerated?: (content: string) => void` prop to the component; call it when content is produced
3. Add entry to `TABS` array in `frontend/src/pages/LearningToolsPage.tsx`
4. Pass `onGenerated` callback in the render condition in the same file

### Add a new Dev Tools tab
1. Create component in `frontend/src/components/devtools/`
2. Add entry to `TABS` array in `frontend/src/pages/DevToolsPage.tsx`
3. Add render condition in the same file

### Add a new AI tool to the MCP server
1. Add a `types.Tool(...)` entry in `list_tools()` in `backend/mcp_server.py`
2. Add handler in `call_tool()` and implement `_tool_yourname()` function
3. Restart Claude Code to pick up the new tool

### Add a new achievement
1. Add to `backend/app/curriculum/data/achievements.json`
2. Run seeder
3. Add trigger logic in `backend/app/services/gamification_service.py → check_and_award_achievements`

### Add a new DB table
1. Create model in `backend/app/models/`
2. Import it in `backend/app/models/__init__.py` (if applicable)
3. Write Alembic migration: `docker compose exec backend alembic revision --autogenerate -m "description"`
4. Apply: `docker compose exec backend alembic upgrade head`

### Change XP per level thresholds
Edit `XP_PER_LEVEL` list in `backend/app/services/gamification_service.py`.

### Switch AI provider (OpenAI ↔ NVIDIA NIM)
Set the appropriate key in `.env`. NVIDIA takes priority over OpenAI when `NVIDIA_API_KEY` is present.

```bash
# Use NVIDIA NIM (free at https://build.nvidia.com/)
NVIDIA_API_KEY=nvapi-...
NVIDIA_MODEL=google/gemma-4-31b-it   # or any model from build.nvidia.com
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1

# Use OpenAI (comment out or remove NVIDIA_API_KEY)
OPENAI_API_KEY=sk-...
```

The logic lives in `app/config.py` properties `ai_api_key`, `ai_model`, `ai_base_url`, `ai_provider`.

### Extend the Leaderboard
Redis sorted set key: `leaderboard:xp`. Member format: `{user_id}\x00{display_name}`. Scores are XP integers. `cache_service.leaderboard_upsert/get/rank` are the helpers.

### Configure optional integrations

**Supabase** (realtime presence):
1. Create project at https://supabase.com (free tier)
2. Add `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` to frontend `.env`
3. The `StudyingNow` component activates automatically

**Notion** (progress export):
1. Create integration at https://www.notion.so/my-integrations
2. Create a database in Notion, share it with the integration
3. Add `NOTION_TOKEN` + `NOTION_DATABASE_ID` to backend `.env`
4. "Export to Notion" button on Profile page becomes active

### Lesson content_html rules
- Use `<h2>` for section headings, `<h3>` for sub-sections
- Code blocks: `<pre><code>...</code></pre>` — highlight.js will auto-highlight them
- Never use unescaped `"` inside a JSON string value — use `'` or `\"`
- Tables: standard HTML `<table><tr><th>/<td>` — styled automatically
- Emoji in headings encouraged for ADHD engagement
