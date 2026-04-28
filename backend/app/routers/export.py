"""
Export learning progress to Notion.
Requires NOTION_TOKEN and NOTION_DATABASE_ID in .env.

Creates one Notion page per user (identified by email).
Re-running the export updates the existing page.
"""
import logging
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.config import settings
from app.database import get_db
from app.deps import get_current_user
from app.models.achievement import Achievement
from app.models.progress import UserAchievement, UserExerciseProgress, UserLessonProgress
from app.models.user import User

logger = logging.getLogger(__name__)
router = APIRouter()


class ExportResponse(BaseModel):
    notion_url: str
    message: str


def _notion_client():
    if not settings.notion_token:
        raise HTTPException(
            status_code=503,
            detail="Notion export requires NOTION_TOKEN in your .env file. "
                   "Create a Notion integration at https://www.notion.so/my-integrations",
        )
    from notion_client import Client
    return Client(auth=settings.notion_token)


@router.post("/notion", response_model=ExportResponse)
async def export_to_notion(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if not settings.notion_database_id:
        raise HTTPException(
            status_code=503,
            detail="NOTION_DATABASE_ID not set. Share your Notion database with the integration first.",
        )

    notion = _notion_client()

    # ── Gather stats ────────────────────────────────────────────────────────
    lessons_done = await db.scalar(
        select(func.count()).where(
            UserLessonProgress.user_id == current_user.id,
            UserLessonProgress.status == "completed",
        )
    ) or 0

    exercises_done = await db.scalar(
        select(func.count()).where(
            UserExerciseProgress.user_id == current_user.id,
            UserExerciseProgress.status == "passed",
        )
    ) or 0

    time_spent = await db.scalar(
        select(func.sum(UserLessonProgress.time_spent_sec)).where(
            UserLessonProgress.user_id == current_user.id
        )
    ) or 0

    earned = await db.execute(
        select(Achievement).join(
            UserAchievement, UserAchievement.achievement_id == Achievement.id
        ).where(UserAchievement.user_id == current_user.id)
    )
    achievements = earned.scalars().all()

    now_str = datetime.now(timezone.utc).strftime("%Y-%m-%d %H:%M UTC")
    hours = round(time_spent / 3600, 1)

    # ── Build Notion page content ────────────────────────────────────────────
    page_title = f"PyLearn Progress — {current_user.display_name}"

    children = [
        # Header
        {"object": "block", "type": "heading_2", "heading_2": {
            "rich_text": [{"type": "text", "text": {"content": "📊 Learning Stats"}}]
        }},
        {"object": "block", "type": "bulleted_list_item", "bulleted_list_item": {
            "rich_text": [{"type": "text", "text": {"content": f"🎓 Level: {current_user.level}"}}]
        }},
        {"object": "block", "type": "bulleted_list_item", "bulleted_list_item": {
            "rich_text": [{"type": "text", "text": {"content": f"⭐ Total XP: {current_user.xp}"}}]
        }},
        {"object": "block", "type": "bulleted_list_item", "bulleted_list_item": {
            "rich_text": [{"type": "text", "text": {"content": f"📖 Lessons completed: {lessons_done}"}}]
        }},
        {"object": "block", "type": "bulleted_list_item", "bulleted_list_item": {
            "rich_text": [{"type": "text", "text": {"content": f"⚡ Exercises passed: {exercises_done}"}}]
        }},
        {"object": "block", "type": "bulleted_list_item", "bulleted_list_item": {
            "rich_text": [{"type": "text", "text": {"content": f"⏱️ Time invested: {hours} hours"}}]
        }},
        {"object": "block", "type": "divider", "divider": {}},
        # Achievements
        {"object": "block", "type": "heading_2", "heading_2": {
            "rich_text": [{"type": "text", "text": {"content": "🏆 Achievements Earned"}}]
        }},
        *[
            {"object": "block", "type": "bulleted_list_item", "bulleted_list_item": {
                "rich_text": [{"type": "text", "text": {"content": f"{a.icon} {a.title} — {a.description}"}}]
            }}
            for a in achievements
        ],
        {"object": "block", "type": "divider", "divider": {}},
        # Footer
        {"object": "block", "type": "paragraph", "paragraph": {
            "rich_text": [{"type": "text", "text": {"content": f"Last synced: {now_str}"}, "annotations": {"color": "gray"}}]
        }},
    ]

    # ── Upsert: find existing page or create new ─────────────────────────────
    try:
        existing = notion.databases.query(
            database_id=settings.notion_database_id,
            filter={"property": "title", "title": {"equals": page_title}},
        )
        pages = existing.get("results", [])

        if pages:
            page_id = pages[0]["id"]
            notion.pages.update(
                page_id=page_id,
                properties={"title": {"title": [{"type": "text", "text": {"content": page_title}}]}},
            )
            # Clear and re-append blocks
            existing_blocks = notion.blocks.children.list(block_id=page_id).get("results", [])
            for block in existing_blocks:
                notion.blocks.delete(block_id=block["id"])
            notion.blocks.children.append(block_id=page_id, children=children)
            page_url = pages[0]["url"]
        else:
            page = notion.pages.create(
                parent={"database_id": settings.notion_database_id},
                properties={"title": {"title": [{"type": "text", "text": {"content": page_title}}]}},
                children=children,
            )
            page_url = page["url"]

        return ExportResponse(
            notion_url=page_url,
            message=f"Progress exported! {lessons_done} lessons, {exercises_done} exercises, Level {current_user.level}.",
        )
    except Exception as e:
        logger.error("Notion export failed: %s", e)
        raise HTTPException(status_code=500, detail=f"Notion export failed: {str(e)[:200]}")
