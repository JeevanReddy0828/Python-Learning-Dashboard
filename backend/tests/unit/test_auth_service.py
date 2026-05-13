"""Unit tests for auth_service — no DB required."""

import time
import uuid
from unittest.mock import patch

import pytest
from jose import jwt

from app.config import settings
from app.services.auth_service import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token,
)


class TestHashPassword:
    def test_returns_string(self):
        assert isinstance(hash_password("secret"), str)

    def test_different_calls_produce_different_hashes(self):
        # bcrypt uses a random salt — same password → different hash
        assert hash_password("same") != hash_password("same")

    def test_long_password(self):
        pw = "a" * 128
        hashed = hash_password(pw)
        assert verify_password(pw, hashed)

    def test_special_characters(self):
        pw = "P@$$w0rd!#%^&*()"
        assert verify_password(pw, hash_password(pw))

    def test_unicode_password(self):
        pw = "пароль123"
        assert verify_password(pw, hash_password(pw))

    def test_empty_password(self):
        hashed = hash_password("")
        assert verify_password("", hashed)


class TestVerifyPassword:
    def test_correct_password_returns_true(self):
        hashed = hash_password("correct")
        assert verify_password("correct", hashed) is True

    def test_wrong_password_returns_false(self):
        hashed = hash_password("correct")
        assert verify_password("wrong", hashed) is False

    def test_empty_against_nonempty(self):
        hashed = hash_password("password")
        assert verify_password("", hashed) is False

    def test_case_sensitive(self):
        hashed = hash_password("Password")
        assert verify_password("password", hashed) is False

    def test_extra_space(self):
        hashed = hash_password("password")
        assert verify_password("password ", hashed) is False


class TestCreateAccessToken:
    def test_returns_string(self):
        token = create_access_token(uuid.uuid4())
        assert isinstance(token, str)

    def test_token_is_decodable(self):
        uid = uuid.uuid4()
        token = create_access_token(uid)
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        assert payload["sub"] == str(uid)

    def test_token_contains_expiry(self):
        token = create_access_token(uuid.uuid4())
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
        assert "exp" in payload

    def test_different_users_get_different_tokens(self):
        t1 = create_access_token(uuid.uuid4())
        t2 = create_access_token(uuid.uuid4())
        assert t1 != t2


class TestDecodeAccessToken:
    def test_valid_token_returns_uuid(self):
        uid = uuid.uuid4()
        token = create_access_token(uid)
        assert decode_access_token(token) == uid

    def test_wrong_secret_returns_none(self):
        uid = uuid.uuid4()
        token = jwt.encode({"sub": str(uid)}, "wrong_secret", algorithm=settings.algorithm)
        assert decode_access_token(token) is None

    def test_garbage_string_returns_none(self):
        assert decode_access_token("not.a.token") is None

    def test_empty_string_returns_none(self):
        assert decode_access_token("") is None

    def test_missing_sub_returns_none(self):
        token = jwt.encode({"data": "no_sub"}, settings.secret_key, algorithm=settings.algorithm)
        assert decode_access_token(token) is None

    def test_invalid_uuid_in_sub_returns_none(self):
        token = jwt.encode({"sub": "not-a-uuid"}, settings.secret_key, algorithm=settings.algorithm)
        assert decode_access_token(token) is None

    def test_expired_token_returns_none(self):
        from datetime import datetime, timedelta, timezone
        payload = {
            "sub": str(uuid.uuid4()),
            "exp": datetime.now(timezone.utc) - timedelta(seconds=1),
        }
        token = jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)
        assert decode_access_token(token) is None
