"""
Filesystem-backed store for patch artifacts.

Artifacts are persisted as JSON files under storage/patches/<patch_id>.json
so they survive runtime restarts and are available to the apply/rollback logic
(T-0060) and the status-polling endpoint.
"""

from __future__ import annotations

import json
import threading
from pathlib import Path

from .patch_agent import PatchArtifact

# Statuses that mean a patch is actively in progress (spec §7: only one allowed)
IN_FLIGHT_STATUSES: frozenset[str] = frozenset({"pending_apply", "applying"})


class PatchStorage:
    """Read/write patch artifact JSON files from the patches directory."""

    def __init__(self, storage_dir: Path | None = None) -> None:
        default_dir = Path(__file__).resolve().parents[1] / "storage" / "patches"
        self._dir = storage_dir or default_dir
        self._dir.mkdir(parents=True, exist_ok=True)
        self._lock = threading.Lock()

    # ------------------------------------------------------------------
    # Write
    # ------------------------------------------------------------------

    def save(self, artifact: PatchArtifact) -> None:
        """Persist (or overwrite) the artifact JSON file."""
        path = self._dir / f"{artifact.id}.json"
        with self._lock:
            path.write_text(
                json.dumps(artifact.to_dict(), indent=2), encoding="utf-8"
            )

    # ------------------------------------------------------------------
    # Read
    # ------------------------------------------------------------------

    def load(self, patch_id: str) -> PatchArtifact | None:
        """Return the artifact for patch_id, or None if not found."""
        path = self._dir / f"{patch_id}.json"
        with self._lock:
            if not path.exists():
                return None
            data = json.loads(path.read_text(encoding="utf-8"))
        return PatchArtifact.from_dict(data)

    # ------------------------------------------------------------------
    # In-flight check
    # ------------------------------------------------------------------

    def has_patch_in_flight(self) -> bool:
        """Return True if any artifact is in pending_apply or applying state."""
        with self._lock:
            for f in self._dir.glob("*.json"):
                try:
                    data = json.loads(f.read_text(encoding="utf-8"))
                    if data.get("status") in IN_FLIGHT_STATUSES:
                        return True
                except (json.JSONDecodeError, OSError):
                    continue
        return False
