from datetime import date
from pydantic import BaseModel
from app.schemas.module import LessonSummary


class WeeklyActivity(BaseModel):
    date: date
    xp_earned: int
    lessons_completed: int
    exercises_completed: int


class WeakArea(BaseModel):
    module_id: str
    module_title: str
    completion_percent: float
    suggested_lessons: list[LessonSummary] = []


class ProgressSummary(BaseModel):
    total_lessons: int
    completed_lessons: int
    total_exercises: int
    completed_exercises: int
    overall_percent: float
