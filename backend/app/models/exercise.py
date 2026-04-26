import uuid
from datetime import datetime
from sqlalchemy import String, Integer, DateTime, Text, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column, relationship
from sqlalchemy.dialects.postgresql import UUID, JSONB

from app.database import Base


class Exercise(Base):
    __tablename__ = "exercises"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    lesson_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("lessons.id", ondelete="CASCADE"), nullable=False, index=True)
    type: Mapped[str] = mapped_column(String(50), nullable=False)  # fill_blank | debug | mcq | mini_project
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    instructions: Mapped[str] = mapped_column(Text, nullable=False)
    starter_code: Mapped[str | None] = mapped_column(Text, nullable=True)
    solution_code: Mapped[str | None] = mapped_column(Text, nullable=True)
    test_cases: Mapped[list | None] = mapped_column(JSONB, nullable=True)
    hints: Mapped[list | None] = mapped_column(JSONB, nullable=True, default=list)
    options: Mapped[list | None] = mapped_column(JSONB, nullable=True)  # for MCQ
    order_index: Mapped[int] = mapped_column(Integer, nullable=False)
    xp_reward: Mapped[int] = mapped_column(Integer, default=20)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    lesson: Mapped["Lesson"] = relationship(back_populates="exercises")
    user_progress: Mapped[list["UserExerciseProgress"]] = relationship(back_populates="exercise", cascade="all, delete-orphan")
    code_submissions: Mapped[list["CodeSubmission"]] = relationship(back_populates="exercise", cascade="all, delete-orphan")
