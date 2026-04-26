from datetime import date, timedelta
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, func

from app.models.user import User
from app.models.module import Module
from app.models.lesson import Lesson
from app.models.progress import UserLessonProgress, UserExerciseProgress
from app.models.code_submission import CodeSubmission
from app.schemas.progress import WeeklyActivity, WeakArea, ProgressSummary
from app.schemas.module import LessonSummary


async def get_progress_summary(user: User, db: AsyncSession) -> ProgressSummary:
    total_lessons = await db.scalar(select(func.count(Lesson.id))) or 0
    completed_lessons = await db.scalar(
        select(func.count(UserLessonProgress.id)).where(
            UserLessonProgress.user_id == user.id,
            UserLessonProgress.status == "completed"
        )
    ) or 0

    total_exercises_result = await db.execute(select(func.count()).select_from(
        __import__("app.models.exercise", fromlist=["Exercise"]).Exercise
    ))
    total_exercises = total_exercises_result.scalar() or 0
    completed_exercises = await db.scalar(
        select(func.count(UserExerciseProgress.id)).where(
            UserExerciseProgress.user_id == user.id,
            UserExerciseProgress.status == "passed"
        )
    ) or 0

    overall = round((completed_lessons / total_lessons * 100) if total_lessons else 0, 1)

    return ProgressSummary(
        total_lessons=total_lessons,
        completed_lessons=completed_lessons,
        total_exercises=total_exercises,
        completed_exercises=completed_exercises,
        overall_percent=overall,
    )


async def get_weekly_activity(user: User, db: AsyncSession) -> list[WeeklyActivity]:
    today = date.today()
    result = []
    for i in range(6, -1, -1):
        day = today - timedelta(days=i)
        day_start = f"{day} 00:00:00"
        day_end = f"{day} 23:59:59"

        lessons_count = await db.scalar(
            select(func.count(UserLessonProgress.id)).where(
                UserLessonProgress.user_id == user.id,
                UserLessonProgress.status == "completed",
                func.date(UserLessonProgress.completed_at) == day,
            )
        ) or 0

        exercises_count = await db.scalar(
            select(func.count(UserExerciseProgress.id)).where(
                UserExerciseProgress.user_id == user.id,
                UserExerciseProgress.status == "passed",
                func.date(UserExerciseProgress.completed_at) == day,
            )
        ) or 0

        xp_earned = (lessons_count * 10) + (exercises_count * 20)

        result.append(WeeklyActivity(
            date=day,
            xp_earned=xp_earned,
            lessons_completed=lessons_count,
            exercises_completed=exercises_count,
        ))
    return result


async def get_weak_areas(user: User, db: AsyncSession) -> list[WeakArea]:
    modules_result = await db.execute(select(Module).where(Module.is_published == True).order_by(Module.order_index))
    modules = modules_result.scalars().all()

    weak = []
    for mod in modules:
        lessons_result = await db.execute(
            select(Lesson).where(Lesson.module_id == mod.id).order_by(Lesson.order_index)
        )
        lessons = lessons_result.scalars().all()
        if not lessons:
            continue

        completed = 0
        for lesson in lessons:
            lp = await db.scalar(
                select(UserLessonProgress).where(
                    UserLessonProgress.user_id == user.id,
                    UserLessonProgress.lesson_id == lesson.id,
                    UserLessonProgress.status == "completed",
                )
            )
            if lp:
                completed += 1

        pct = round(completed / len(lessons) * 100, 1) if lessons else 0
        if pct < 60:
            suggested = [
                LessonSummary(
                    id=l.id, slug=l.slug, title=l.title,
                    eli5_summary=l.eli5_summary, estimated_min=l.estimated_min,
                    xp_reward=l.xp_reward, order_index=l.order_index,
                )
                for l in lessons[:3]
            ]
            weak.append(WeakArea(
                module_id=str(mod.id),
                module_title=mod.title,
                completion_percent=pct,
                suggested_lessons=suggested,
            ))
    return weak
