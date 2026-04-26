import uuid
from datetime import datetime, timezone
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.exercise import Exercise
from app.models.progress import UserExerciseProgress
from app.models.code_submission import CodeSubmission
from app.schemas.exercise import ExerciseDetail, SubmitRequest, SubmitResponse
from app.services.code_execution_service import run_python_code, check_test_cases
from app.services.gamification_service import award_xp, check_and_award_achievements

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

    ep = await db.scalar(
        select(UserExerciseProgress).where(
            UserExerciseProgress.user_id == current_user.id,
            UserExerciseProgress.exercise_id == exercise_id,
        )
    )
    if not ep:
        ep = UserExerciseProgress(user_id=current_user.id, exercise_id=exercise_id)
        db.add(ep)

    ep.attempts += 1
    stdout = stderr = ""
    passed = False
    feedback = ""

    if ex.type == "mcq":
        correct_labels = {opt["label"] for opt in (ex.options or []) if opt.get("is_correct")}
        passed = payload.answer in correct_labels if payload.answer else False
        feedback = "Correct! 🎉" if passed else f"Not quite. Try again!"

    elif ex.type in ("fill_blank", "debug", "mini_project"):
        code = payload.code or ""
        result = await run_python_code(code)
        stdout = result.stdout
        stderr = result.stderr

        if result.timed_out:
            feedback = "Your code took too long to run. Check for infinite loops!"
        elif result.stderr:
            passed = False
            feedback = "There's an error in your code — check the output panel!"
        else:
            passed, feedback = check_test_cases(result.stdout, ex.test_cases or [])

        submission = CodeSubmission(
            user_id=current_user.id,
            exercise_id=exercise_id,
            code=code,
            stdout=stdout,
            stderr=stderr,
            passed=passed,
            execution_time=result.execution_time,
        )
        db.add(submission)

    xp_gained = 0
    leveled_up = False
    new_level = None
    new_achievements = []

    if passed and ep.status != "passed":
        ep.status = "passed"
        ep.xp_awarded = ex.xp_reward
        ep.completed_at = datetime.now(timezone.utc)
        await db.flush()
        _, leveled_up, new_level = await award_xp(current_user, ex.xp_reward, db)
        xp_gained = ex.xp_reward
        new_achievements = await check_and_award_achievements(current_user, db)
    elif not passed and ep.status == "not_started":
        ep.status = "attempted"

    await db.commit()

    return SubmitResponse(
        passed=passed,
        feedback=feedback,
        xp_gained=xp_gained,
        stdout=stdout or None,
        stderr=stderr or None,
        new_achievements=new_achievements,
        level_up=leveled_up,
        new_level=new_level if leveled_up else None,
    )
