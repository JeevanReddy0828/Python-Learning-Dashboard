"""
PyLearn MCP Server
==================
A Model Context Protocol server that exposes the PyLearn curriculum and
Python execution tools to any MCP-compatible AI client (Claude Code, etc.).

Usage (stdio — works with Claude Code directly):
    python mcp_server.py

Resources exposed:
    pylearn://curriculum/modules          — all 8 modules
    pylearn://curriculum/lessons          — all 16 lessons (full content)
    pylearn://curriculum/lesson/{slug}    — single lesson by slug
    pylearn://curriculum/exercises        — all exercises (no solutions)
    pylearn://curriculum/overview         — quick cheat-sheet of every lesson

Tools exposed:
    search_curriculum(query)              — full-text search across lessons
    run_python(code)                      — execute Python safely (10s timeout)
    get_lesson_for_topic(topic)           — find the best lesson for a topic
    generate_quiz(lesson_slug, count)     — generate MCQ questions from lesson
    explain_error(error_message, code)    — explain a Python error in plain English
"""

import asyncio
import html
import json
import re
import subprocess
import sys
import tempfile
import textwrap
from pathlib import Path

import mcp.types as types
from mcp.server import Server
from mcp.server.stdio import stdio_server

# ── Paths ─────────────────────────────────────────────────────────────────────

DATA_DIR = Path(__file__).parent / "app" / "curriculum" / "data"


def _load(filename: str) -> list[dict]:
    return json.loads((DATA_DIR / filename).read_text(encoding="utf-8"))


def _modules() -> list[dict]:
    return _load("modules.json")


def _lessons() -> list[dict]:
    return _load("lessons.json")


def _exercises() -> list[dict]:
    data = _load("exercises.json")
    # Strip solution_code before exposing
    for e in data:
        e.pop("solution_code", None)
    return data


def _strip_html(html_str: str) -> str:
    """Remove HTML tags for plain-text contexts."""
    text = re.sub(r"<[^>]+>", " ", html_str)
    return html.unescape(re.sub(r"\s+", " ", text)).strip()


# ── Server setup ──────────────────────────────────────────────────────────────

server = Server("pylearn-tutor")


# ── Resources ─────────────────────────────────────────────────────────────────

@server.list_resources()
async def list_resources() -> list[types.Resource]:
    resources = [
        types.Resource(
            uri="pylearn://curriculum/overview",
            name="PyLearn Curriculum Overview",
            description="Quick overview of all 8 modules and 16 lessons — great starting point",
            mimeType="text/plain",
        ),
        types.Resource(
            uri="pylearn://curriculum/modules",
            name="All Modules (JSON)",
            description="The 8 Python learning modules with titles and descriptions",
            mimeType="application/json",
        ),
        types.Resource(
            uri="pylearn://curriculum/lessons",
            name="All Lessons (JSON)",
            description="All 16 lessons with full content, ELI5 summaries, and analogies",
            mimeType="application/json",
        ),
        types.Resource(
            uri="pylearn://curriculum/exercises",
            name="All Exercises (JSON — no solutions)",
            description="17 exercises across 4 types: fill_blank, debug, mcq, mini_project",
            mimeType="application/json",
        ),
    ]
    # Per-lesson resources
    for lesson in _lessons():
        resources.append(
            types.Resource(
                uri=f"pylearn://curriculum/lesson/{lesson['slug']}",
                name=f"Lesson: {lesson['title']}",
                description=lesson["eli5_summary"],
                mimeType="text/plain",
            )
        )
    return resources


