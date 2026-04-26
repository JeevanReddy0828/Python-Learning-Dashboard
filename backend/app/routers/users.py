from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.streak import Streak
from app.models.achievement import Achievement, UserAchievement
from app.schemas.user import UserRead, UserUpdate, UserStats
from app.schemas.achievement import AchievementRead
from app.schemas.streak import StreakInfo

router = APIRouter()


@router.get("/me", response_model=dict)
async def get_profile(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    streak = await db.scalar(select(Streak).where(Streak.user_id == current_user.id))
    streak_info = StreakInfo(
        current_streak=streak.current_streak if streak else 0,
        longest_streak=streak.longest_streak if streak else 0,
        last_activity=streak.last_activity if streak else None,
    )

    ua_result = await db.execute(
        select(UserAchievement, Achievement)
        .join(Achievement)
        .where(UserAchievement.user_id == current_user.id)
        .order_by(UserAchievement.earned_at.desc())
        .limit(5)
    )
    recent_achievements = [
        AchievementRead(
            id=ach.id, slug=ach.slug, title=ach.title,
            description=ach.description, icon=ach.icon,
            xp_reward=ach.xp_reward, trigger_type=ach.trigger_type,
            trigger_value=ach.trigger_value, earned_at=ua.earned_at,
        )
        for ua, ach in ua_result
    ]

    return {
        **UserRead.model_validate(current_user).model_dump(),
        "streak": streak_info.model_dump(),
        "recent_achievements": [a.model_dump() for a in recent_achievements],
    }


@router.patch("/me", response_model=UserRead)
async def update_profile(
    payload: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if payload.display_name is not None:
        current_user.display_name = payload.display_name
    if payload.avatar_url is not None:
        current_user.avatar_url = payload.avatar_url
    await db.commit()
    await db.refresh(current_user)
    return current_user


@router.get("/me/stats", response_model=UserStats)
async def get_stats(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    from app.models.progress import UserLessonProgress, UserExerciseProgress
    from app.models.lesson import Lesson

    total_lessons = await db.scalar(select(func.count(Lesson.id))) or 0
    completed_lessons = await db.scalar(
        select(func.count(UserLessonProgress.id)).where(
            UserLessonProgress.user_id == current_user.id,
            UserLessonProgress.status == "completed"
        )
    ) or 0
    completed_exercises = await db.scalar(
        select(func.count(UserExerciseProgress.id)).where(
            UserExerciseProgress.user_id == current_user.id,
            UserExerciseProgress.status == "passed"
        )
    ) or 0

    pct = round(completed_lessons / total_lessons * 100, 1) if total_lessons else 0

    return UserStats(
        total_xp=current_user.xp,
        level=current_user.level,
        lessons_completed=completed_lessons,
        exercises_completed=completed_exercises,
        completion_percent=pct,
    )
