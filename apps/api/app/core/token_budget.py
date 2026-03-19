"""Daily global token budget tracker to prevent runaway API costs."""

import time
import logging
from dataclasses import dataclass

logger = logging.getLogger(__name__)

# Seconds in a day
_DAY = 86400


@dataclass
class TokenBudget:
    """Tracks total token usage across all users per calendar day.

    Resets automatically when a new day starts (based on UTC).
    Not persisted across restarts — that's fine for a demo deployment.
    """

    daily_limit: int
    _tokens_used: int = 0
    _day_start: float = 0.0

    def __post_init__(self) -> None:
        self._day_start = self._current_day_start()

    @staticmethod
    def _current_day_start() -> float:
        """Return the Unix timestamp of the start of the current UTC day."""
        now = time.time()
        return now - (now % _DAY)

    def _maybe_reset(self) -> None:
        """Reset counter if a new day has started."""
        current_day = self._current_day_start()
        if current_day > self._day_start:
            logger.info(
                "token budget reset previous_usage=%d limit=%d",
                self._tokens_used, self.daily_limit,
            )
            self._tokens_used = 0
            self._day_start = current_day

    def check(self) -> bool:
        """Return True if there is budget remaining."""
        self._maybe_reset()
        return self._tokens_used < self.daily_limit

    def record(self, tokens: int) -> None:
        """Record token usage."""
        self._maybe_reset()
        self._tokens_used += tokens
        logger.debug(
            "token budget updated used=%d limit=%d remaining=%d",
            self._tokens_used, self.daily_limit, self.remaining,
        )

    @property
    def used(self) -> int:
        self._maybe_reset()
        return self._tokens_used

    @property
    def remaining(self) -> int:
        self._maybe_reset()
        return max(0, self.daily_limit - self._tokens_used)


# Global singleton — 200K tokens/day default (configurable via settings)
token_budget = TokenBudget(daily_limit=200_000)
