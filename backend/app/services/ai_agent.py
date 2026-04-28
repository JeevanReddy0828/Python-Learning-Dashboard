"""
LangGraph-powered stateful AI tutor.

The graph has three nodes:
  agent  → calls GPT-4o-mini with tools
  tools  → executes tool calls (lesson lookup, hint, progress check)
  END    → returns final message

Conversation history is stored in Redis (TTL 2 hours) so the tutor
remembers what the student asked earlier in the same session.
"""
import json
import logging
from typing import Annotated, TypedDict

from langchain_core.messages import (
    AIMessage,
    BaseMessage,
    HumanMessage,
    SystemMessage,
    ToolMessage,
)
from langchain_core.tools import tool
from langchain_openai import ChatOpenAI
from langgraph.graph import END, StateGraph
from langgraph.graph.message import add_messages

from app.config import settings
from app.services import cache_service

logger = logging.getLogger(__name__)

# ── Tool definitions ──────────────────────────────────────────────────────────

@tool
def get_python_concept(concept: str) -> str:
    """Look up a short, beginner-friendly explanation of a Python concept.
    Use when the student asks 'what is X?' or 'explain X to me'."""
    CONCEPTS = {
        "variable": "A variable is a named box that stores a value. Example: `score = 42`.",
        "loop": "A loop repeats code automatically. `for i in range(5)` runs 5 times.",
        "function": "A function is reusable code. Define with `def`, call by name.",
        "list": "A list holds multiple values in order: `fruits = ['apple', 'banana']`.",
        "dictionary": "A dict stores key-value pairs: `person = {'name': 'Alice', 'age': 17}`.",
        "class": "A class is a blueprint for creating objects with shared attributes and methods.",
        "if": "An if statement runs code only when a condition is True.",
        "try": "try/except catches errors so your program doesn't crash.",
        "import": "import lets you use code from other files or Python's standard library.",
        "return": "return sends a value back from a function to wherever it was called.",
    }
    key = concept.lower().strip()
    for k, v in CONCEPTS.items():
        if k in key:
            return v
    return f"'{concept}' is a Python concept. Break it into smaller parts and try each one!"


@tool
def suggest_next_step(current_struggle: str) -> str:
    """Suggest a concrete, actionable next step when the student is stuck.
    Use when the student says they're confused, stuck, or don't know where to start."""
    steps = [
        f"1. Re-read the problem statement — underline the key words.",
        f"2. Write a comment describing what your code should do, step by step.",
        f"3. Start with a simpler version: can you print the right answer manually first?",
        f"4. Use `print()` to inspect your variables — what value do they actually hold?",
        f"5. Check: did you indent correctly? Python cares about spacing.",
    ]
    return "\n".join(steps)


@tool
def motivate_student(situation: str) -> str:
    """Give a short, genuine ADHD-friendly motivational boost.
    Use when the student seems frustrated, wants to give up, or needs encouragement."""
    messages = [
        "You're literally rewiring your brain right now. That feeling of confusion? It's growth.",
        "Every expert was once a beginner who felt exactly like you do now. Keep going.",
        "ADHD brains are wired for bursts of focus and creativity — that's a superpower in coding.",
        "One tiny win at a time. Getting `print('hi')` to work IS progress. Celebrate it.",
        "You've already solved harder problems than this without even realizing it. Trust yourself.",
    ]
    import hashlib
    idx = int(hashlib.md5(situation.encode()).hexdigest(), 16) % len(messages)
    return messages[idx]


TOOLS = [get_python_concept, suggest_next_step, motivate_student]
TOOL_MAP = {t.name: t for t in TOOLS}

# ── LangGraph state ───────────────────────────────────────────────────────────

class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]


# ── Graph nodes ───────────────────────────────────────────────────────────────

def _make_llm():
    return ChatOpenAI(
        model=settings.openai_model,
        api_key=settings.openai_api_key,
        temperature=0.7,
        max_tokens=600,
    ).bind_tools(TOOLS)


def agent_node(state: AgentState) -> dict:
    llm = _make_llm()
    response = llm.invoke(state["messages"])
    return {"messages": [response]}


