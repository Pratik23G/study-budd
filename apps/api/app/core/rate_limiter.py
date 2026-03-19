"""In-memory per-user rate limiter for AI endpoints."""

import time
import logging
from collections import defaultdict
from dataclasses import dataclass, field

logger = logging.getLogger(__name__)


@dataclass
class _Bucket:
    """Sliding-window token bucket."""
    timestamps: list[float] = field(default_factory=list)

    def prune(self, window_seconds: float) -> None:
        cutoff = time.monotonic() - window_seconds
        self.timestamps = [t for t in self.timestamps if t > cutoff]

    def count(self) -> int:
        return len(self.timestamps)

    def add(self) -> None:
        self.timestamps.append(time.monotonic())


class RateLimiter:
    """Simple in-memory rate limiter keyed by (user_id, action).

    Not shared across processes — fine for single-instance deployments
    (Railway / Render / Fly.io with 1 worker).
    """

    def __init__(self) -> None:
        # key: (user_id, action) -> _Bucket
        self._buckets: dict[tuple[str, str], _Bucket] = defaultdict(_Bucket)

    def is_allowed(
        self,
        user_id: str,
        action: str,
        max_requests: int,
        window_seconds: float,
    ) -> bool:
        """Check if a request is allowed and record it if so.

        Args:
            user_id: The authenticated user's ID.
            action: Action category (e.g. "chat", "generate_flashcards").
            max_requests: Max requests allowed in the window.
            window_seconds: Sliding window size in seconds.

        Returns:
            True if the request is allowed, False if rate-limited.
        """
        key = (user_id, action)
        bucket = self._buckets[key]
        bucket.prune(window_seconds)

        if bucket.count() >= max_requests:
            logger.warning(
                "rate limit hit user_id=%s action=%s count=%d limit=%d window=%ds",
                user_id, action, bucket.count(), max_requests, window_seconds,
            )
            return False

        bucket.add()
        return True


# Singleton instance
rate_limiter = RateLimiter()
