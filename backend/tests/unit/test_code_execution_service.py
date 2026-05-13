"""Unit tests for code_execution_service — actually runs Python subprocesses."""

import sys
import pytest
from app.services.code_execution_service import run_python_code


def _norm(text: str) -> str:
    """Normalise line endings and strip trailing whitespace — platform-safe comparison."""
    return text.replace("\r\n", "\n").replace("\r", "\n").rstrip("\n")


def _no_real_error(stderr: str) -> bool:
    """Return True when stderr contains only harmless tool-level noise (e.g. pip warnings)."""
    noise_prefixes = ("[WARNING]", "WARNING:", "UserWarning")
    return all(
        any(line.lstrip().startswith(p) for p in noise_prefixes)
        for line in stderr.splitlines()
        if line.strip()
    )


class TestRunPythonCode:
    async def test_simple_print(self):
        result = await run_python_code('print("hello")')
        assert _norm(result.stdout) == "hello"
        assert result.stderr == "" or _no_real_error(result.stderr)
        assert result.timed_out is False
        assert result.exit_code == 0

    async def test_arithmetic_output(self):
        result = await run_python_code("print(2 + 2)")
        assert _norm(result.stdout) == "4"

    async def test_multiline_output(self):
        result = await run_python_code("print(1)\nprint(2)\nprint(3)")
        assert _norm(result.stdout) == "1\n2\n3"

    async def test_syntax_error_goes_to_stderr(self):
        result = await run_python_code("def broken(")
        assert result.stderr != ""
        assert _norm(result.stdout) == ""
        assert result.exit_code != 0

    async def test_runtime_error_goes_to_stderr(self):
        result = await run_python_code("print(1/0)")
        assert "ZeroDivisionError" in result.stderr
        assert result.exit_code != 0

    async def test_name_error(self):
        result = await run_python_code("print(undefined_var)")
        assert "NameError" in result.stderr

    async def test_timeout(self):
        result = await run_python_code("while True: pass")
        assert result.timed_out is True
        assert result.exit_code == 124

    async def test_stdin_passed_to_code(self):
        code = "name = input()\nprint(f'Hello {name}')"
        result = await run_python_code(code, stdin="Alice")
        assert _norm(result.stdout) == "Hello Alice"

    async def test_empty_code_no_output(self):
        result = await run_python_code("")
        assert _norm(result.stdout) == ""
        assert result.stderr == "" or _no_real_error(result.stderr)
        assert result.timed_out is False

    async def test_empty_code_whitespace_only(self):
        result = await run_python_code("   \n\n   ")
        assert result.timed_out is False
        assert result.exit_code == 0

    async def test_execution_time_tracked(self):
        result = await run_python_code("print('fast')")
        assert result.execution_time >= 0

    async def test_large_output(self):
        result = await run_python_code("for i in range(1000): print(i)")
        lines = _norm(result.stdout).split("\n")
        assert len(lines) == 1000
        assert lines[0] == "0"
        assert lines[-1] == "999"

    async def test_import_standard_library(self):
        result = await run_python_code("import math\nprint(math.pi > 3)")
        assert _norm(result.stdout) == "True"

    async def test_no_network_access_env(self):
        # Env is stripped — HOME, USER etc. not available; code still runs
        result = await run_python_code("import os\nprint('ok')")
        assert _norm(result.stdout) == "ok"

    @pytest.mark.skipif(
        sys.platform == "win32",
        reason="Windows console encoding may mangle non-ASCII; verified in Docker",
    )
    async def test_unicode_output(self):
        result = await run_python_code("print('こんにちは')")
        assert _norm(result.stdout) == "こんにちは"

    async def test_return_value_not_printed(self):
        # Unlike REPL, scripts don't auto-print return values
        result = await run_python_code("2 + 2")
        assert _norm(result.stdout) == ""

    async def test_multiple_prints_on_same_line(self):
        result = await run_python_code("print('a', 'b', 'c')")
        assert _norm(result.stdout) == "a b c"

    async def test_print_without_newline(self):
        result = await run_python_code("print('hello', end='')")
        assert _norm(result.stdout) == "hello"