def tool_node(state: AgentState) -> dict:
    last = state["messages"][-1]
    results: list[BaseMessage] = []
    for call in last.tool_calls:
        fn = TOOL_MAP.get(call["name"])
        if fn:
            output = fn.invoke(call["args"])
        else:
            output = f"Unknown tool: {call['name']}"
        results.append(ToolMessage(content=str(output), tool_call_id=call["id"]))
    return {"messages": results}


def should_continue(state: AgentState) -> str:
    last = state["messages"][-1]
    if isinstance(last, AIMessage) and last.tool_calls:
        return "tools"
    return END


# ── Build graph ───────────────────────────────────────────────────────────────

def _build_graph() -> StateGraph:
    g = StateGraph(AgentState)
    g.add_node("agent", agent_node)
    g.add_node("tools", tool_node)
    g.set_entry_point("agent")
    g.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    g.add_edge("tools", "agent")
    return g.compile()


_graph = _build_graph()

# ── System prompt ─────────────────────────────────────────────────────────────

_SYSTEM = (
    "You are Pybot, an enthusiastic ADHD-friendly Python tutor. "
    "Rules:\n"
    "• Keep responses SHORT — max 4 bullet points or 3 sentences\n"
    "• Start with the most important thing\n"
    "• Use emoji sparingly (1-2 per message max)\n"
    "• Never dump walls of text\n"
    "• When showing code, show the MINIMUM needed to understand\n"
    "• If the student is stuck, use your tools to help them\n"
    "• Be warm, never condescending\n"
    "You have 3 tools: get_python_concept, suggest_next_step, motivate_student — use them when helpful."
)

# ── History helpers (Redis-backed) ────────────────────────────────────────────

HISTORY_TTL = 7200  # 2 hours


async def _load_history(session_key: str, lesson_title: str) -> list[BaseMessage]:
    cached = await cache_service.cache_get(f"chat:{session_key}")
    if cached:
        msgs = []
        for m in cached:
            role = m["role"]
            content = m["content"]
            if role == "human":
                msgs.append(HumanMessage(content=content))
            elif role == "ai":
                msgs.append(AIMessage(content=content))
        return msgs
    # Fresh session — inject system message
    system_content = _SYSTEM
    if lesson_title:
        system_content += f"\n\nThe student's current lesson: {lesson_title}."
    return [SystemMessage(content=system_content)]


async def _save_history(session_key: str, messages: list[BaseMessage]) -> None:
    serializable = []
    for m in messages:
        if isinstance(m, (HumanMessage, AIMessage)):
            serializable.append({"role": "human" if isinstance(m, HumanMessage) else "ai", "content": m.content})
    await cache_service.cache_set(f"chat:{session_key}", serializable, ttl=HISTORY_TTL)


# ── Public API ────────────────────────────────────────────────────────────────

async def agent_chat(
    user_id: str,
    message: str,
    context_code: str = "",
    lesson_title: str = "",
) -> str:
    """Run one turn of the stateful tutor agent. Returns the assistant's reply."""
    session_key = f"{user_id}:{lesson_title or 'general'}"
    history = await _load_history(session_key, lesson_title)

    user_content = message
    if context_code:
        user_content += f"\n\nMy current code:\n```python\n{context_code}\n```"

    history.append(HumanMessage(content=user_content))

    try:
        result = await _graph.ainvoke({"messages": history})
        reply_msg = result["messages"][-1]
        reply = reply_msg.content if isinstance(reply_msg, AIMessage) else str(reply_msg.content)
        history.append(AIMessage(content=reply))
        await _save_history(session_key, history)
        return reply
    except Exception as e:
        logger.error("LangGraph agent error: %s", e)
        # Fallback to direct LLM call
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=settings.openai_api_key)
        resp = await client.chat.completions.create(
            model=settings.openai_model,
            messages=[{"role": "system", "content": _SYSTEM}, {"role": "user", "content": user_content}],
            max_tokens=500,
        )
        return resp.choices[0].message.content.strip()
