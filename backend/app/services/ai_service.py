import json
from openai import AsyncOpenAI

from app.config import settings
from app.schemas.ai import ReviewResponse, ExplainResponse, LineExplanation

client = AsyncOpenAI(api_key=settings.openai_api_key)


async def get_hint(code: str, exercise_title: str, hint_level: int) -> str:
    specificity = ["very general", "more specific", "very specific (almost a spoiler)"][hint_level - 1]

    response = await client.chat.completions.create(
        model=settings.openai_model,
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
    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a friendly Python code reviewer for beginners. "
                    "Analyze the code and return ONLY a JSON object with these keys: "
                    "score (0-100 integer), feedback (list of 2-4 short strings, positive first), "
                    "suggestions (list of 1-3 concrete improvements), strengths (list of 1-2 things done well). "
                    "Keep text short, warm, encouraging. No jargon. Return valid JSON only."
                ),
            },
            {
                "role": "user",
                "content": f"Review this Python code{context}:\n```python\n{code}\n```",
            },
        ],
        max_tokens=500,
        temperature=0.5,
        response_format={"type": "json_object"},
    )
    data = json.loads(response.choices[0].message.content)
    return ReviewResponse(
        score=int(data.get("score", 70)),
        feedback=data.get("feedback", []),
        suggestions=data.get("suggestions", []),
        strengths=data.get("strengths", []),
    )


async def explain_code(code: str) -> ExplainResponse:
    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {
                "role": "system",
                "content": (
                    "You are a Python teacher explaining code to a complete beginner with ADHD. "
                    "For each non-empty line of code, provide a plain-English explanation in 1 short sentence. "
                    "Use simple words. concept_tag can be: variable, function, loop, condition, "
                    "input/output, import, class, operator, string, list, dictionary, or null. "
                    "Return ONLY a JSON array: [{\"line_no\": int, \"code\": str, \"explanation\": str, \"concept_tag\": str|null}]. "
                    "Skip blank lines. Return valid JSON only."
                ),
            },
            {
                "role": "user",
                "content": f"Explain this code line by line:\n```python\n{code}\n```",
            },
        ],
        max_tokens=1000,
        temperature=0.3,
        response_format={"type": "json_object"},
    )
    raw = response.choices[0].message.content
    data = json.loads(raw)
    lines_data = data if isinstance(data, list) else data.get("lines", [])
    lines = [LineExplanation(**item) for item in lines_data]
    return ExplainResponse(lines=lines)


async def chat(message: str, context_code: str = "", lesson_title: str = "") -> str:
    system = (
        "You are an ADHD-friendly Python tutor named Pybot. "
        "Be concise, warm, and never overwhelming. "
        "Use bullet points and short sentences. "
        "When showing code, always include a brief explanation."
    )
    if lesson_title:
        system += f" The student's current lesson: {lesson_title}."

    user_msg = message
    if context_code:
        user_msg += f"\n\nMy current code:\n```python\n{context_code}\n```"

    response = await client.chat.completions.create(
        model=settings.openai_model,
        messages=[
            {"role": "system", "content": system},
            {"role": "user", "content": user_msg},
        ],
        max_tokens=500,
        temperature=0.7,
    )
    return response.choices[0].message.content.strip()
