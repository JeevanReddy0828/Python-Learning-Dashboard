from fastapi import APIRouter, Depends, HTTPException

from app.deps import get_current_user
from app.models.user import User
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
async def chat(payload: ChatRequest, current_user: User = Depends(get_current_user)):
    _check_ai_configured()
    response = await ai_service.chat(
        payload.message,
        payload.context_code or "",
        payload.lesson_title or "",
        user_id=str(current_user.id),
    )
    return ChatResponse(response=response)
