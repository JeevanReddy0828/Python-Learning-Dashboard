import uuid
from pydantic import BaseModel, ConfigDict
from app.schemas.achievement import AchievementRead


class ExerciseSummary(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    type: str
    title: str
    xp_reward: int
    order_index: int
    status: str = "not_started"


class ExerciseDetail(ExerciseSummary):
    instructions: str
    starter_code: str | None
    hints: list[str] = []
    options: list[dict] | None = None


class SubmitRequest(BaseModel):
    code: str | None = None
    answer: str | None = None  # for MCQ / fill-blank answer key


class SubmitResponse(BaseModel):
    passed: bool
    feedback: str
    xp_gained: int
    stdout: str | None = None
    stderr: str | None = None
    new_achievements: list[AchievementRead] = []
    level_up: bool = False
    new_level: int | None = None
