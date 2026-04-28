"""
Redis caching + XP leaderboard.
All functions degrade gracefully when Redis is unavailable.
"""
import json
import logging
from typing import Any, Optional

import redis.asyncio as aioredis

from app.config import settings

logger = logging.getLogger(__name__)

_pool: Optional[aioredis.ConnectionPool] = None


def _get_pool() -> aioredis.ConnectionPool:
    global _pool
    if _pool is None:
        _pool = aioredis.ConnectionPool.from_url(
            settings.redis_url,
            encoding="utf-8",
            decode_responses=True,
            max_connections=20,
        )
    return _pool


def _client() -> aioredis.Redis:
    return aioredis.Redis(connection_pool=_get_pool())


# ── Generic cache helpers ─────────────────────────────────────────────────────

async def cache_get(key: str) -> Optional[Any]:
    try:
        val = await _client().get(key)
        return json.loads(val) if val else None
    except Exception as e:
        logger.warning("Redis cache_get failed: %s", e)
        return None


async def cache_set(key: str, data: Any, ttl: int = 300) -> None:
    try:
        await _client().setex(key, ttl, json.dumps(data, default=str))
    except Exception as e:
        logger.warning("Redis cache_set failed: %s", e)


async def cache_del(*keys: str) -> None:
    try:
        await _client().delete(*keys)
    except Exception as e:
        logger.warning("Redis cache_del failed: %s", e)


async def cache_del_pattern(pattern: str) -> None:
    """Delete all keys matching a glob pattern (use sparingly)."""
    try:
        r = _client()
        keys = await r.keys(pattern)
        if keys:
            await r.delete(*keys)
    except Exception as e:
        logger.warning("Redis cache_del_pattern failed: %s", e)


# ── XP leaderboard (Redis sorted set) ────────────────────────────────────────

LEADERBOARD_KEY = "leaderboard:xp"


async def leaderboard_upsert(user_id: str, display_name: str, xp: int) -> None:
    """Add or update a user's XP in the global leaderboard sorted set."""
    try:
        member = f"{user_id}\x00{display_name}"
        await _client().zadd(LEADERBOARD_KEY, {member: xp})
    except Exception as e:
        logger.warning("Redis leaderboard_upsert failed: %s", e)


async def leaderboard_get(top_n: int = 20) -> list[dict]:
    """Return the top N users by XP, with rank, name, and score."""
    try:
        entries = await _client().zrevrange(LEADERBOARD_KEY, 0, top_n - 1, withscores=True)
        result = []
        for i, (member, score) in enumerate(entries):
            parts = member.split("\x00", 1)
            result.append({
                "rank": i + 1,
                "user_id": parts[0],
                "display_name": parts[1] if len(parts) > 1 else "Unknown",
                "xp": int(score),
            })
        return result
    except Exception as e:
        logger.warning("Redis leaderboard_get failed: %s", e)
        return []


async def leaderboard_rank(user_id: str) -> Optional[int]:
    """Return 1-based rank for a user, or None if not on the board."""
    try:
        r = _client()
        keys = await r.keys(f"{user_id}\x00*")
        if not keys:
            return None
        rank = await r.zrevrank(LEADERBOARD_KEY, keys[0])
        return rank + 1 if rank is not None else None
    except Exception as e:
        logger.warning("Redis leaderboard_rank failed: %s", e)
        return None


# ── Study session presence (TTL-based) ───────────────────────────────────────

async def presence_heartbeat(user_id: str, display_name: str, location: str) -> None:
    """Record that a user is actively studying a location (lesson/module slug)."""
    try:
        key = f"presence:{location}"
        member = f"{user_id}\x00{display_name}"
        await _client().setex(f"presence_user:{user_id}", 90, f"{location}\x00{display_name}")
        await _client().zadd(key, {member: __import__('time').time()})
        await _client().expire(key, 90)
    except Exception as e:
        logger.warning("Redis presence_heartbeat failed: %s", e)


async def presence_count(location: str) -> int:
    """How many users are currently studying this location."""
    try:
        now = __import__('time').time()
        r = _client()
        # Remove stale entries (>90s old)
        await r.zremrangebyscore(f"presence:{location}", 0, now - 90)
        return await r.zcard(f"presence:{location}")
    except Exception as e:
        logger.warning("Redis presence_count failed: %s", e)
        return 0
