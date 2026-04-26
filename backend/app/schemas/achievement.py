import uuid
from datetime import datetime
from pydantic import BaseModel, ConfigDict


class AchievementRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    slug: str
    title: str
    description: str
    icon: str
    xp_reward: int
    trigger_type: str
    trigger_value: int
    earned_at: datetime | None = None