@server.read_resource()
async def read_resource(uri: str) -> str:
    # ── Overview ──────────────────────────────────────────────────────────────
    if uri == "pylearn://curriculum/overview":
        modules = _modules()
        lessons = _lessons()
        lessons_by_module: dict[str, list] = {}
        for l in lessons:
            lessons_by_module.setdefault(l["module_slug"], []).append(l)

        lines = ["# PyLearn Python Curriculum\n"]
        for mod in modules:
            lines.append(f"## {mod['icon']} Module {mod['order_index']}: {mod['title']}")
            lines.append(f"   {mod['description']}\n")
            for lesson in lessons_by_module.get(mod["slug"], []):
                lines.append(f"   • [{lesson['slug']}] {lesson['title']}")
                lines.append(f"     💡 {lesson['eli5_summary']}")
                lines.append(f"     🔍 {lesson['analogy']}")
                lines.append(f"     ⏱ {lesson.get('estimated_min', 5)} min  |  ✨ {lesson.get('xp_reward', 100)} XP\n")
        return "\n".join(lines)

    # ── Modules list ──────────────────────────────────────────────────────────
    if uri == "pylearn://curriculum/modules":
        return json.dumps(_modules(), indent=2, ensure_ascii=False)

    # ── All lessons ───────────────────────────────────────────────────────────
    if uri == "pylearn://curriculum/lessons":
        lessons = _lessons()
        # Replace HTML content with plain text for compactness
        compact = []
        for l in lessons:
            c = dict(l)
            c["content_plain"] = _strip_html(c.pop("content_html", ""))[:600] + "…"
            compact.append(c)
        return json.dumps(compact, indent=2, ensure_ascii=False)

    # ── Exercises ─────────────────────────────────────────────────────────────
    if uri == "pylearn://curriculum/exercises":
        return json.dumps(_exercises(), indent=2, ensure_ascii=False)

    # ── Single lesson ─────────────────────────────────────────────────────────
    prefix = "pylearn://curriculum/lesson/"
    if uri.startswith(prefix):
        slug = uri[len(prefix):]
        lesson = next((l for l in _lessons() if l["slug"] == slug), None)
        if not lesson:
            raise ValueError(f"Lesson '{slug}' not found")
        lines = [
            f"# {lesson['title']}",
            f"\n**ELI5:** {lesson['eli5_summary']}",
            f"\n**Analogy:** {lesson['analogy']}",
            f"\n⏱ {lesson.get('estimated_min', 5)} min  |  ✨ {lesson.get('xp_reward', 100)} XP",
            f"\n---\n",
            _strip_html(lesson.get("content_html", "")),
        ]
        return "\n".join(lines)

    raise ValueError(f"Unknown resource URI: {uri}")


# ── Tools ─────────────────────────────────────────────────────────────────────

@server.list_tools()
async def list_tools() -> list[types.Tool]:
    return [
        types.Tool(
            name="search_curriculum",
            description=(
                "Full-text search across all PyLearn lessons and their content. "
                "Returns ranked matches with slugs, titles, and the relevant excerpt."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "query": {"type": "string", "description": "Search terms (e.g. 'for loop range', 'dictionary keys')"},
                    "max_results": {"type": "integer", "default": 5, "description": "Maximum results to return"},
                },
                "required": ["query"],
            },
        ),
        types.Tool(
            name="run_python",
            description=(
                "Execute Python code safely in a subprocess with a 10-second timeout. "
                "Returns stdout, stderr, and exit code. "
                "Use this to verify code snippets, test examples, or check student answers."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "code": {"type": "string", "description": "Python code to execute"},
                    "stdin": {"type": "string", "default": "", "description": "Optional stdin input"},
                },
                "required": ["code"],
            },
        ),
        types.Tool(
            name="get_lesson_for_topic",
            description=(
                "Given a Python topic or concept, return the most relevant PyLearn lesson. "
                "Use when a student asks about a concept and you want to direct them to the right lesson."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "topic": {"type": "string", "description": "Python concept or topic (e.g. 'while loop', 'class inheritance')"},
                },
                "required": ["topic"],
            },
        ),
        types.Tool(
            name="generate_quiz",
            description=(
                "Generate 2-5 multiple-choice quiz questions based on a lesson's content. "
                "Useful for practice or checking understanding."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "lesson_slug": {"type": "string", "description": "Lesson slug (e.g. 'for-loops', 'dictionaries-basics')"},
                    "count": {"type": "integer", "default": 3, "description": "Number of questions (2-5)"},
                },
                "required": ["lesson_slug"],
            },
        ),
        types.Tool(
            name="explain_error",
            description=(
                "Explain a Python error message in plain English, ADHD-friendly style. "
                "Returns what went wrong, why, and how to fix it."
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "error_message": {"type": "string", "description": "The full Python error / traceback"},
                    "code": {"type": "string", "default": "", "description": "The code that caused the error (optional)"},
                },
                "required": ["error_message"],
            },
        ),
    ]


