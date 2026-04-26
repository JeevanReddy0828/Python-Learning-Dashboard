from datetime import date
from pydantic import BaseModel


class StreakInfo(BaseModel):
    current_streak: int
    longest_streak: int
    last_activity: date | None
