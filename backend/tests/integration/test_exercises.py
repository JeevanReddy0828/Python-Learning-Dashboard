"""API tests for /exercises endpoints — maximum edge cases on submission logic."""

import uuid
import pytest


class TestGetExercise:
    async def test_get_mcq_exercise(self, client, auth_headers, test_exercise_mcq):
        r = await client.get(f"/api/v1/exercises/{test_exercise_mcq.id}", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["type"] == "mcq"
        assert data["status"] == "not_started"

    async def test_get_code_exercise(self, client, auth_headers, test_exercise_code):
        r = await client.get(f"/api/v1/exercises/{test_exercise_code.id}", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["type"] == "fill_blank"

    async def test_get_exercise_not_found(self, client, auth_headers):
        r = await client.get(f"/api/v1/exercises/{uuid.uuid4()}", headers=auth_headers)
        assert r.status_code == 404

    async def test_get_exercise_invalid_uuid(self, client, auth_headers):
        r = await client.get("/api/v1/exercises/bad-uuid", headers=auth_headers)
        assert r.status_code == 422

    async def test_get_exercise_unauthenticated(self, client, test_exercise_mcq):
        r = await client.get(f"/api/v1/exercises/{test_exercise_mcq.id}")
        assert r.status_code in (401, 403)

    async def test_exercise_options_included_for_mcq(self, client, auth_headers, test_exercise_mcq):
        r = await client.get(f"/api/v1/exercises/{test_exercise_mcq.id}", headers=auth_headers)
        assert r.json()["options"] is not None
        assert len(r.json()["options"]) == 3

    async def test_exercise_has_hints(self, client, auth_headers, test_exercise_code):
        r = await client.get(f"/api/v1/exercises/{test_exercise_code.id}", headers=auth_headers)
        assert len(r.json()["hints"]) == 3


class TestGetHint:
    async def test_hint_index_0(self, client, auth_headers, test_exercise_code):
        r = await client.get(
            f"/api/v1/exercises/{test_exercise_code.id}/hint",
            headers=auth_headers,
            params={"hint_index": 0},
        )
        assert r.status_code == 200
        assert r.json()["hint"] == "Use print()"
        assert r.json()["hint_index"] == 0

    async def test_hint_index_1(self, client, auth_headers, test_exercise_code):
        r = await client.get(
            f"/api/v1/exercises/{test_exercise_code.id}/hint",
            headers=auth_headers,
            params={"hint_index": 1},
        )
        assert r.json()["hint"] == "print('hello')"

    async def test_hint_index_beyond_range_returns_graceful_message(self, client, auth_headers, test_exercise_code):
        r = await client.get(
            f"/api/v1/exercises/{test_exercise_code.id}/hint",
            headers=auth_headers,
            params={"hint_index": 99},
        )
        assert r.status_code == 200
        assert "no more hints" in r.json()["hint"].lower()

    async def test_hint_negative_index_returns_422(self, client, auth_headers, test_exercise_code):
        r = await client.get(
            f"/api/v1/exercises/{test_exercise_code.id}/hint",
            headers=auth_headers,
            params={"hint_index": -1},
        )
        assert r.status_code == 422

    async def test_hint_for_nonexistent_exercise(self, client, auth_headers):
        r = await client.get(
            f"/api/v1/exercises/{uuid.uuid4()}/hint",
            headers=auth_headers,
            params={"hint_index": 0},
        )
        assert r.status_code == 404


class TestSubmitMCQ:
    async def test_correct_answer_passes(self, client, auth_headers, test_exercise_mcq):
        r = await client.post(
            f"/api/v1/exercises/{test_exercise_mcq.id}/submit",
            headers=auth_headers,
            json={"answer": "correct"},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["passed"] is True
        assert data["xp_gained"] == test_exercise_mcq.xp_reward

    async def test_wrong_answer_fails(self, client, auth_headers, test_exercise_mcq):
        r = await client.post(
            f"/api/v1/exercises/{test_exercise_mcq.id}/submit",
            headers=auth_headers,
            json={"answer": "wrong1"},
        )
        assert r.json()["passed"] is False
        assert r.json()["xp_gained"] == 0

    async def test_empty_answer_fails(self, client, auth_headers, test_exercise_mcq):
        r = await client.post(
            f"/api/v1/exercises/{test_exercise_mcq.id}/submit",
            headers=auth_headers,
            json={"answer": ""},
        )
        assert r.json()["passed"] is False

    async def test_null_answer_fails(self, client, auth_headers, test_exercise_mcq):
        r = await client.post(
            f"/api/v1/exercises/{test_exercise_mcq.id}/submit",
            headers=auth_headers,
            json={"answer": None},
        )
        assert r.json()["passed"] is False

    async def test_xp_awarded_only_on_first_pass(self, client, auth_headers, test_exercise_mcq):
        payload = {"answer": "correct"}
        r1 = await client.post(
            f"/api/v1/exercises/{test_exercise_mcq.id}/submit",
            headers=auth_headers, json=payload,
        )
        r2 = await client.post(
            f"/api/v1/exercises/{test_exercise_mcq.id}/submit",
            headers=auth_headers, json=payload,
        )
        assert r1.json()["xp_gained"] == test_exercise_mcq.xp_reward
        assert r2.json()["xp_gained"] == 0  # already passed — no double XP

    async def test_response_has_all_fields(self, client, auth_headers, test_exercise_mcq):
        r = await client.post(
            f"/api/v1/exercises/{test_exercise_mcq.id}/submit",
            headers=auth_headers,
            json={"answer": "correct"},
        )
        data = r.json()
        for field in ("passed", "feedback", "xp_gained", "new_achievements", "level_up"):
            assert field in data

    async def test_unauthenticated_submit_returns_403(self, client, test_exercise_mcq):
        r = await client.post(
            f"/api/v1/exercises/{test_exercise_mcq.id}/submit",
            json={"answer": "correct"},
        )
        assert r.status_code in (401, 403)

    async def test_nonexistent_exercise_returns_404(self, client, auth_headers):
        r = await client.post(
            f"/api/v1/exercises/{uuid.uuid4()}/submit",
            headers=auth_headers,
            json={"answer": "correct"},
        )
        assert r.status_code == 404


class TestSubmitCode:
    async def test_correct_code_passes(self, client, auth_headers, test_exercise_code):
        r = await client.post(
            f"/api/v1/exercises/{test_exercise_code.id}/submit",
            headers=auth_headers,
            json={"code": "print('hello')"},
        )
        assert r.status_code == 200
        assert r.json()["passed"] is True
        assert r.json()["xp_gained"] == test_exercise_code.xp_reward

    async def test_wrong_output_fails(self, client, auth_headers, test_exercise_code):
        r = await client.post(
            f"/api/v1/exercises/{test_exercise_code.id}/submit",
            headers=auth_headers,
            json={"code": "print('wrong output')"},
        )
        assert r.json()["passed"] is False
        assert r.json()["xp_gained"] == 0

    async def test_syntax_error_fails(self, client, auth_headers, test_exercise_code):
        r = await client.post(
            f"/api/v1/exercises/{test_exercise_code.id}/submit",
            headers=auth_headers,
            json={"code": "def broken("},
        )
        data = r.json()
        assert data["passed"] is False
        assert data["stderr"] is not None

    async def test_runtime_error_fails(self, client, auth_headers, test_exercise_code):
        r = await client.post(
            f"/api/v1/exercises/{test_exercise_code.id}/submit",
            headers=auth_headers,
            json={"code": "print(1/0)"},
        )
        assert r.json()["passed"] is False

    async def test_infinite_loop_fails_with_timeout_message(self, client, auth_headers, test_exercise_code):
        r = await client.post(
            f"/api/v1/exercises/{test_exercise_code.id}/submit",
            headers=auth_headers,
            json={"code": "while True: pass"},
        )
        data = r.json()
        assert data["passed"] is False
        assert "too long" in data["feedback"].lower()

    async def test_empty_code_fails(self, client, auth_headers, test_exercise_code):
        r = await client.post(
            f"/api/v1/exercises/{test_exercise_code.id}/submit",
            headers=auth_headers,
            json={"code": ""},
        )
        assert r.json()["passed"] is False

    async def test_stdout_returned_on_success(self, client, auth_headers, test_exercise_code):
        r = await client.post(
            f"/api/v1/exercises/{test_exercise_code.id}/submit",
            headers=auth_headers,
            json={"code": "print('hello')"},
        )
        assert r.json()["stdout"] == "hello"

    async def test_stderr_returned_on_error(self, client, auth_headers, test_exercise_code):
        r = await client.post(
            f"/api/v1/exercises/{test_exercise_code.id}/submit",
            headers=auth_headers,
            json={"code": "print(undefined)"},
        )
        assert r.json()["stderr"] is not None
        assert "NameError" in r.json()["stderr"]

    async def test_xp_not_doubled_on_resubmit(self, client, auth_headers, test_exercise_code):
        payload = {"code": "print('hello')"}
        r1 = await client.post(
            f"/api/v1/exercises/{test_exercise_code.id}/submit",
            headers=auth_headers, json=payload,
        )
        r2 = await client.post(
            f"/api/v1/exercises/{test_exercise_code.id}/submit",
            headers=auth_headers, json=payload,
        )
        assert r1.json()["xp_gained"] > 0
        assert r2.json()["xp_gained"] == 0
