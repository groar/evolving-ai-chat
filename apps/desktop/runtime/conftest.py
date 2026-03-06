"""Pytest configuration for runtime tests.

Isolates tests from production storage:
- RUNTIME_DB_PATH: temp SQLite DB for any test that does not patch storage
- RUNTIME_PATCH_STORAGE_DIR: temp dir for patch artifacts
Ensures stub patches and fake messages never persist to apps/desktop/runtime/storage/
"""

from __future__ import annotations

import os
import tempfile
from pathlib import Path

# Set env vars at import time — before any test module imports runtime.main.
# pytest loads conftest before collecting tests, so this runs before runtime.main
# is imported and uses production paths.
_test_root = Path(tempfile.mkdtemp(prefix="runtime-test-"))
os.environ["RUNTIME_DB_PATH"] = str(_test_root / "runtime.db")
os.environ["RUNTIME_PATCH_STORAGE_DIR"] = str(_test_root / "patches")
