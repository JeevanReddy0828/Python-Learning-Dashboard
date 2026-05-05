import logging
import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.deps import get_current_user
from app.models.user import User
from app.models.memory import ChatSession, ChatMessage

logger = logging.getLogger(__name__)
from app.schemas.ai import (
    HintRequest, HintResponse,
    ReviewRequest, ReviewResponse,
    ExplainRequest, ExplainResponse,
    ChatRequest, ChatResponse,
)
from app.services import ai_service
from app.config import settings

router = APIRouter()


def _check_ai_configured():
    if not settings.ai_api_key:
        raise HTTPException(status_code=503, detail="AI features require an API key (OPENAI_API_KEY, NVIDIA_API_KEY, or ZAI_API_KEY)")


@router.post("/hint", response_model=HintResponse)
async def hint(payload: HintRequest, current_user: User = Depends(get_current_user)):
    _check_ai_configured()
    hint_text = await ai_service.get_hint(payload.code, str(payload.exercise_id), payload.hint_level)
    return HintResponse(hint=hint_text, hint_level=payload.hint_level)


@router.post("/review", response_model=ReviewResponse)
async def review(payload: ReviewRequest, current_user: User = Depends(get_current_user)):
    _check_ai_configured()
    return await ai_service.review_code(payload.code, payload.exercise_title or "")


@router.post("/explain", response_model=ExplainResponse)
async def explain(payload: ExplainRequest, current_user: User = Depends(get_current_user)):
    _check_ai_configured()
    return await ai_service.explain_code(payload.code)


@router.post("/chat", response_model=ChatResponse)
async def chat(
    payload: ChatRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    _check_ai_configured()
    response = await ai_service.chat(
        payload.message,
        payload.context_code or "",
        payload.lesson_title or "",
        user_id=str(current_user.id),
    )

    # Persist to session history (fire-and-forget style — don't fail the request if DB write fails)
    try:
        session_title = payload.lesson_title or payload.message[:60] or "AI Chat"
        # Find or create today's session for this context
        session = await db.scalar(
            select(ChatSession).where(
                ChatSession.user_id == current_user.id,
                ChatSession.title == session_title,
            ).order_by(ChatSession.created_at.desc())
        )
        if not session:
            session = ChatSession(
                id=uuid.uuid4(),
                user_id=current_user.id,
                title=session_title,
                lesson_slug=payload.lesson_title or None,
            )
            db.add(session)
            await db.flush()

        db.add(ChatMessage(id=uuid.uuid4(), session_id=session.id, role="user", content=payload.message))
        db.add(ChatMessage(id=uuid.uuid4(), session_id=session.id, role="ai", content=response))
        session.last_message_at = datetime.now(timezone.utc)
        await db.commit()
    except Exception:
        logger.warning("Failed to persist chat history for user %s", current_user.id, exc_info=True)

    return ChatResponse(response=response)


@router.post("/stream-chat")
async def stream_chat(payload: ChatRequest, _: User = Depends(get_current_user)):
    _check_ai_configured()
    return StreamingResponse(
        ai_service.stream_chat(payload.message, payload.context_code or "", payload.lesson_title or ""),
        media_type="text/event-stream",
        headers={"Cache-Control": "no-cache", "X-Accel-Buffering": "no"},
    )