@server.call_tool()
async def call_tool(name: str, arguments: dict) -> list[types.TextContent]:
    if name == "search_curriculum":
        return _tool_search(arguments)
    if name == "run_python":
        return await _tool_run_python(arguments)
    if name == "get_lesson_for_topic":
        return _tool_get_lesson(arguments)
    if name == "generate_quiz":
        return _tool_generate_quiz(arguments)
    if name == "explain_error":
        return _tool_explain_error(arguments)
    raise ValueError(f"Unknown tool: {name}")


# ── Tool implementations ──────────────────────────────────────────────────────

def _tool_search(args: dict) -> list[types.TextContent]:
    query = args["query"].lower()
    max_results = int(args.get("max_results", 5))
    terms = query.split()
    lessons = _lessons()

    scored: list[tuple[int, dict]] = []
    for lesson in lessons:
        searchable = " ".join([
            lesson.get("slug", ""),
            lesson.get("title", ""),
            lesson.get("eli5_summary", ""),
            lesson.get("analogy", ""),
            _strip_html(lesson.get("content_html", "")),
        ]).lower()
        score = sum(searchable.count(t) for t in terms)
        if score > 0:
            scored.append((score, lesson))

    scored.sort(key=lambda x: x[0], reverse=True)
    results = scored[:max_results]

    if not results:
        return [types.TextContent(type="text", text=f"No lessons found matching '{args['query']}'.")]

    lines = [f"## Search results for '{args['query']}'\n"]
    for score, lesson in results:
        plain = _strip_html(lesson.get("content_html", ""))
        # Find the most relevant excerpt
        excerpt = plain
        for term in terms:
            idx = plain.lower().find(term)
            if idx != -1:
                start = max(0, idx - 60)
                excerpt = "…" + plain[start:start + 200] + "…"
                break

        lines.append(f"### [{lesson['slug']}] {lesson['title']}  (score: {score})")
        lines.append(f"💡 {lesson['eli5_summary']}")
        lines.append(f"🔍 {excerpt}\n")

    return [types.TextContent(type="text", text="\n".join(lines))]


async def _tool_run_python(args: dict) -> list[types.TextContent]:
    code = args["code"]
    stdin_data = args.get("stdin", "")

    with tempfile.NamedTemporaryFile(mode="w", suffix=".py", delete=False, encoding="utf-8") as f:
        f.write(code)
        tmp_path = f.name

    try:
        proc = await asyncio.create_subprocess_exec(
            sys.executable, tmp_path,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
        )
        try:
            stdout, stderr = await asyncio.wait_for(
                proc.communicate(input=stdin_data.encode() if stdin_data else b""),
                timeout=10.0,
            )
            exit_code = proc.returncode
            timed_out = False
        except asyncio.TimeoutError:
            proc.kill()
            stdout, stderr = b"", b""
            exit_code = -1
            timed_out = True
    finally:
        Path(tmp_path).unlink(missing_ok=True)

    lines = []
    if timed_out:
        lines.append("⏰ **Timed out** after 10 seconds")
    else:
        lines.append(f"**Exit code:** {exit_code}  {'✅' if exit_code == 0 else '❌'}")

    if stdout:
        lines.append(f"\n**stdout:**\n```\n{stdout.decode(errors='replace')[:2000]}\n```")
    if stderr:
        lines.append(f"\n**stderr:**\n```\n{stderr.decode(errors='replace')[:1000]}\n```")
    if not stdout and not stderr and not timed_out:
        lines.append("\n*(no output)*")

    return [types.TextContent(type="text", text="\n".join(lines))]


