import asyncio
import os
import tempfile
import time
from dataclasses import dataclass

from app.config import settings


@dataclass
class ExecutionResult:
    stdout: str
    stderr: str
    exit_code: int
    execution_time: float
    timed_out: bool = False


async def run_python_code(code: str, stdin: str = "") -> ExecutionResult:
    with tempfile.NamedTemporaryFile(suffix=".py", delete=False, mode="w", encoding="utf-8") as f:
        f.write(code)
        tmp_path = f.name

    start = time.monotonic()
    try:
        proc = await asyncio.create_subprocess_exec(
            "python3", tmp_path,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE,
            stdin=asyncio.subprocess.PIPE if stdin else asyncio.subprocess.DEVNULL,
            env={
                "PATH": os.environ.get("PATH", ""),
                "PYTHONPATH": "",
                "PYTHONDONTWRITEBYTECODE": "1",
            },
        )
        try:
            stdout_bytes, stderr_bytes = await asyncio.wait_for(
                proc.communicate(input=stdin.encode() if stdin else None),
                timeout=settings.code_execution_timeout,
            )
            elapsed = time.monotonic() - start
            return ExecutionResult(
                stdout=stdout_bytes.decode("utf-8", errors="replace").strip(),
                stderr=stderr_bytes.decode("utf-8", errors="replace").strip(),
                exit_code=proc.returncode or 0,
                execution_time=round(elapsed, 3),
            )
        except asyncio.TimeoutError:
            proc.kill()
            return ExecutionResult(
                stdout="",
                stderr=f"Execution timed out after {settings.code_execution_timeout}s",
                exit_code=124,
                execution_time=settings.code_execution_timeout,
                timed_out=True,
            )
    finally:
        try:
            os.unlink(tmp_path)
        except OSError:
            pass


def check_test_cases(stdout: str, test_cases: list[dict]) -> tuple[bool, str]:
    if not test_cases:
        return True, "No test cases — free-form exercise!"

    for tc in test_cases:
        expected = str(tc.get("expected_output", "")).strip()
        if stdout.strip() != expected:
            return False, f"Expected output:\n{expected}\n\nGot:\n{stdout.strip()}"

    return True, "All test cases passed! 🎉"
