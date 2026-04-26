from datetime import date, timedelta
from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.streak import Streak
from app.models.achievement import Achievement, UserAchievement
from app.schemas.streak import StreakInfo
from app.schemas.achievement import AchievementRead
from app.services.gamification_service import award_xp, compute_level

router = APIRouter()


@router.get("/", response_model=StreakInfo)
async def get_streak(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    streak = await db.scalar(select(Streak).where(Streak.user_id == current_user.id))
    if not streak:
        return StreakInfo(current_streak=0, longest_streak=0, last_activity=None)
    return StreakInfo(
        current_streak=streak.current_streak,
        longest_streak=streak.longest_streak,
        last_activity=streak.last_activity,
    )


@router.post("/check-in", response_model=dict)
async def check_in(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    today = date.today()
    streak = await db.scalar(select(Streak).where(Streak.user_id == current_user.id))
    if not streak:
        streak = Streak(user_id=current_user.id)
        db.add(streak)

    if streak.last_activity == today:
        return {"streak": StreakInfo(
            current_streak=streak.current_streak,
            longest_streak=streak.longest_streak,
            last_activity=streak.last_activity,
        ).model_dump(), "new_achievements": []}

    yesterday = today - timedelta(days=1)
    if streak.last_activity == yesterday:
        streak.current_streak += 1
    elif streak.last_activity is None or streak.last_activity < yesterday:
        streak.current_streak = 1

    streak.last_activity = today
    streak.longest_streak = max(streak.longest_streak, streak.current_streak)

    # Check streak achievements
    streak_achievements_result = await db.execute(
        select(Achievement).where(Achievement.trigger_type == "streak")
    )
    streak_achievements = streak_achievements_result.scalars().all()
    new_achievements = []
    for ach in streak_achievements:
        if streak.current_streak >= ach.trigger_value:
            existing = await db.scalar(
                select(UserAchievement).where(
                    UserAchievement.user_id == current_user.id,
                    UserAchievement.achievement_id == ach.id,
                )
            )
            if not existing:
                ua = UserAchievement(user_id=current_user.id, achievement_id=ach.id)
                db.add(ua)
                current_user.xp += ach.xp_reward
                current_user.level = compute_level(current_user.xp)
                new_achievements.append(AchievementRead(
                    id=ach.id, slug=ach.slug, title=ach.title,
                    description=ach.description, icon=ach.icon,
                    xp_reward=ach.xp_reward, trigger_type=ach.trigger_type,
                    trigger_value=ach.trigger_value,
                ))

    await db.commit()
    return {
        "streak": StreakInfo(
            current_streak=streak.current_streak,
            longest_streak=streak.longest_streak,
            last_activity=streak.last_activity,
        ).model_dump(),
        "new_achievements": [a.model_dump() for a in new_achievements],
    }