def _tool_get_lesson(args: dict) -> list[types.TextContent]:
    topic = args["topic"].lower()
    lessons = _lessons()

    # Keyword → lesson slug mapping for well-known concepts
    KNOWN: dict[str, str] = {
        "variable": "what-is-a-variable",
        "variables": "what-is-a-variable",
        "type": "data-types-basics",
        "types": "data-types-basics",
        "int float bool str": "data-types-basics",
        "string": "string-power",
        "strings": "string-power",
        "input": "user-input",
        "if": "if-else-basics",
        "elif": "if-else-basics",
        "else": "if-else-basics",
        "condition": "if-else-basics",
        "for loop": "for-loops",
        "for": "for-loops",
        "range": "for-loops",
        "while": "while-loops",
        "loop": "for-loops",
        "function": "what-is-a-function",
        "def": "what-is-a-function",
        "return": "what-is-a-function",
        "list": "lists-basics",
        "lists": "lists-basics",
        "append": "lists-basics",
        "dict": "dictionaries-basics",
        "dictionary": "dictionaries-basics",
        "key": "dictionaries-basics",
        "class": "classes-and-objects",
        "object": "classes-and-objects",
        "oop": "classes-and-objects",
        "file": "reading-writing-files",
        "open": "reading-writing-files",
        "write": "reading-writing-files",
        "read": "reading-writing-files",
        "error": "try-except-errors",
        "exception": "try-except-errors",
        "try": "try-except-errors",
        "except": "try-except-errors",
        "api": "what-is-an-api",
        "requests": "what-is-an-api",
        "http": "what-is-an-api",
        "project": "number-guessing-game",
        "game": "number-guessing-game",
        "random": "number-guessing-game",
    }

    # Check known mappings first
    for keyword, slug in KNOWN.items():
        if keyword in topic:
            lesson = next((l for l in lessons if l["slug"] == slug), None)
            if lesson:
                return [types.TextContent(type="text", text=(
                    f"**Best lesson for '{args['topic']}':**\n\n"
                    f"### [{lesson['slug']}] {lesson['title']}\n"
                    f"💡 {lesson['eli5_summary']}\n"
                    f"🔍 {lesson['analogy']}\n\n"
                    f"*Resource URI:* `pylearn://curriculum/lesson/{lesson['slug']}`"
                ))]

    # Fall back to search
    return _tool_search({"query": topic, "max_results": 1})


