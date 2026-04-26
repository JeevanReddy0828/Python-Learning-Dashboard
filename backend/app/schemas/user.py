import uuid
from pydantic import BaseModel, EmailStr, ConfigDict


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    display_name: str
    avatar_url: str | None
    xp: int
    level: int


class UserUpdate(BaseModel):
    display_name: str | None = None
    avatar_url: str | None = None


class UserStats(BaseModel):
    total_xp: int
    level: int
    lessons_completed: int
    exercises_completed: int
    completion_percent: float
