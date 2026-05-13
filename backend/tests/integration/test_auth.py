"""API tests for /auth endpoints."""

import pytest


class TestRegister:
    async def test_register_success(self, client):
        r = await client.post("/api/v1/auth/register", json={
            "email": "new@example.com",
            "password": "Password123!",
            "display_name": "New User",
        })
        assert r.status_code == 201
        data = r.json()
        assert "access_token" in data
        assert data["user"]["email"] == "new@example.com"

    async def test_register_returns_jwt(self, client):
        r = await client.post("/api/v1/auth/register", json={
            "email": "jwt@example.com",
            "password": "Password123!",
            "display_name": "JWT User",
        })
        assert r.status_code == 201
        assert len(r.json()["access_token"]) > 20

    async def test_register_duplicate_email_returns_409(self, client):
        payload = {"email": "dup@example.com", "password": "pass", "display_name": "A"}
        await client.post("/api/v1/auth/register", json=payload)
        r = await client.post("/api/v1/auth/register", json=payload)
        assert r.status_code == 409
        assert "already registered" in r.json()["detail"].lower()

    async def test_register_missing_email_returns_422(self, client):
        r = await client.post("/api/v1/auth/register", json={
            "password": "pass", "display_name": "No Email",
        })
        assert r.status_code == 422

    async def test_register_missing_password_returns_422(self, client):
        r = await client.post("/api/v1/auth/register", json={
            "email": "a@b.com", "display_name": "No Pass",
        })
        assert r.status_code == 422

    async def test_register_missing_display_name_returns_422(self, client):
        r = await client.post("/api/v1/auth/register", json={
            "email": "a@b.com", "password": "pass",
        })
        assert r.status_code == 422

    async def test_register_empty_body_returns_422(self, client):
        r = await client.post("/api/v1/auth/register", json={})
        assert r.status_code == 422

    async def test_register_invalid_email_format_returns_422(self, client):
        r = await client.post("/api/v1/auth/register", json={
            "email": "not-an-email",
            "password": "pass",
            "display_name": "User",
        })
        assert r.status_code == 422


class TestLogin:
    async def test_login_success(self, client, test_user):
        r = await client.post("/api/v1/auth/login", json={
            "email": test_user.email,
            "password": "Password123!",
        })
        assert r.status_code == 200
        assert "access_token" in r.json()

    async def test_login_wrong_password_returns_401(self, client, test_user):
        r = await client.post("/api/v1/auth/login", json={
            "email": test_user.email,
            "password": "WrongPassword",
        })
        assert r.status_code == 401

    async def test_login_nonexistent_email_returns_401(self, client):
        r = await client.post("/api/v1/auth/login", json={
            "email": "ghost@example.com",
            "password": "anypassword",
        })
        assert r.status_code == 401

    async def test_login_empty_password_returns_401(self, client, test_user):
        r = await client.post("/api/v1/auth/login", json={
            "email": test_user.email,
            "password": "",
        })
        assert r.status_code == 401

    async def test_login_missing_fields_returns_422(self, client):
        r = await client.post("/api/v1/auth/login", json={"email": "a@b.com"})
        assert r.status_code == 422

    async def test_login_case_sensitive_email(self, client, test_user):
        r = await client.post("/api/v1/auth/login", json={
            "email": test_user.email.upper(),
            "password": "Password123!",
        })
        # Email lookup is exact match — uppercase should not match
        assert r.status_code == 401


class TestMe:
    async def test_me_authenticated(self, client, auth_headers, test_user):
        r = await client.get("/api/v1/auth/me", headers=auth_headers)
        assert r.status_code == 200
        assert r.json()["email"] == test_user.email

    async def test_me_no_token_returns_403(self, client):
        r = await client.get("/api/v1/auth/me")
        assert r.status_code in (401, 403)

    async def test_me_invalid_token_returns_403(self, client):
        r = await client.get("/api/v1/auth/me", headers={"Authorization": "Bearer garbage"})
        assert r.status_code in (401, 403)

    async def test_me_malformed_header_returns_403(self, client):
        r = await client.get("/api/v1/auth/me", headers={"Authorization": "NotBearer token"})
        assert r.status_code in (401, 403)
