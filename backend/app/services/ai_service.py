import json
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
    """NVIDIA NIM models don't all support response_format=json_object."""
    return settings.ai_provider == "openai"


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
    )
    return response.choices[0].message.content.strip()


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


async def chat(
    message: str,
    context_code: str = "",
    lesson_title: str = "",
    user_id: str = "anonymous",
) -> str:
    """Stateful chat via LangGraph agent (falls back to direct call if agent fails)."""
    try:
        from app.services.ai_agent import agent_chat
        return await agent_chat(
            user_id=user_id,
            message=message,
            context_code=context_code,
            lesson_title=lesson_title,
        )
    except Exception:
        client = _make_client()
        system = (
            "You are an ADHD-friendly Python tutor. "
            "Be concise, use bullet points, max 3 sentences."
        )
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
        )
        return response.choices[0].message.content.strip()