def _tool_generate_quiz(args: dict) -> list[types.TextContent]:
    slug = args["lesson_slug"]
    count = max(2, min(5, int(args.get("count", 3))))
    lessons = _lessons()
    lesson = next((l for l in lessons if l["slug"] == slug), None)

    if not lesson:
        slugs = [l["slug"] for l in lessons]
        return [types.TextContent(type="text", text=f"Lesson '{slug}' not found. Available slugs:\n" + "\n".join(f"• {s}" for s in slugs))]

    content = _strip_html(lesson.get("content_html", ""))
    title = lesson["title"]
    eli5 = lesson["eli5_summary"]

    # Generate questions from the lesson content using pattern matching
    # These are pre-written per lesson for quality; fall back to generic ones
    LESSON_QUIZZES: dict[str, list[dict]] = {
        "what-is-a-variable": [
            {"q": "What does `score = 100` do in Python?", "options": ["Declares a variable named score with value 100", "Checks if score equals 100", "Prints 100", "Creates a function called score"], "answer": 0},
            {"q": "Which of these is a valid variable name?", "options": ["2name", "my_score", "for", "print(x)"], "answer": 1},
            {"q": "What happens when you reassign a variable?", "options": ["Python crashes", "The old value is lost and replaced", "Both values are stored", "You get a SyntaxError"], "answer": 1},
        ],
        "for-loops": [
            {"q": "What does `for i in range(3)` do?", "options": ["Loops forever", "Loops 3 times (i = 0, 1, 2)", "Loops 3 times (i = 1, 2, 3)", "Prints 3"], "answer": 1},
            {"q": "What keyword stops a loop early?", "options": ["stop", "exit", "break", "return"], "answer": 2},
            {"q": "What does `for fruit in ['apple','banana']:` iterate over?", "options": ["Numbers 0 and 1", "The strings 'apple' and 'banana'", "The letters in 'apple'", "Nothing — syntax error"], "answer": 1},
        ],
        "if-else-basics": [
            {"q": "When does the `else` block run?", "options": ["Always", "When the if condition is True", "When the if condition is False", "Never"], "answer": 2},
            {"q": "What does `elif` mean?", "options": ["else if — another condition to check", "else loop", "end if", "it's not valid Python"], "answer": 0},
            {"q": "What is the output of: `if 5 > 3: print('yes')`?", "options": ["no", "yes", "5 > 3", "nothing"], "answer": 1},
        ],
        "what-is-a-function": [
            {"q": "What keyword defines a function in Python?", "options": ["function", "def", "func", "define"], "answer": 1},
            {"q": "What does `return` do?", "options": ["Prints the result", "Sends a value back to the caller", "Ends the program", "Creates a variable"], "answer": 1},
            {"q": "Why use functions?", "options": ["To make code longer", "To reuse code and avoid repetition (DRY)", "Functions are required in Python", "To make code run faster"], "answer": 1},
        ],
        "lists-basics": [
            {"q": "How do you add an item to a list?", "options": ["list.add(item)", "list.append(item)", "list + item", "list.push(item)"], "answer": 1},
            {"q": "What index does the first item in a list have?", "options": ["1", "0", "-1", "first"], "answer": 1},
            {"q": "What does `len(['a','b','c'])` return?", "options": ["'a','b','c'", "0", "3", "2"], "answer": 2},
        ],
        "dictionaries-basics": [
            {"q": "How do you access a value in a dict?", "options": ["dict[0]", "dict.get_value('key')", "dict['key']", "dict.key"], "answer": 2},
            {"q": "What data structure uses key-value pairs?", "options": ["list", "tuple", "set", "dictionary"], "answer": 3},
            {"q": "What does `.keys()` return?", "options": ["All values", "All key-value pairs", "All keys", "The length"], "answer": 2},
        ],
    }

    questions = LESSON_QUIZZES.get(slug, [])

    # Generic fallback questions based on lesson content
    if not questions:
        questions = [
            {"q": f"What is the main purpose of '{title}'?", "options": [eli5, "To delete files", "To create databases", "To connect to the internet"], "answer": 0},
            {"q": f"According to the lesson, which is correct?", "options": [lesson["eli5_summary"][:80], "Python is a compiled language", "Variables cannot be changed", "Functions always need a return value"], "answer": 0},
        ]

    selected = questions[:count]
    lines = [f"## 📝 Quiz: {title}\n"]
    for i, q in enumerate(selected, 1):
        lines.append(f"**Question {i}:** {q['q']}")
        for j, opt in enumerate(q["options"]):
            letter = "ABCD"[j]
            prefix = "✅" if j == q["answer"] else "  "
            lines.append(f"   {prefix} {letter}) {opt}")
        lines.append("")

    lines.append("*(Correct answers marked with ✅)*")
    return [types.TextContent(type="text", text="\n".join(lines))]


