import uuid
from datetime import datetime, timezone
from typing import Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.database import get_db
from app.deps import get_current_user
from app.models.memory import MemoryVaultEntry, ChatSession, ChatMessage
from app.models.user import User

router = APIRouter()


# ── Schemas ───────────────────────────────────────────────────────────────────

class MemoryCreate(BaseModel):
    title: str
    content: str
    memory_type: str = "note"
    tags: list[str] = []
    lesson_slug: Optional[str] = None


class MemoryRead(BaseModel):
    id: uuid.UUID
    title: str
    content: str
    memory_type: str
    tags: list[str]
    lesson_slug: Optional[str]
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class MemoryUpdate(BaseModel):
    title: Optional[str] = None
    content: Optional[str] = None
    memory_type: Optional[str] = None
    tags: Optional[list[str]] = None


class MessageRead(BaseModel):
    id: uuid.UUID
    role: str
    content: str
    created_at: datetime

    model_config = {"from_attributes": True}


class SessionRead(BaseModel):
    id: uuid.UUID
    title: str
    lesson_slug: Optional[str]
    created_at: datetime
    last_message_at: datetime
    message_count: int = 0

    model_config = {"from_attributes": True}


class SessionDetail(SessionRead):
    messages: list[MessageRead]


class SessionCreate(BaseModel):
    title: str = "New conversation"
    lesson_slug: Optional[str] = None


class MessageCreate(BaseModel):
    session_id: uuid.UUID
    role: str
    content: str


# ── Memory Vault endpoints ────────────────────────────────────────────────────

@router.get("/vault", response_model=list[MemoryRead])
async def list_memories(
    memory_type: Optional[str] = None,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    q = select(MemoryVaultEntry).where(MemoryVaultEntry.user_id == current_user.id)
    if memory_type:
        q = q.where(MemoryVaultEntry.memory_type == memory_type)
    q = q.order_by(MemoryVaultEntry.updated_at.desc())
    result = await db.execute(q)
    return result.scalars().all()


@router.post("/vault", response_model=MemoryRead, status_code=201)
async def create_memory(
    payload: MemoryCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    entry = MemoryVaultEntry(
        id=uuid.uuid4(),
        user_id=current_user.id,
        **payload.model_dump(),
    )
    db.add(entry)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.patch("/vault/{entry_id}", response_model=MemoryRead)
async def update_memory(
    entry_id: uuid.UUID,
    payload: MemoryUpdate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    entry = await db.scalar(
        select(MemoryVaultEntry).where(
            MemoryVaultEntry.id == entry_id,
            MemoryVaultEntry.user_id == current_user.id,
        )
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Memory not found")
    for k, v in payload.model_dump(exclude_none=True).items():
        setattr(entry, k, v)
    entry.updated_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(entry)
    return entry


@router.delete("/vault/{entry_id}", status_code=204)
async def delete_memory(
    entry_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    entry = await db.scalar(
        select(MemoryVaultEntry).where(
            MemoryVaultEntry.id == entry_id,
            MemoryVaultEntry.user_id == current_user.id,
        )
    )
    if not entry:
        raise HTTPException(status_code=404, detail="Memory not found")
    await db.delete(entry)
    await db.commit()


# ── Chat Session History endpoints ────────────────────────────────────────────

@router.get("/sessions", response_model=list[SessionRead])
async def list_sessions(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(ChatSession)
        .where(ChatSession.user_id == current_user.id)
        .order_by(ChatSession.last_message_at.desc())
        .limit(50)
    )
    sessions = result.scalars().all()
    out = []
    for s in sessions:
        count_result = await db.execute(
            select(ChatMessage).where(ChatMessage.session_id == s.id)
        )
        count = len(count_result.scalars().all())
        out.append(SessionRead(
            id=s.id, title=s.title, lesson_slug=s.lesson_slug,
            created_at=s.created_at, last_message_at=s.last_message_at,
            message_count=count,
        ))
    return out


@router.post("/sessions", response_model=SessionRead, status_code=201)
async def create_session(
    payload: SessionCreate,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = ChatSession(
        id=uuid.uuid4(),
        user_id=current_user.id,
        title=payload.title,
        lesson_slug=payload.lesson_slug,
    )
    db.add(session)
    await db.commit()
    await db.refresh(session)
    return SessionRead(
        id=session.id, title=session.title, lesson_slug=session.lesson_slug,
        created_at=session.created_at, last_message_at=session.last_message_at,
        message_count=0,
    )


@router.get("/sessions/{session_id}", response_model=SessionDetail)
async def get_session(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await db.scalar(
        select(ChatSession)
        .where(ChatSession.id == session_id, ChatSession.user_id == current_user.id)
        .options(selectinload(ChatSession.messages))
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    return SessionDetail(
        id=session.id, title=session.title, lesson_slug=session.lesson_slug,
        created_at=session.created_at, last_message_at=session.last_message_at,
        message_count=len(session.messages),
        messages=[MessageRead.model_validate(m) for m in session.messages],
    )


@router.post("/sessions/{session_id}/messages", response_model=MessageRead, status_code=201)
async def add_message(
    session_id: uuid.UUID,
    role: str,
    content: str,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await db.scalar(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id,
        )
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")

    msg = ChatMessage(id=uuid.uuid4(), session_id=session_id, role=role, content=content)
    session.last_message_at = datetime.now(timezone.utc)
    db.add(msg)
    await db.commit()
    await db.refresh(msg)
    return msg


@router.delete("/sessions/{session_id}", status_code=204)
async def delete_session(
    session_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    session = await db.scalar(
        select(ChatSession).where(
            ChatSession.id == session_id,
            ChatSession.user_id == current_user.id,
        )
    )
    if not session:
        raise HTTPException(status_code=404, detail="Session not found")
    await db.delete(session)
    await db.commit()
