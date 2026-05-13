"""
Shared fixtures for all tests.

Database strategy: each test runs inside a transaction that is rolled back
after the test completes, keeping the DB clean without recreating tables.
Requires a running PostgreSQL (use the Docker DB or set TEST_DATABASE_URL).
"""

import os
import uuid
import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker

from app.main import create_app
from app.database import Base, get_db
from app.models import User, Module, Lesson, Exercise, Streak
from app.services.auth_service import hash_password, create_access_token

# Use a dedicated test DB if set, else fall back to the dev DB
TEST_DB_URL = os.getenv(
    "TEST_DATABASE_URL",
    "postgresql+asyncpg://adhd:adhd_secret@localhost:5432/adhd_dashboard",
)

# ── Engine (session-scoped so tables are only created once) ─────────────────
_engine = create_async_engine(TEST_DB_URL, echo=False, pool_pre_ping=True)
_TestSession = async_sessionmaker(_engine, class_=AsyncSession, expire_on_commit=False)


@pytest_asyncio.fixture(scope="session", autouse=True)
async def create_tables():
    """Create all tables once for the whole test session."""
    async with _engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield
    # leave tables in place — they'll be cleaned per-test via rollback


@pytest_asyncio.fixture()
async def db():
    """
    Per-test DB session that rolls back after each test.
    Uses a nested SAVEPOINT so the outer transaction keeps the DB clean.
    """
    async with _engine.connect() as conn:
        await conn.begin()
        # Create a SAVEPOINT so we can roll back to it after the test
        nested = await conn.begin_nested()

        session = AsyncSession(bind=conn, expire_on_commit=False)
        try:
            yield session
        finally:
            await session.close()
            # Roll back to the SAVEPOINT (wipes all test writes)
            await nested.rollback()
            await conn.rollback()


@pytest_asyncio.fixture()
async def client(db):
    """Async HTTP client wired to the FastAPI app with the test DB session."""
    app = create_app()

    async def _override_db():
        yield db

    app.dependency_overrides[get_db] = _override_db

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as ac:
        yield ac


# ── Seed helpers ─────────────────────────────────────────────────────────────

@pytest_asyncio.fixture()
async def test_user(db):
    """A registered user with a streak row."""
    user = User(
        email=f"test_{uuid.uuid4().hex[:8]}@example.com",
        password_hash=hash_password("Password123!"),
        display_name="Test User",
    )
    db.add(user)
    await db.flush()
    db.add(Streak(user_id=user.id))
    await db.flush()
    return user


@pytest_asyncio.fixture()
async def auth_headers(test_user):
    """Bearer token headers for the test user."""
    token = create_access_token(test_user.id)
    return {"Authorization": f"Bearer {token}"}


@pytest_asyncio.fixture()
async def test_module(db):
    mod = Module(
        slug=f"mod-{uuid.uuid4().hex[:6]}",
        title="Test Module",
        description="A test module",
        order_index=99,
    )
    db.add(mod)
    await db.flush()
    return mod


@pytest_asyncio.fixture()
async def test_lesson(db, test_module):
    lesson = Lesson(
        module_id=test_module.id,
        slug=f"lesson-{uuid.uuid4().hex[:6]}",
        title="Test Lesson",
        eli5_summary="Simple summary",
        content_html="<p>Content</p>",
        analogy="Like a box",
        order_index=1,
        xp_reward=20,
    )
    db.add(lesson)
    await db.flush()
    return lesson


@pytest_asyncio.fixture()
async def test_exercise_mcq(db, test_lesson):
    ex = Exercise(
        lesson_id=test_lesson.id,
        type="mcq",
        title="MCQ Exercise",
        instructions="Pick the right answer",
        order_index=1,
        xp_reward=10,
        options=[
            {"label": "correct", "is_correct": True},
            {"label": "wrong1", "is_correct": False},
            {"label": "wrong2", "is_correct": False},
        ],
    )
    db.add(ex)
    await db.flush()
    return ex


@pytest_asyncio.fixture()
async def test_exercise_code(db, test_lesson):
    ex = Exercise(
        lesson_id=test_lesson.id,
        type="fill_blank",
        title="Code Exercise",
        instructions="Print hello",
        starter_code='print("hello")',
        order_index=2,
        xp_reward=15,
        test_cases=[{"input": "", "expected_output": "hello"}],
        hints=["Use print()", "print('hello')", "Exact answer: print('hello')"],
    )
    db.add(ex)
    await db.flush()
    return ex