def _tool_explain_error(args: dict) -> list[types.TextContent]:
    error = args["error_message"]
    code = args.get("code", "")

    # Pattern-match common Python errors
    EXPLANATIONS = {
        "NameError": {
            "what": "You used a variable that hasn't been created yet.",
            "why": "Python doesn't know what that name refers to — it was never assigned a value.",
            "fix": "Check spelling, or make sure you define the variable before using it. Example: `name = 'Alice'` before `print(name)`.",
        },
        "TypeError": {
            "what": "You tried to do something with the wrong type of data.",
            "why": "Python won't automatically convert between types (e.g. can't add a string and a number).",
            "fix": "Use `int()`, `str()`, or `float()` to convert types. E.g. `int('5') + 3` instead of `'5' + 3`.",
        },
        "SyntaxError": {
            "what": "Python can't read your code — something is written incorrectly.",
            "why": "A missing colon, bracket, or quote can break the whole file.",
            "fix": "Check the line number in the error. Look for missing `:` after `if`/`for`/`def`, mismatched `()[]{}`, or unclosed `'`/`\"`.",
        },
        "IndentationError": {
            "what": "Your indentation is wrong.",
            "why": "Python uses spaces/tabs to know what code is inside an if/loop/function.",
            "fix": "Use 4 spaces consistently. Don't mix tabs and spaces. Most editors have an 'indent with spaces' setting.",
        },
        "IndexError": {
            "what": "You tried to access a position in a list that doesn't exist.",
            "why": "If a list has 3 items, valid indices are 0, 1, 2 — not 3 or beyond.",
            "fix": "Check `len(my_list)` first. Use `if i < len(my_list):` before accessing `my_list[i]`.",
        },
        "KeyError": {
            "what": "You tried to access a dictionary key that doesn't exist.",
            "why": "Unlike lists, dicts don't have default values for missing keys.",
            "fix": "Use `dict.get('key')` which returns None instead of crashing. Or check `if 'key' in dict:` first.",
        },
        "ValueError": {
            "what": "The right type was given, but the value doesn't make sense for this operation.",
            "why": "Example: `int('hello')` — the type is a string, but 'hello' can't become a number.",
            "fix": "Validate user input before converting: `if text.isdigit(): num = int(text)`.",
        },
        "AttributeError": {
            "what": "You called a method or accessed a property that doesn't exist on this object.",
            "why": "Every type has its own methods — a list doesn't have `.upper()`, a string doesn't have `.append()`.",
            "fix": "Check the type with `type(obj)`. Then check what methods it has with `dir(obj)` or the Python docs.",
        },
        "ZeroDivisionError": {
            "what": "You tried to divide by zero.",
            "why": "Math rule — dividing by zero is undefined.",
            "fix": "Add a check: `if divisor != 0: result = numerator / divisor`.",
        },
        "FileNotFoundError": {
            "what": "Python can't find the file you're trying to open.",
            "why": "The file path is wrong or the file doesn't exist yet.",
            "fix": "Check the path spelling. Use `os.path.exists('file.txt')` to verify. Make sure you're in the right folder.",
        },
    }

    found_key = None
    for key in EXPLANATIONS:
        if key in error:
            found_key = key
            break

    lines = [f"## 🔍 Error Explained\n", f"```\n{error[:500]}\n```\n"]

    if found_key:
        exp = EXPLANATIONS[found_key]
        lines += [
            f"### What happened: `{found_key}`",
            f"**In plain English:** {exp['what']}",
            f"\n**Why this happens:** {exp['why']}",
            f"\n**How to fix it:** {exp['fix']}",
        ]
    else:
        lines.append("This is an uncommon error. Try:")
        lines.append("1. Read the **last line** of the traceback — that's the actual error")
        lines.append("2. Read the **line number** — look at that line in your code")
        lines.append("3. Copy the error message and search it on Stack Overflow or ask the AI tutor")

    if code:
        lines.append(f"\n**Your code:**\n```python\n{code[:400]}\n```")

    lines.append("\n💡 *Every error is just Python telling you what it needs — read it as helpful feedback, not a failure!*")
    return [types.TextContent(type="text", text="\n".join(lines))]


# ── Entry point ───────────────────────────────────────────────────────────────

async def main():
    async with stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options(),
        )


if __name__ == "__main__":
    asyncio.run(main())
