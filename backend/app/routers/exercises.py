import uuid

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.exercise import Exercise
from app.models.progress import UserExerciseProgress
from app.schemas.exercise import ExerciseDetail, SubmitRequest, SubmitResponse
from app.services import exercise_service

router = APIRouter()


@router.get("/{exercise_id}", response_model=ExerciseDetail)
async def get_exercise(
    exercise_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ex = await db.scalar(select(Exercise).where(Exercise.id == exercise_id))
    if not ex:
        raise HTTPException(status_code=404, detail="Exercise not found")

    ep = await db.scalar(
        select(UserExerciseProgress).where(
            UserExerciseProgress.user_id == current_user.id,
            UserExerciseProgress.exercise_id == exercise_id,
        )
    )

    return ExerciseDetail(
        id=ex.id, type=ex.type, title=ex.title,
        xp_reward=ex.xp_reward, order_index=ex.order_index,
        status=ep.status if ep else "not_started",
        instructions=ex.instructions,
        starter_code=ex.starter_code,
        hints=ex.hints or [],
        options=ex.options,
    )


@router.get("/{exercise_id}/hint")
async def get_hint(
    exercise_id: uuid.UUID,
    hint_index: int = Query(default=0, ge=0),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ex = await db.scalar(select(Exercise).where(Exercise.id == exercise_id))
    if not ex:
        raise HTTPException(status_code=404, detail="Exercise not found")

    hints = ex.hints or []
    if hint_index >= len(hints):
        return {"hint": "No more hints available — you've got this!", "hint_index": hint_index}
    return {"hint": hints[hint_index], "hint_index": hint_index}


@router.post("/{exercise_id}/submit", response_model=SubmitResponse)
async def submit_exercise(
    exercise_id: uuid.UUID,
    payload: SubmitRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    ex = await db.scalar(select(Exercise).where(Exercise.id == exercise_id))
    if not ex:
        raise HTTPException(status_code=404, detail="Exercise not found")

    return await exercise_service.submit(ex, current_user, payload, db)
