import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.lesson import Lesson
from app.models.exercise import Exercise
from app.models.progress import UserLessonProgress, UserExerciseProgress
from app.schemas.lesson import LessonDetail, LessonCompleteRequest, LessonCompleteResponse
from app.schemas.exercise import ExerciseSummary
from app.services.gamification_service import award_xp, check_and_award_achievements

router = APIRouter()


@router.get("/{lesson_id}", response_model=LessonDetail)
async def get_lesson(
    lesson_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    lesson = await db.scalar(select(Lesson).where(Lesson.id == lesson_id))
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    exercises_result = await db.execute(
        select(Exercise).where(Exercise.lesson_id == lesson.id).order_by(Exercise.order_index)
    )
    exercises = exercises_result.scalars().all()

    lp = await db.scalar(
        select(UserLessonProgress).where(
            UserLessonProgress.user_id == current_user.id,
            UserLessonProgress.lesson_id == lesson.id,
        )
    )
    lesson_status = lp.status if lp else "not_started"

    exercise_summaries = []
    for ex in exercises:
        ep = await db.scalar(
            select(UserExerciseProgress).where(
                UserExerciseProgress.user_id == current_user.id,
                UserExerciseProgress.exercise_id == ex.id,
            )
        )
        exercise_summaries.append(ExerciseSummary(
            id=ex.id, type=ex.type, title=ex.title,
            xp_reward=ex.xp_reward, order_index=ex.order_index,
            status=ep.status if ep else "not_started",
        ))

    return LessonDetail(
        id=lesson.id, module_id=lesson.module_id,
        slug=lesson.slug, title=lesson.title,
        eli5_summary=lesson.eli5_summary,
        content_html=lesson.content_html,
        analogy=lesson.analogy,
        diagram_data=lesson.diagram_data,
        estimated_min=lesson.estimated_min,
        xp_reward=lesson.xp_reward,
        order_index=lesson.order_index,
        exercises=exercise_summaries,
        status=lesson_status,
    )


@router.post("/{lesson_id}/start")
async def start_lesson(
    lesson_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    lesson = await db.scalar(select(Lesson).where(Lesson.id == lesson_id))
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    lp = await db.scalar(
        select(UserLessonProgress).where(
            UserLessonProgress.user_id == current_user.id,
            UserLessonProgress.lesson_id == lesson_id,
        )
    )
    if not lp:
        lp = UserLessonProgress(
            user_id=current_user.id,
            lesson_id=lesson_id,
            status="in_progress",
            started_at=datetime.now(timezone.utc),
        )
        db.add(lp)
    elif lp.status == "not_started":
        lp.status = "in_progress"
        lp.started_at = datetime.now(timezone.utc)

    await db.commit()
    return {"status": "started"}


@router.post("/{lesson_id}/complete", response_model=LessonCompleteResponse)
async def complete_lesson(
    lesson_id: uuid.UUID,
    payload: LessonCompleteRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    lesson = await db.scalar(select(Lesson).where(Lesson.id == lesson_id))
    if not lesson:
        raise HTTPException(status_code=404, detail="Lesson not found")

    lp = await db.scalar(
        select(UserLessonProgress).where(
            UserLessonProgress.user_id == current_user.id,
            UserLessonProgress.lesson_id == lesson_id,
        )
    )
    if not lp:
        lp = UserLessonProgress(
            user_id=current_user.id,
            lesson_id=lesson_id,
            started_at=datetime.now(timezone.utc),
        )
        db.add(lp)

    if lp.status == "completed":
        return LessonCompleteResponse(xp_gained=0)

    lp.status = "completed"
    lp.completed_at = datetime.now(timezone.utc)
    lp.time_spent_sec = payload.time_spent_sec
    await db.flush()

    _, leveled_up, new_level = await award_xp(current_user, lesson.xp_reward, db)
    new_achievements = await check_and_award_achievements(current_user, db)
    await db.commit()

    return LessonCompleteResponse(
        xp_gained=lesson.xp_reward,
        level_up=leveled_up,
        new_level=new_level if leveled_up else None,
        new_achievements=new_achievements,
    )
