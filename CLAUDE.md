# PyLearn — ADHD Python Dashboard

## What this project is
A full-stack, ADHD-friendly Python learning platform. Micro-lessons (3–10 min), in-browser code execution via Pyodide, AI assistance (hint/review/explain/socratic), gamification (XP, levels, streaks, achievements), and a suite of learning tools.

## Stack
- **Backend**: Python 3.12 + FastAPI + SQLAlchemy 2.0 async + PostgreSQL 16 + Alembic
- **Frontend**: React 18 + Vite + TypeScript + TailwindCSS 3 + Zustand
- **Code runner**: Pyodide (in-browser, primary) + subprocess (backend fallback)
- **AI**: OpenAI gpt-4o-mini via `openai` SDK
- **Infra**: Docker Compose

## Running locally

```bash
# Start everything (first run takes ~2 min)
docker compose up

# Frontend: http://localhost:5173
# Backend API: http://localhost:8000/docs
```

### First-time env setup
```bash
cp .env.example .env
# Edit .env — set OPENAI_API_KEY and a strong SECRET_KEY
```

### Re-seed curriculum after editing JSON data
```bash
docker compose exec backend python -m app.curriculum.seed
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

## Key directories

```
backend/app/
  curriculum/data/    ← lessons.json, exercises.json, modules.json, achievements.json
  models/             ← SQLAlchemy ORM models
  routers/            ← FastAPI route handlers
  services/           ← business logic (auth, gamification, code execution, AI)
  schemas/            ← Pydantic v2 request/response models

frontend/src/
  components/
    ai/               ← AIPanel, CodeHelper, CodeReviewer, CodeExplainer, SocraticMode
    exercises/        ← ExerciseRouter, FillInBlanks, MCQQuiz, DebugChallenge, MiniProject
    learning/         ← LearningPlanGenerator, QuickReference, LevelRoadmap, VisualFlashcards, ConceptMap
    gamification/     ← XPBar, StreakCounter, ConfettiCelebration, AchievementToast
    adhd/             ← PomodoroTimer, FocusModeToggle, MicroWin
    curriculum/       ← LessonContent, LessonDiagram
  pages/              ← DashboardPage, LessonPage, ModulesPage, LearningToolsPage, etc.
  store/              ← authStore, gamificationStore, lessonStore, uiStore, modulesStore
  api/                ← typed wrappers around axios (authApi, lessonsApi, exercisesApi, aiApi...)
```

## Editing curriculum content

All curriculum lives in `backend/app/curriculum/data/*.json`. After editing, re-seed:

```bash
docker compose exec backend python -m app.curriculum.seed
```

The seeder now **upserts** lessons and creates missing records — safe to run repeatedly.

### Lesson content_html rules
- Use `<h2>` for section headings, `<h3>` for sub-sections
- Code blocks: `<pre><code>...</code></pre>` — use `\n` for newlines inside JSON strings
- Never use unescaped `"` inside a JSON string value — use `'` or `\"`
- Tables: standard HTML `<table><tr><th>/<td>` — styled automatically
- Emoji in headings are fine and encouraged for ADHD engagement

## Architecture decisions

### Why Pyodide over backend for code execution?
- Instant feedback (no network round-trip)
- Safer — runs in browser sandbox
- Backend code execution (`/api/v1/code/run`) is the fallback and for grading

### Why Zustand over Redux/Context?
- Less boilerplate, works fine for this scale
- `modulesStore` is globally accessible so child components can call `refresh()` without prop drilling

### XP flow
1. User passes exercise → `exercisesApi.submit()` → backend awards XP to `users.xp`
2. Frontend: `gamificationStore.addXPEvent(amount)` → animates floating +XP, also increments local `xp`
3. `ExerciseRouter.handleResult` calls `authStore.refreshUser()` → syncs authoritative value from server
4. `RootLayout` `useEffect([user])` calls `gamificationStore.setXP(user.xp, user.level)` → bar reflects DB truth

### Module progress refresh
`useModulesStore.refresh()` is called after every exercise pass and lesson completion. `RootLayout` uses `useModulesStore` so the sidebar % updates without page reload.

### Auto-advance between lessons
`LessonDetail` includes `next_lesson_id` and `next_lesson_title` (computed by backend). `ExerciseRouter` shows a completion screen with a 5-second countdown ring, then navigates to the next lesson.

## Conventions

- **No `any` types** — use the interfaces in `src/types/index.ts`
- **API calls in components** use `src/api/index.ts` wrappers, never raw axios
- **Tailwind dark mode** via `dark:` classes; `uiStore.darkMode` toggles `document.documentElement.classList`
- **Skeleton loaders** for every data-fetching state (see `DashboardPage` for pattern)
- **No comments** unless the WHY is non-obvious

## Common tasks

### Add a new lesson
1. Add entry to `backend/app/curriculum/data/lessons.json`
2. Add exercises to `backend/app/curriculum/data/exercises.json`
3. Run seeder

### Add a new AI tool tab in Learning Tools
1. Create component in `frontend/src/components/learning/`
2. Add tab entry in `frontend/src/pages/LearningToolsPage.tsx`

### Add a new achievement
Add to `backend/app/curriculum/data/achievements.json` and run seeder. Trigger logic is in `backend/app/services/gamification_service.py → check_and_award_achievements`.

### Change XP per level thresholds
Edit `XP_PER_LEVEL` list in `backend/app/services/gamification_service.py`.
