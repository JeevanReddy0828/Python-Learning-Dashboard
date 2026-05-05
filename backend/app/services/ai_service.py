import asyncio
import json
from typing import AsyncGenerator
from openai import AsyncOpenAI

from app.config import settings
from app.schemas.ai import ReviewResponse, ExplainResponse, LineExplanation


def _make_client() -> AsyncOpenAI:
    """Build an AsyncOpenAI-compatible client pointed at the configured provider."""
    return AsyncOpenAI(
        api_key=settings.ai_api_key,
        base_url=settings.ai_base_url,   # None → uses OpenAI default
    )


def _model() -> str:
    return settings.ai_model


def _supports_json_mode() -> bool:
    return settings.ai_supports_json_mode


def _extra_body() -> dict | None:
    """NVIDIA Gemma-4 supports extended thinking — pass it through when available."""
    if settings.ai_provider == "nvidia" and "gemma" in settings.ai_model.lower():
        return {"chat_template_kwargs": {"enable_thinking": True}}
    return None


async def get_hint(code: str, exercise_title: str, hint_level: int) -> str:
    specificity = ["very general", "more specific", "very specific (almost a spoiler)"][hint_level - 1]
    client = _make_client()
    response = await client.chat.completions.create(
        model=_model(),
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a patient, encouraging Python tutor helping someone with ADHD. "
                    "Give a SINGLE, SHORT hint (max 2 sentences) that nudges them in the right direction. "
                    "DO NOT give the answer. Use simple, friendly language. "
                    f"This hint should be {specificity}."
                ),
            },
            {
                "role": "user",
                "content": f"Exercise: {exercise_title}\n\nMy code so far:\n```python\n{code}\n```\n\nHint level {hint_level}/3.",
            },
        ],
        max_tokens=150,
        temperature=0.7,
        extra_body=_extra_body(),
    )
    return (response.choices[0].message.content or "").strip()


async def review_code(code: str, exercise_title: str = "") -> ReviewResponse:
    context = f" for the exercise \"{exercise_title}\"" if exercise_title else ""
    client = _make_client()

    system = (
        "You are a friendly Python code reviewer for beginners. "
        "Analyze the code and return ONLY a JSON object with these exact keys: "
        "score (0-100 integer), feedback (list of 2-4 short strings, positive first), "
        "suggestions (list of 1-3 concrete improvements), strengths (list of 1-2 things done well). "
        "Keep text short, warm, encouraging. No jargon. Return valid JSON only."
    )

    kwargs: dict = dict(
        model=_model(),
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": f"Review this Python code{context}:\n```python\n{code}\n```"},
        ],
        max_tokens=500,
        temperature=0.5,
        extra_body=_extra_body(),
    )
    if _supports_json_mode():
        kwargs["response_format"] = {"type": "json_object"}

    response = await client.chat.completions.create(**kwargs)
    raw = response.choices[0].message.content

    # Extract JSON even if the model wraps it in markdown
    match = __import__("re").search(r"\{[\s\S]*\}", raw)
    data = json.loads(match.group(0)) if match else {}

    return ReviewResponse(
        score=int(data.get("score", 70)),
        feedback=data.get("feedback", []),
        suggestions=data.get("suggestions", []),
        strengths=data.get("strengths", []),
    )


async def explain_code(code: str) -> ExplainResponse:
    client = _make_client()

    system = (
        "You are a Python teacher explaining code to a complete beginner with ADHD. "
        "For each non-empty line of code, provide a plain-English explanation in 1 short sentence. "
        "Use simple words. concept_tag can be: variable, function, loop, condition, "
        "input/output, import, class, operator, string, list, dictionary, or null. "
        "Return ONLY a JSON array: "
        '[{"line_no": int, "code": str, "explanation": str, "concept_tag": str|null}]. '
        "Skip blank lines. Return valid JSON only."
    )

    kwargs: dict = dict(
        model=_model(),
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": f"Explain this code line by line:\n```python\n{code}\n```"},
        ],
        max_tokens=1000,
        temperature=0.3,
        extra_body=_extra_body(),
    )
    if _supports_json_mode():
        kwargs["response_format"] = {"type": "json_object"}

    response = await client.chat.completions.create(**kwargs)
    raw = response.choices[0].message.content

    # Handle both bare array and wrapped {"lines": [...]}
    import re
    arr_match = re.search(r"\[[\s\S]*\]", raw)
    obj_match = re.search(r"\{[\s\S]*\}", raw)
    if arr_match:
        lines_data = json.loads(arr_match.group(0))
    elif obj_match:
        data = json.loads(obj_match.group(0))
        lines_data = data if isinstance(data, list) else data.get("lines", [])
    else:
        lines_data = []

    lines = [LineExplanation(**item) for item in lines_data]
    return ExplainResponse(lines=lines)


