from datetime import datetime, timezone

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.exercise import Exercise
from app.models.progress import UserExerciseProgress
from app.models.code_submission import CodeSubmission
from app.models.user import User
from app.schemas.exercise import SubmitRequest, SubmitResponse
from app.services.code_execution_service import run_python_code, check_test_cases
from app.services.gamification_service import award_xp, check_and_award_achievements


async def submit(
    exercise: Exercise,
    user: User,
    payload: SubmitRequest,
    db: AsyncSession,
) -> SubmitResponse:
    ep = await _get_or_create_progress(user, exercise, db)
    ep.attempts = (ep.attempts or 0) + 1

    passed, feedback, stdout, stderr = await _evaluate(exercise, payload)

    if passed and ep.status != "passed":
        ep.status = "passed"
        ep.xp_awarded = exercise.xp_reward
        ep.completed_at = datetime.now(timezone.utc)
        await db.flush()
        _, leveled_up, new_level = await award_xp(user, exercise.xp_reward, db)
        new_achievements = await check_and_award_achievements(user, db)
        xp_gained = exercise.xp_reward
    else:
        leveled_up = False
        new_level = None
        new_achievements = []
        xp_gained = 0
        if not passed and ep.status == "not_started":
            ep.status = "attempted"

    if exercise.type in ("fill_blank", "debug", "mini_project"):
        db.add(CodeSubmission(
            user_id=user.id,
            exercise_id=exercise.id,
            code=payload.code or "",
            stdout=stdout,
            stderr=stderr,
            passed=passed,
        ))

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


async def _evaluate(
    exercise: Exercise,
    payload: SubmitRequest,
) -> tuple[bool, str, str, str]:
    if exercise.type == "mcq":
        correct = {opt["label"] for opt in (exercise.options or []) if opt.get("is_correct")}
        passed = payload.answer in correct if payload.answer else False
        return passed, ("Correct! 🎉" if passed else "Not quite. Try again!"), "", ""

    code = payload.code or ""
    result = await run_python_code(code)

    if result.timed_out:
        return False, "Your code took too long to run. Check for infinite loops!", result.stdout, result.stderr
    if result.stderr:
        return False, "There's an error in your code — check the output panel!", result.stdout, result.stderr

    passed, feedback = check_test_cases(result.stdout, exercise.test_cases or [])
    return passed, feedback, result.stdout, result.stderr


async def _get_or_create_progress(
    user: User,
    exercise: Exercise,
    db: AsyncSession,
) -> UserExerciseProgress:
    from sqlalchemy import select
    ep = await db.scalar(
        select(UserExerciseProgress).where(
            UserExerciseProgress.user_id == user.id,
            UserExerciseProgress.exercise_id == exercise.id,
        )
    )
    if not ep:
        ep = UserExerciseProgress(user_id=user.id, exercise_id=exercise.id, attempts=0)
        db.add(ep)
    return ep
