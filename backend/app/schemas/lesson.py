import uuid
from pydantic import BaseModel, ConfigDict
from app.schemas.exercise import ExerciseDetail
from app.schemas.achievement import AchievementRead


class LessonDetail(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    module_id: uuid.UUID
    slug: str
    title: str
    eli5_summary: str
    content_html: str
    analogy: str
    diagram_data: dict | None
    estimated_min: int
    xp_reward: int
    order_index: int
    exercises: list[ExerciseDetail] = []
    status: str = "not_started"
    next_lesson_id: uuid.UUID | None = None
    next_lesson_title: str | None = None


class LessonCompleteRequest(BaseModel):
    time_spent_sec: int = 0


class LessonCompleteResponse(BaseModel):
    xp_gained: int
    level_up: bool = False
    new_level: int | None = None
    new_achievements: list[AchievementRead] = []
