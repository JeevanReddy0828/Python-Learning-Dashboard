from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routers import auth, users, modules, lessons, exercises, progress, achievements, streaks, code_execution, ai


def create_app() -> FastAPI:
    app = FastAPI(
        title="ADHD Python Dashboard API",
        version="1.0.0",
        docs_url="/api/docs",
        redoc_url="/api/redoc",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origins,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    prefix = "/api/v1"
    app.include_router(auth.router, prefix=f"{prefix}/auth", tags=["auth"])
    app.include_router(users.router, prefix=f"{prefix}/users", tags=["users"])
    app.include_router(modules.router, prefix=f"{prefix}/modules", tags=["modules"])
    app.include_router(lessons.router, prefix=f"{prefix}/lessons", tags=["lessons"])
    app.include_router(exercises.router, prefix=f"{prefix}/exercises", tags=["exercises"])
    app.include_router(progress.router, prefix=f"{prefix}/progress", tags=["progress"])
    app.include_router(achievements.router, prefix=f"{prefix}/achievements", tags=["achievements"])
    app.include_router(streaks.router, prefix=f"{prefix}/streaks", tags=["streaks"])
    app.include_router(code_execution.router, prefix=f"{prefix}/code", tags=["code"])
    app.include_router(ai.router, prefix=f"{prefix}/ai", tags=["ai"])

    @app.get("/api/health")
    async def health():
        return {"status": "ok"}

    return app


app = create_app()
