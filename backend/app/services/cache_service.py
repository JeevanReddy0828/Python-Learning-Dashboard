"""
Redis caching + XP leaderboard.
All functions degrade gracefully when Redis is unavailable.

Observability: every swallowed exception is logged via `logger.warning(...)` AND
counted in `_failure_counts`. Callers that need to distinguish "cache miss" from
"Redis down" can call `redis_healthy()` for an active health check, or inspect
`get_failure_counts()` for cumulative degradation metrics.
"""
import json
import logging
from collections import Counter
from typing import Any, Optional

import redis.asyncio as aioredis

from app.config import settings

logger = logging.getLogger(__name__)

_pool: Optional[aioredis.ConnectionPool] = None

# Cumulative count of swallowed Redis failures, keyed by operation name.
# Useful for /api/health endpoint or Prometheus exporters.
_failure_counts: Counter[str] = Counter()


def _record_failure(op: str, e: Exception) -> None:
    """Single chokepoint for swallowed Redis errors — logs + increments counter."""
    _failure_counts[op] += 1
    logger.warning("Redis %s failed (total failures: %d): %s", op, _failure_counts[op], e)


def get_failure_counts() -> dict[str, int]:
    """Return a snapshot of per-operation failure counts (for health/metrics endpoints)."""
    return dict(_failure_counts)


async def redis_healthy() -> bool:
    """Active probe — returns True iff Redis responds to PING within the pool timeout.

    Use this in callers that need to distinguish "no data cached yet" from
    "Redis is down" — e.g. before deciding whether to fall back to a slow path
    or surface a degraded-mode warning to the user.
    """
    try:
        return bool(await _client().ping())
    except Exception as e:
        logger.warning("Redis health check failed: %s", e)
        return False


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
        _record_failure("cache_get", e)
        return None


async def cache_set(key: str, data: Any, ttl: int = 300) -> None:
    try:
        await _client().setex(key, ttl, json.dumps(data, default=str))
    except Exception as e:
        _record_failure("cache_set", e)


async def cache_del(*keys: str) -> None:
    try:
        await _client().delete(*keys)
    except Exception as e:
        _record_failure("cache_del", e)


async def cache_del_pattern(pattern: str) -> None:
    """Delete all keys matching a glob pattern (use sparingly)."""
    try:
        r = _client()
        keys = await r.keys(pattern)
        if keys:
            await r.delete(*keys)
    except Exception as e:
        _record_failure("cache_del_pattern", e)


# ── XP leaderboard (Redis sorted set) ────────────────────────────────────────

LEADERBOARD_KEY = "leaderboard:xp"


async def leaderboard_upsert(user_id: str, display_name: str, xp: int) -> None:
    """Add or update a user's XP in the global leaderboard sorted set."""
    try:
        member = f"{user_id}\x00{display_name}"
        await _client().zadd(LEADERBOARD_KEY, {member: xp})
    except Exception as e:
        _record_failure("leaderboard_upsert", e)


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
        _record_failure("leaderboard_get", e)
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
        _record_failure("leaderboard_rank", e)
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
        _record_failure("presence_heartbeat", e)


async def presence_count(location: str) -> int:
    """How many users are currently studying this location."""
    try:
        now = __import__('time').time()
        r = _client()
        # Remove stale entries (>90s old)
        await r.zremrangebyscore(f"presence:{location}", 0, now - 90)
        return await r.zcard(f"presence:{location}")
    except Exception as e:
        _record_failure("presence_count", e)
        return 0
