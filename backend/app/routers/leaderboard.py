"""
XP leaderboard backed by Redis sorted sets.
GET /api/v1/leaderboard       → top 20 users
GET /api/v1/leaderboard/me    → current user's rank
"""
from fastapi import APIRouter, Depends
from pydantic import BaseModel

from app.deps import get_current_user
from app.models.user import User
from app.services import cache_service

router = APIRouter()


class LeaderboardEntry(BaseModel):
    rank: int
    user_id: str
    display_name: str
    xp: int
    is_me: bool = False


class MyRankResponse(BaseModel):
    rank: int | None
    xp: int
    display_name: str


@router.get("/", response_model=list[LeaderboardEntry])
async def get_leaderboard(current_user: User = Depends(get_current_user)):
    # Ensure the current user is always in the leaderboard
    await cache_service.leaderboard_upsert(
        str(current_user.id), current_user.display_name, current_user.xp
    )
    entries = await cache_service.leaderboard_get(top_n=20)
    return [
        LeaderboardEntry(
            **e,
            is_me=e["user_id"] == str(current_user.id),
        )
        for e in entries
    ]


@router.get("/me", response_model=MyRankResponse)
async def my_rank(current_user: User = Depends(get_current_user)):
    await cache_service.leaderboard_upsert(
        str(current_user.id), current_user.display_name, current_user.xp
    )
    rank = await cache_service.leaderboard_rank(str(current_user.id))
    return MyRankResponse(
        rank=rank,
        xp=current_user.xp,
        display_name=current_user.display_name,
    )


@router.post("/sync")
async def sync_to_leaderboard(current_user: User = Depends(get_current_user)):
    """Call this whenever the user gains XP to keep the leaderboard fresh."""
    await cache_service.leaderboard_upsert(
        str(current_user.id), current_user.display_name, current_user.xp
    )
    return {"ok": True}
