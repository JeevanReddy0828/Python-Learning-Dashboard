"""API tests for /users endpoints."""

import pytest


class TestGetProfile:
    async def test_returns_user_fields(self, client, auth_headers, test_user):
        r = await client.get("/api/v1/users/me", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["email"] == test_user.email
        assert "streak" in data
        assert "recent_achievements" in data

    async def test_unauthenticated_returns_403(self, client):
        r = await client.get("/api/v1/users/me")
        assert r.status_code in (401, 403)

    async def test_streak_defaults_to_zero(self, client, auth_headers):
        r = await client.get("/api/v1/users/me", headers=auth_headers)
        assert r.json()["streak"]["current_streak"] == 0

    async def test_recent_achievements_empty_for_new_user(self, client, auth_headers):
        r = await client.get("/api/v1/users/me", headers=auth_headers)
        assert r.json()["recent_achievements"] == []


class TestUpdateProfile:
    async def test_update_display_name(self, client, auth_headers):
        r = await client.patch("/api/v1/users/me", headers=auth_headers, json={
            "display_name": "Updated Name",
        })
        assert r.status_code == 200
        assert r.json()["display_name"] == "Updated Name"

    async def test_update_avatar_url(self, client, auth_headers):
        r = await client.patch("/api/v1/users/me", headers=auth_headers, json={
            "avatar_url": "https://example.com/avatar.png",
        })
        assert r.status_code == 200
        assert r.json()["avatar_url"] == "https://example.com/avatar.png"

    async def test_partial_update_preserves_other_fields(self, client, auth_headers, test_user):
        r = await client.patch("/api/v1/users/me", headers=auth_headers, json={
            "display_name": "Only Name Changed",
        })
        assert r.status_code == 200
        assert r.json()["email"] == test_user.email

    async def test_empty_update_is_accepted(self, client, auth_headers):
        r = await client.patch("/api/v1/users/me", headers=auth_headers, json={})
        assert r.status_code == 200

    async def test_unauthenticated_update_returns_403(self, client):
        r = await client.patch("/api/v1/users/me", json={"display_name": "Hacker"})
        assert r.status_code in (401, 403)


class TestGetStats:
    async def test_new_user_has_zero_stats(self, client, auth_headers):
        r = await client.get("/api/v1/users/me/stats", headers=auth_headers)
        assert r.status_code == 200
        data = r.json()
        assert data["total_xp"] == 0
        assert data["lessons_completed"] == 0
        assert data["exercises_completed"] == 0

    async def test_stats_contains_required_fields(self, client, auth_headers):
        r = await client.get("/api/v1/users/me/stats", headers=auth_headers)
        data = r.json()
        for field in ("total_xp", "level", "lessons_completed", "exercises_completed", "completion_percent"):
            assert field in data

    async def test_unauthenticated_stats_returns_403(self, client):
        r = await client.get("/api/v1/users/me/stats")
        assert r.status_code in (401, 403)

    async def test_completion_percent_between_0_and_100(self, client, auth_headers):
        r = await client.get("/api/v1/users/me/stats", headers=auth_headers)
        pct = r.json()["completion_percent"]
        assert 0 <= pct <= 100
