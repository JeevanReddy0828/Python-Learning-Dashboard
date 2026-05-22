import logging
from datetime import datetime, timedelta, timezone
from uuid import UUID

import bcrypt
from jose import JWTError, jwt

from app.config import settings

logger = logging.getLogger(__name__)


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode(), hashed.encode())


def create_access_token(user_id: UUID) -> str:
    expire = datetime.now(timezone.utc) + timedelta(minutes=settings.access_token_expire_minutes)
    payload = {"sub": str(user_id), "exp": expire}
    return jwt.encode(payload, settings.secret_key, algorithm=settings.algorithm)


def decode_access_token(token: str) -> UUID | None:
    """Decode a JWT bearer token and return the user UUID, or None if invalid.

    Logs the failure mode so operators can distinguish auth attacks (JWTError)
    from corrupt/malformed payloads (ValueError) — both still return None to
    the caller so the surface API behaviour is unchanged.
    """
    try:
        payload = jwt.decode(token, settings.secret_key, algorithms=[settings.algorithm])
    except JWTError as e:
        logger.debug("JWT decode failed (bad signature, expired, or malformed): %s", e)
        return None

    user_id = payload.get("sub")
    if not user_id:
        logger.warning("JWT decoded but missing 'sub' claim")
        return None

    try:
        return UUID(user_id)
    except ValueError as e:
        logger.warning("JWT 'sub' claim is not a valid UUID: %r (%s)", user_id, e)
        return None
