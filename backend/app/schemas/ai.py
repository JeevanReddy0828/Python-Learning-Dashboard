import uuid
from pydantic import BaseModel, Field


class HintRequest(BaseModel):
    code: str
    exercise_id: uuid.UUID
    hint_level: int = Field(default=1, ge=1, le=3)


class HintResponse(BaseModel):
    hint: str
    hint_level: int


class ReviewRequest(BaseModel):
    code: str
    exercise_id: uuid.UUID | None = None
    exercise_title: str | None = None


class ReviewResponse(BaseModel):
    score: int
    feedback: list[str]
    suggestions: list[str]
    strengths: list[str]


class ExplainRequest(BaseModel):
    code: str


class LineExplanation(BaseModel):
    line_no: int
    code: str
    explanation: str
    concept_tag: str | None = None


class ExplainResponse(BaseModel):
    lines: list[LineExplanation]


class ChatRequest(BaseModel):
    message: str
    context_code: str | None = None
    lesson_title: str | None = None


class ChatResponse(BaseModel):
    response: str
