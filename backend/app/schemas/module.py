import uuid
from pydantic import BaseModel, ConfigDict


class LessonSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    title: str
    eli5_summary: str
    estimated_min: int
    xp_reward: int
    order_index: int
    status: str = "not_started"


class ModuleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    title: str
    description: str
    icon: str
    order_index: int
    lesson_count: int = 0
    completion_percent: float = 0.0


class ModuleDetail(ModuleRead):
    lessons: list[LessonSummary] = []
