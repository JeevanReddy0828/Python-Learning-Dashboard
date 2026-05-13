"""API tests for /lessons endpoints."""

import uuid
import pytest


class TestGetLesson:
    async def test_get_lesson_success(self, client, auth_headers, test_lesson):
        r = await client.get(f"/api/v1/lessons/{test_lesson.id}", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["id"] == str(test_lesson.id)
        assert data["title"] == test_lesson.title

    async def test_get_lesson_contains_exercises(self, client, auth_headers, test_lesson, test_exercise_mcq):
        r = await client.get(f"/api/v1/lessons/{test_lesson.id}", headers=auth_headers)
        exercises = r.json()["exercises"]
        assert len(exercises) >= 1
        assert any(e["id"] == str(test_exercise_mcq.id) for e in exercises)

    async def test_get_lesson_initial_status_not_started(self, client, auth_headers, test_lesson):
        r = await client.get(f"/api/v1/lessons/{test_lesson.id}", headers=auth_headers)
        assert r.json()["status"] == "not_started"

    async def test_get_lesson_not_found_returns_404(self, client, auth_headers):
        r = await client.get(f"/api/v1/lessons/{uuid.uuid4()}", headers=auth_headers)
        assert r.status_code == 404

    async def test_get_lesson_invalid_uuid_returns_422(self, client, auth_headers):
        r = await client.get("/api/v1/lessons/not-a-uuid", headers=auth_headers)
        assert r.status_code == 422

    async def test_get_lesson_unauthenticated_returns_403(self, client, test_lesson):
        r = await client.get(f"/api/v1/lessons/{test_lesson.id}")
        assert r.status_code in (401, 403)

    async def test_next_lesson_is_none_when_last(self, client, auth_headers, test_lesson):
        # test_lesson is the only lesson in the module → no next
        r = await client.get(f"/api/v1/lessons/{test_lesson.id}", headers=auth_headers)
        assert r.json()["next_lesson_id"] is None


class TestStartLesson:
    async def test_start_lesson_returns_started(self, client, auth_headers, test_lesson):
        r = await client.post(f"/api/v1/lessons/{test_lesson.id}/start", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["status"] == "started"

    async def test_start_lesson_sets_status_in_progress(self, client, auth_headers, test_lesson):
        await client.post(f"/api/v1/lessons/{test_lesson.id}/start", headers=auth_headers)
        r = await client.get(f"/api/v1/lessons/{test_lesson.id}", headers=auth_headers)
        assert r.json()["status"] == "in_progress"

    async def test_start_lesson_idempotent(self, client, auth_headers, test_lesson):
        await client.post(f"/api/v1/lessons/{test_lesson.id}/start", headers=auth_headers)
        r = await client.post(f"/api/v1/lessons/{test_lesson.id}/start", headers=auth_headers)
        assert r.status_code == 200  # no error on second call

    async def test_start_nonexistent_lesson_returns_404(self, client, auth_headers):
        r = await client.post(f"/api/v1/lessons/{uuid.uuid4()}/start", headers=auth_headers)
        assert r.status_code == 404

    async def test_start_lesson_unauthenticated_returns_403(self, client, test_lesson):
        r = await client.post(f"/api/v1/lessons/{test_lesson.id}/start")
        assert r.status_code in (401, 403)


class TestCompleteLesson:
    async def test_complete_lesson_awards_xp(self, client, auth_headers, test_lesson):
        r = await client.post(
            f"/api/v1/lessons/{test_lesson.id}/complete",
            headers=auth_headers,
            json={"time_spent_sec": 120},
        )
        assert r.status_code == 200
        data = r.json()
        assert data["xp_gained"] == test_lesson.xp_reward
        assert data["xp_gained"] > 0

    async def test_complete_lesson_twice_gives_no_xp_second_time(self, client, auth_headers, test_lesson):
        payload = {"time_spent_sec": 60}
        await client.post(f"/api/v1/lessons/{test_lesson.id}/complete", headers=auth_headers, json=payload)
        r = await client.post(f"/api/v1/lessons/{test_lesson.id}/complete", headers=auth_headers, json=payload)
        assert r.json()["xp_gained"] == 0

    async def test_complete_lesson_sets_status_completed(self, client, auth_headers, test_lesson):
        await client.post(
            f"/api/v1/lessons/{test_lesson.id}/complete",
            headers=auth_headers,
            json={"time_spent_sec": 90},
        )
        r = await client.get(f"/api/v1/lessons/{test_lesson.id}", headers=auth_headers)
        assert r.json()["status"] == "completed"

    async def test_complete_nonexistent_lesson_returns_404(self, client, auth_headers):
        r = await client.post(
            f"/api/v1/lessons/{uuid.uuid4()}/complete",
            headers=auth_headers,
            json={"time_spent_sec": 60},
        )
        assert r.status_code == 404

    async def test_complete_lesson_unauthenticated_returns_403(self, client, test_lesson):
        r = await client.post(
            f"/api/v1/lessons/{test_lesson.id}/complete",
            json={"time_spent_sec": 60},
        )
        assert r.status_code in (401, 403)

    async def test_complete_lesson_response_has_expected_fields(self, client, auth_headers, test_lesson):
        r = await client.post(
            f"/api/v1/lessons/{test_lesson.id}/complete",
            headers=auth_headers,
            json={"time_spent_sec": 60},
        )
        data = r.json()
        for field in ("xp_gained", "level_up", "new_level", "new_achievements"):
            assert field in data
