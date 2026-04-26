from datetime import datetime, timezone
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.user import User
from app.models.achievement import Achievement, UserAchievement
from app.models.progress import UserLessonProgress, UserExerciseProgress
from app.schemas.achievement import AchievementRead

XP_PER_LEVEL = [0, 100, 250, 500, 900, 1400, 2100, 3000, 4200, 5700, 7500]


def compute_level(total_xp: int) -> int:
    for level, threshold in enumerate(XP_PER_LEVEL):
        if total_xp < threshold:
            return max(1, level)
    extra = total_xp - XP_PER_LEVEL[-1]
    return 10 + (extra // 2000)


def xp_to_next_level(current_level: int) -> int:
    if current_level < len(XP_PER_LEVEL):
        return XP_PER_LEVEL[current_level]
    return XP_PER_LEVEL[-1] + ((current_level - 10 + 1) * 2000)


async def award_xp(user: User, xp_amount: int, db: AsyncSession) -> tuple[int, bool, int]:
    """Returns (new_xp, leveled_up, new_level)."""
    old_level = user.level
    user.xp += xp_amount
    user.level = compute_level(user.xp)
    await db.flush()
    return user.xp, user.level > old_level, user.level


async def check_and_award_achievements(
    user: User, db: AsyncSession
) -> list[AchievementRead]:
    earned_slugs_result = await db.execute(
        select(UserAchievement.achievement_id).where(UserAchievement.user_id == user.id)
    )
    earned_ids = {row[0] for row in earned_slugs_result}

    all_achievements_result = await db.execute(select(Achievement))
    all_achievements = all_achievements_result.scalars().all()

    lessons_done_result = await db.execute(
        select(func.count()).where(
            UserLessonProgress.user_id == user.id,
            UserLessonProgress.status == "completed"
        )
    )
    lessons_done = lessons_done_result.scalar() or 0

    exercises_done_result = await db.execute(
        select(func.count()).where(
            UserExerciseProgress.user_id == user.id,
            UserExerciseProgress.status == "passed"
        )
    )
    exercises_done = exercises_done_result.scalar() or 0

    newly_earned = []
    for achievement in all_achievements:
        if achievement.id in earned_ids:
            continue

        triggered = False
        t = achievement.trigger_type
        v = achievement.trigger_value

        if t == "lessons_completed" and lessons_done >= v:
            triggered = True
        elif t == "exercises_completed" and exercises_done >= v:
            triggered = True
        elif t == "xp_threshold" and user.xp >= v:
            triggered = True
        elif t == "level" and user.level >= v:
            triggered = True
        elif t == "streak":
            pass  # handled by streak endpoint

        if triggered:
            ua = UserAchievement(user_id=user.id, achievement_id=achievement.id)
            db.add(ua)
            user.xp += achievement.xp_reward
            user.level = compute_level(user.xp)
            newly_earned.append(AchievementRead(
                id=achievement.id,
                slug=achievement.slug,
                title=achievement.title,
                description=achievement.description,
                icon=achievement.icon,
                xp_reward=achievement.xp_reward,
                trigger_type=achievement.trigger_type,
                trigger_value=achievement.trigger_value,
                earned_at=datetime.now(timezone.utc),
            ))

    return newly_earned
