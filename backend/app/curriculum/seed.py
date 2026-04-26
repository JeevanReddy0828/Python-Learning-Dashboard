"""
Idempotent database seeder for curriculum data.
Run with: python -m app.curriculum.seed
"""
import asyncio
import json
import os
from pathlib import Path

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import AsyncSessionLocal, engine, Base
from app.models.module import Module
from app.models.lesson import Lesson
from app.models.exercise import Exercise
from app.models.achievement import Achievement

DATA_DIR = Path(__file__).parent / "data"


async def seed():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    async with AsyncSessionLocal() as db:
        await seed_modules(db)
        await seed_lessons(db)
        await seed_exercises(db)
        await seed_achievements(db)
        print("✅ Seed complete!")


async def seed_modules(db: AsyncSession):
    data = json.loads((DATA_DIR / "modules.json").read_text())
    for m in data:
        existing = await db.scalar(select(Module).where(Module.slug == m["slug"]))
        if not existing:
            db.add(Module(**m))
    await db.commit()
    print(f"  Seeded {len(data)} modules")


async def seed_lessons(db: AsyncSession):
    data = json.loads((DATA_DIR / "lessons.json").read_text())
    created = updated = 0
    for l in data:
        module_slug = l.pop("module_slug")
        module = await db.scalar(select(Module).where(Module.slug == module_slug))
        if not module:
            print(f"  WARNING: Module '{module_slug}' not found, skipping lesson '{l['slug']}'")
            continue
        existing = await db.scalar(
            select(Lesson).where(Lesson.module_id == module.id, Lesson.slug == l["slug"])
        )
        if not existing:
            db.add(Lesson(module_id=module.id, **l))
            created += 1
        else:
            for key, value in l.items():
                setattr(existing, key, value)
            updated += 1
    await db.commit()
    print(f"  Seeded {created} new lessons, updated {updated}")


async def seed_exercises(db: AsyncSession):
    data = json.loads((DATA_DIR / "exercises.json").read_text())
    count = 0
    for e in data:
        lesson_slug = e.pop("lesson_slug")
        lesson = await db.scalar(select(Lesson).where(Lesson.slug == lesson_slug))
        if not lesson:
            print(f"  WARNING: Lesson '{lesson_slug}' not found, skipping exercise")
            continue
        existing = await db.scalar(
            select(Exercise).where(
                Exercise.lesson_id == lesson.id,
                Exercise.title == e["title"]
            )
        )
        if not existing:
            db.add(Exercise(lesson_id=lesson.id, **e))
            count += 1
    await db.commit()
    print(f"  Seeded {count} exercises")


async def seed_achievements(db: AsyncSession):
    data = json.loads((DATA_DIR / "achievements.json").read_text())
    count = 0
    for a in data:
        existing = await db.scalar(select(Achievement).where(Achievement.slug == a["slug"]))
        if not existing:
            db.add(Achievement(**a))
            count += 1
    await db.commit()
    print(f"  Seeded {count} achievements")


if __name__ == "__main__":
    asyncio.run(seed())
