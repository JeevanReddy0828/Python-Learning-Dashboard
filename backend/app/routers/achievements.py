from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.achievement import Achievement, UserAchievement
from app.schemas.achievement import AchievementRead

router = APIRouter()


@router.get("/", response_model=list[AchievementRead])
async def list_achievements(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    all_result = await db.execute(select(Achievement))
    all_achievements = all_result.scalars().all()

    earned_result = await db.execute(
        select(UserAchievement).where(UserAchievement.user_id == current_user.id)
    )
    earned_map = {ua.achievement_id: ua.earned_at for ua in earned_result.scalars()}

    return [
        AchievementRead(
            id=a.id, slug=a.slug, title=a.title, description=a.description,
            icon=a.icon, xp_reward=a.xp_reward, trigger_type=a.trigger_type,
            trigger_value=a.trigger_value,
            earned_at=earned_map.get(a.id),
        )
        for a in all_achievements
    ]


@router.get("/earned", response_model=list[AchievementRead])
async def earned_achievements(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(UserAchievement, Achievement)
        .join(Achievement)
        .where(UserAchievement.user_id == current_user.id)
        .order_by(UserAchievement.earned_at.desc())
    )
    return [
        AchievementRead(
            id=ach.id, slug=ach.slug, title=ach.title, description=ach.description,
            icon=ach.icon, xp_reward=ach.xp_reward, trigger_type=ach.trigger_type,
            trigger_value=ach.trigger_value, earned_at=ua.earned_at,
        )
        for ua, ach in result
    ]
