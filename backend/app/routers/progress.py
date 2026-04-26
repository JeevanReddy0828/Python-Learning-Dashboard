from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.schemas.progress import WeeklyActivity, WeakArea, ProgressSummary
from app.services.progress_service import get_progress_summary, get_weekly_activity, get_weak_areas

router = APIRouter()


@router.get("/", response_model=ProgressSummary)
async def progress_summary(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_progress_summary(current_user, db)


@router.get("/weekly", response_model=list[WeeklyActivity])
async def weekly_activity(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_weekly_activity(current_user, db)


@router.get("/weak-areas", response_model=list[WeakArea])
async def weak_areas(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    return await get_weak_areas(current_user, db)
