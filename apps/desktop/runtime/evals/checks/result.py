"""CheckResult dataclass shared by all check modules."""

from __future__ import annotations

from dataclasses import dataclass


@dataclass
class CheckResult:
    """Result of running a single check."""

    passed: bool
    message: str
    details: dict
