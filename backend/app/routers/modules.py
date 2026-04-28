from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.module import Module
from app.models.lesson import Lesson
from app.models.progress import UserLessonProgress
from app.schemas.module import ModuleRead, ModuleDetail, LessonSummary
from app.services import cache_service

router = APIRouter()


async def _lesson_status(user_id, lesson_id, db) -> str:
    lp = await db.scalar(
        select(UserLessonProgress).where(
            UserLessonProgress.user_id == user_id,
            UserLessonProgress.lesson_id == lesson_id,
        )
    )
    return lp.status if lp else "not_started"


@router.get("/", response_model=list[ModuleRead])
async def list_modules(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    cache_key = f"modules:{current_user.id}"
    cached = await cache_service.cache_get(cache_key)
    if cached:
        return cached

    result = await db.execute(
        select(Module).where(Module.is_published == True).order_by(Module.order_index)
    )
    modules = result.scalars().all()

    out = []
    for mod in modules:
        lessons_result = await db.execute(select(Lesson).where(Lesson.module_id == mod.id))
        lessons = lessons_result.scalars().all()
        lesson_count = len(lessons)
        completed = 0
        for lesson in lessons:
            status = await _lesson_status(current_user.id, lesson.id, db)
            if status == "completed":
                completed += 1
        pct = round(completed / lesson_count * 100, 1) if lesson_count else 0
        out.append(ModuleRead(
            id=mod.id, slug=mod.slug, title=mod.title,
            description=mod.description, icon=mod.icon, order_index=mod.order_index,
            lesson_count=lesson_count, completion_percent=pct,
        ))

    await cache_service.cache_set(cache_key, [m.model_dump() for m in out], ttl=120)
    return out


@router.get("/{module_slug}", response_model=ModuleDetail)
async def get_module(
    module_slug: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    mod = await db.scalar(select(Module).where(Module.slug == module_slug))
    if not mod:
        from fastapi import HTTPException
        raise HTTPException(status_code=404, detail="Module not found")

    lessons_result = await db.execute(
        select(Lesson).where(Lesson.module_id == mod.id).order_by(Lesson.order_index)
    )
    lessons = lessons_result.scalars().all()
    lesson_count = len(lessons)
    completed = 0
    lesson_summaries = []
    for lesson in lessons:
        status = await _lesson_status(current_user.id, lesson.id, db)
        if status == "completed":
            completed += 1
        lesson_summaries.append(LessonSummary(
            id=lesson.id, slug=lesson.slug, title=lesson.title,
            eli5_summary=lesson.eli5_summary, estimated_min=lesson.estimated_min,
            xp_reward=lesson.xp_reward, order_index=lesson.order_index, status=status,
        ))

    pct = round(completed / lesson_count * 100, 1) if lesson_count else 0
    return ModuleDetail(
        id=mod.id, slug=mod.slug, title=mod.title,
        description=mod.description, icon=mod.icon, order_index=mod.order_index,
        lesson_count=lesson_count, completion_percent=pct,
        lessons=lesson_summaries,
    )