_DEV_MODE_PROMPTS: dict[str, str] = {
    "feature-dev": (
        "You are a senior software engineer responsible for developing production-ready features. "
        "Before writing code: analyze requirements, identify edge cases, define the architecture, formulate a plan. "
        "Your response MUST include these sections:\n"
        "1. Architecture Summary\n2. Folder Structure\n3. Data Flow\n"
        "4. Complete Implementation\n5. Edge Case Handling\n6. Error Management\n7. Performance Evaluation"
    ),
    "full-app": (
        "You are an experienced full-stack engineer building a complete production-ready application. "
        "First design the system architecture, then develop the minimal but scalable version. "
        "Your response MUST include:\n"
        "1. Architecture\n2. Folder Structure\n3. Database Schema\n"
        "4. API Endpoints\n5. UI Structure\n6. Complete Code\n"
        "Design it like a true startup MVP — minimal yet scalable."
    ),
    "repo-refactor": (
        "You are a senior engineer who just joined a large, unknown codebase. "
        "First understand the architecture and data flow. Then identify: structural problems, "
        "duplicate code, performance bottlenecks, and maintainability risks. "
        "Your response MUST include:\n"
        "1. Architecture Summary\n2. Problematic Areas\n3. Refactoring Strategies\n4. Improved Architecture and Code"
    ),
    "debugger": (
        "You are a senior engineer investigating bugs in a production environment. "
        "Carefully analyze the code, think step by step, find the root cause, and provide robust solutions. "
        "Consider edge cases and performance implications. "
        "Your response MUST explain: the cause of the problem, the repair plan, and production-ready fixed code."
    ),
    "system-design": (
        "You are an experienced systems architect. Design a scalable system, then develop the minimum production-ready version. "
        "Your response MUST include:\n"
        "1. Architecture\n2. Component Structure\n3. Data Flow\n"
        "4. API Design\n5. Database Schema\n6. Caching Strategy\n7. Implementation Code"
    ),
    "perf-optimize": (
        "You are a performance engineer. Optimize the provided code for speed, memory usage, and scalability. "
        "Identify: bottlenecks, inefficient logic, and unnecessary rendering. "
        "Return a description of each optimization and the fully optimized code."
    ),
    "arch-reconstruct": (
        "You are a staff-level engineer reconstructing code into a clean architecture. "
        "Separate concerns, increase modularity, reduce coupling. The behavior remains unchanged — the structure is improved. "
        "Return: the new folder structure, an explanation of the architectural decisions, and the refactored code."
    ),
}


async def stream_chat(
    message: str,
    context_code: str = "",
    lesson_title: str = "",
) -> AsyncGenerator[str, None]:
    """Yield SSE-formatted chunks: `data: {"t":"..."}\\n\\n`, ending with `data: [DONE]\\n\\n`."""
    client = _make_client()
    system = (
        "You are an ADHD-friendly Python tutor. "
        "Be concise, use bullet points, max 3 sentences per point."
    )
    user_msg = message
    if context_code:
        user_msg += f"\n\nCode:\n```python\n{context_code}\n```"
    if lesson_title:
        system += f" The student is studying: {lesson_title}."

    stream = await client.chat.completions.create(
        model=_model(),
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user_msg},
        ],
        max_tokens=600,
        temperature=0.7,
        stream=True,
        extra_body=_extra_body(),
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield f"data: {json.dumps({'t': delta})}\n\n"
    yield "data: [DONE]\n\n"


async def stream_dev_chat(mode: str, input_text: str, code: str = "") -> AsyncGenerator[str, None]:
    system = _DEV_MODE_PROMPTS.get(mode, _DEV_MODE_PROMPTS["feature-dev"])
    client = _make_client()
    user_msg = input_text
    if code:
        user_msg += f"\n\n```\n{code}\n```"
    stream = await client.chat.completions.create(
        model=_model(),
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user_msg},
        ],
        max_tokens=2000,
        temperature=0.5,
        stream=True,
        extra_body=_extra_body(),
    )
    async for chunk in stream:
        delta = chunk.choices[0].delta.content
        if delta:
            yield f"data: {json.dumps({'t': delta})}\n\n"
    yield "data: [DONE]\n\n"


async def dev_mode_chat(mode: str, input_text: str, code: str = "") -> str:
    system = _DEV_MODE_PROMPTS.get(mode, _DEV_MODE_PROMPTS["feature-dev"])
    client = _make_client()
    user_msg = input_text
    if code:
        user_msg += f"\n\n```\n{code}\n```"
    response = await client.chat.completions.create(
        model=_model(),
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user_msg},
        ],
        max_tokens=2000,
        temperature=0.5,
        extra_body=_extra_body(),
    )
    return (response.choices[0].message.content or "").strip()


async def chat(
    message: str,
    context_code: str = "",
    lesson_title: str = "",
    user_id: str = "anonymous",
) -> str:
    client = _make_client()
    system = "You are an ADHD-friendly Python tutor. Be concise, use bullet points, max 3 sentences per point."
    if lesson_title:
        system += f" The student is studying: {lesson_title}."
    user_msg = message
    if context_code:
        user_msg += f"\n\nCode:\n```python\n{context_code}\n```"
    response = await client.chat.completions.create(
        model=_model(),
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user_msg},
        ],
        max_tokens=500,
        temperature=0.7,
        # No extra_body here — extended thinking is too slow for real-time chat
    )
    return (response.choices[0].message.content or "").strip()
