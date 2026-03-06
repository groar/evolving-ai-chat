"""
PatchAgent interface and implementations for M8 agentic code-patch generation.

Layer 1 scope guard is enforced here (system prompt injection).
Layer 2 allowlist validation (validate_scope) is called by the endpoint before persisting.

Integration model:
  PiDevPatchAgent invokes pi (https://pi.dev) as a local subprocess in a temp sandbox.
  pi edits files directly; we compute a unified diff of apps/desktop/src/ before vs after
  and return a PatchArtifact. The real working copy is never touched here — that is T-0060.
"""

from __future__ import annotations

import abc
import difflib
import json
import logging
import os
import re
import shlex
import shutil
import subprocess
import tempfile
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Layer 1 scope guard — system prompt appended on every pi invocation (spec §6)
# ---------------------------------------------------------------------------
SCOPE_GUARD_SYSTEM_PROMPT = """\
You are a UI code assistant for an Electron/React desktop application.
Your working directory is the desktop package root. The React source tree is at src/.

SCOPE — You may ONLY modify files in:
  - src/ (React components, stores, hooks, styles)

You MUST NOT modify:
  - Any file outside src/
  - Any Python file (.py)
  - package.json, package-lock.json, tsconfig.json, vite.config.ts, or any build/config file
  - Any file in runtime/
  - Any file in tickets/, docs/, or tests/

CHANGE SIZE — Make the smallest change that fully addresses the feedback.
Prefer touching 1–2 files at most. Do not add new npm dependencies. Do not create new files. Do not delete files.

DESIGN PHILOSOPHY — This is a warm, calm AI workspace (closer to Notion AI than a dashboard).
Use the existing Tailwind CSS tokens: var(--color-accent) for primary actions (warm orange),
var(--color-panel) for card surfaces, var(--color-ink) for body text, var(--color-muted) for
secondary labels. Do not introduce new colors or override the design system.

OUTPUT — After making your changes, output exactly one plain-English sentence starting with a
past-tense verb that describes what you changed. Example: "Updated the welcome message to feel
warmer and more personal." This sentence will be shown to the user.
"""

# Layer 2 server-side allowlist — loaded from config at runtime (validate_scope)
_DEFAULT_ALLOWLIST_PATTERNS = [r"^apps/desktop/src/"]


def _load_allowlist_patterns() -> list[str]:
    """Load allow_patterns from config file. Falls back to hardcoded list if absent."""
    runtime_dir = Path(__file__).resolve().parent.parent
    config_path = runtime_dir / "config" / "patch-allowlist.json"
    if not config_path.exists():
        logger.warning(
            "patch-allowlist.json not found at %s; using hardcoded allowlist",
            config_path,
        )
        return _DEFAULT_ALLOWLIST_PATTERNS
    try:
        data = json.loads(config_path.read_text(encoding="utf-8"))
        patterns = data.get("allow_patterns") or _DEFAULT_ALLOWLIST_PATTERNS
        if not isinstance(patterns, list):
            return _DEFAULT_ALLOWLIST_PATTERNS
        return [str(p) for p in patterns if isinstance(p, str)]
    except (OSError, json.JSONDecodeError) as exc:
        logger.warning("Failed to load patch-allowlist.json: %s; using fallback", exc)
        return _DEFAULT_ALLOWLIST_PATTERNS


def _compile_allowlist_patterns(patterns: list[str]) -> list[re.Pattern[str]]:
    """Compile regex patterns for scope validation."""
    compiled: list[re.Pattern[str]] = []
    for p in patterns:
        try:
            compiled.append(re.compile(p))
        except re.error:
            logger.warning("Invalid allowlist pattern %r; skipping", p)
    return compiled


def validate_scope(files_changed: list[str]) -> list[str]:
    """Return the subset of paths that violate the allowlist (Layer 2 check)."""
    patterns = _compile_allowlist_patterns(_load_allowlist_patterns())
    if not patterns:
        return list(files_changed)  # No patterns = everything violated
    violations: list[str] = []
    for f in files_changed:
        if not any(pat.match(f) for pat in patterns):
            violations.append(f)
    return violations


# ---------------------------------------------------------------------------
# Area-based file hints (T-0076) — appended to user prompt in _call_pi
# ---------------------------------------------------------------------------

def _redact_cmd_for_log(cmd: list[str]) -> list[str]:
    """Redact --api-key value for safe logging. Returns a copy."""
    out = list(cmd)
    for i, arg in enumerate(out):
        if arg == "--api-key" and i + 1 < len(out):
            out[i + 1] = "***"
            break
    return out


def _area_hint(area: str) -> str:
    """Return a file-location hint based on feedback.area prefix."""
    if not area or not isinstance(area, str):
        return ""
    area = area.strip().lower()
    if area.startswith("ui.chat"):
        return " The relevant files are likely src/App.tsx or src/components/chat/."
    if area.startswith("ui.settings"):
        return " The relevant files are likely src/settingsPanel.tsx."
    if area.startswith("ui."):
        return " The relevant files are likely in src/App.tsx."
    return ""


# ---------------------------------------------------------------------------
# Public helpers
# ---------------------------------------------------------------------------


def _new_patch_id() -> str:
    date_part = datetime.now(timezone.utc).strftime("%Y%m%d")
    uid_part = uuid.uuid4().hex[:8]
    return f"PA-{date_part}-{uid_part}"


def _snapshot_src(src_dir: Path, desktop_dir: Path) -> dict[str, str]:
    """Read all files under src_dir, keyed by repo-relative path (apps/desktop/src/...)."""
    files: dict[str, str] = {}
    if not src_dir.exists():
        return files
    for f in src_dir.rglob("*"):
        if f.is_file():
            repo_rel = "apps/desktop/" + f.relative_to(desktop_dir).as_posix()
            try:
                files[repo_rel] = f.read_text(encoding="utf-8", errors="replace")
            except OSError:
                files[repo_rel] = ""
    return files


def _compute_diff(
    before: dict[str, str], after: dict[str, str]
) -> tuple[list[str], str]:
    """Return (changed_paths, unified_diff_text) from before/after file snapshots."""
    changed: list[str] = []
    parts: list[str] = []
    for path in sorted(set(before) | set(after)):
        old = before.get(path, "")
        new = after.get(path, "")
        if old == new:
            continue
        changed.append(path)
        chunk = difflib.unified_diff(
            old.splitlines(keepends=True),
            new.splitlines(keepends=True),
            fromfile=f"a/{path}",
            tofile=f"b/{path}",
        )
        parts.append("".join(chunk))
    return changed, "\n".join(parts)


# ---------------------------------------------------------------------------
# Domain objects
# ---------------------------------------------------------------------------

@dataclass
class PatchArtifact:
    """Canonical patch artifact (spec §3.2). Stored as JSON under storage/patches/."""

    id: str
    created_at: str
    feedback_id: str
    base_ref: str
    status: str  # pending_apply | applying | applied | apply_failed | scope_blocked | reverted | …
    title: str
    description: str
    files_changed: list[str]
    unified_diff: str
    scope_violations: list[str]
    agent_model: str
    agent_harness: str
    applied_at: str | None = None
    git_commit_sha: str | None = None
    reverted_at: str | None = None
    revert_commit_sha: str | None = None
    failure_reason: str | None = None
    # Raw agent execution log for this patch run (stdout/stderr, tool events, etc.).
    # Persisted separately in the runtime database; kept here for transport only.
    log_text: str | None = None

    def to_dict(self) -> dict[str, Any]:
        return {
            "id": self.id,
            "created_at": self.created_at,
            "feedback_id": self.feedback_id,
            "base_ref": self.base_ref,
            "status": self.status,
            "title": self.title,
            "description": self.description,
            "files_changed": self.files_changed,
            "unified_diff": self.unified_diff,
            "scope_violations": self.scope_violations,
            "agent_model": self.agent_model,
            "agent_harness": self.agent_harness,
            "applied_at": self.applied_at,
            "git_commit_sha": self.git_commit_sha,
            "reverted_at": self.reverted_at,
            "revert_commit_sha": self.revert_commit_sha,
            "failure_reason": self.failure_reason,
            "log_text": self.log_text,
        }

    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> "PatchArtifact":
        return cls(
            id=data["id"],
            created_at=data["created_at"],
            feedback_id=data["feedback_id"],
            base_ref=data["base_ref"],
            status=data["status"],
            title=data["title"],
            description=data["description"],
            files_changed=data.get("files_changed", []),
            unified_diff=data.get("unified_diff", ""),
            scope_violations=data.get("scope_violations", []),
            agent_model=data.get("agent_model", ""),
            agent_harness=data.get("agent_harness", ""),
            applied_at=data.get("applied_at"),
            git_commit_sha=data.get("git_commit_sha"),
            reverted_at=data.get("reverted_at"),
            revert_commit_sha=data.get("revert_commit_sha"),
            failure_reason=data.get("failure_reason"),
            log_text=data.get("log_text"),
        )


# ---------------------------------------------------------------------------
# Exceptions
# ---------------------------------------------------------------------------

class HarnessUnavailableError(Exception):
    """Raised when the agent harness cannot be reached, is not installed, or times out."""


class MalformedPatchError(Exception):
    """Raised when the agent harness produces no changes or an unusable response."""


# ---------------------------------------------------------------------------
# Abstract interface
# ---------------------------------------------------------------------------

class PatchAgent(abc.ABC):
    """Swappable interface for code-patch generation (spec §8)."""

    @abc.abstractmethod
    def generate_patch(
        self, feedback: dict[str, Any], base_ref: str
    ) -> PatchArtifact:
        """Generate a patch artifact from a feedback payload.

        Args:
            feedback: dict with keys id, title, summary, area.
            base_ref: git SHA of the working tree at invocation time.

        Returns:
            PatchArtifact with status 'pending_apply'.
            Scope violations are NOT set here; the caller (endpoint) runs
            validate_scope() after this returns and updates the artifact.

        Raises:
            HarnessUnavailableError: harness unreachable, not installed, or timed out.
            MalformedPatchError: harness produced no changes or unparseable output.
        """


# ---------------------------------------------------------------------------
# Concrete implementation — pi (local subprocess)
# ---------------------------------------------------------------------------

class PiDevPatchAgent(PatchAgent):
    """Code-patch agent backed by pi (https://pi.dev) running as a local subprocess.

    Integration strategy:
      1. Copy apps/desktop/ to a temp sandbox (excluding node_modules, dist, caches).
      2. Run: pi -p "<feedback>" --no-session --append-system-prompt "<scope guard>"
              --tools read,write,edit,grep,find,ls [--provider P] [--api-key K] [--model M]
      3. Snapshot apps/desktop/src/ before and after pi runs.
      4. Compute unified diff; return PatchArtifact with status 'pending_apply'.

    Stub mode is activated when PATCH_AGENT_STUB=true or PATCH_AGENT_API_KEY is absent,
    so the agent works offline for tests without invoking pi.

    Env vars consumed (never stored in artifacts):
      PATCH_AGENT_API_KEY   — API key forwarded to pi via --api-key (e.g. Anthropic key)
      PATCH_AGENT_PROVIDER  — Provider hint for pi (default: anthropic)
      PATCH_AGENT_MODEL     — Model hint for pi (default: pi's configured default)
      PATCH_AGENT_STUB      — Set to 'true' to force stub mode regardless of API key
    """

    def __init__(self, repo_root: Path | None = None) -> None:
        # Four levels up: agent/ -> runtime/ -> desktop/ -> apps/ -> repo root
        self._repo_root = repo_root or Path(__file__).resolve().parents[4]
        self._api_key = os.environ.get("PATCH_AGENT_API_KEY", "")
        self._provider = os.environ.get("PATCH_AGENT_PROVIDER", "anthropic")
        self._model = os.environ.get("PATCH_AGENT_MODEL", "")
        stub_flag = os.environ.get("PATCH_AGENT_STUB", "").lower()
        self._use_stub = stub_flag in ("1", "true", "yes") or not self._api_key

    def generate_patch(
        self, feedback: dict[str, Any], base_ref: str
    ) -> PatchArtifact:
        if self._use_stub:
            return self._generate_stub(feedback, base_ref)
        return self._call_pi(feedback, base_ref)

    # ------------------------------------------------------------------
    # Stub path (offline / test)
    # ------------------------------------------------------------------

    def _generate_stub(
        self, feedback: dict[str, Any], base_ref: str
    ) -> PatchArtifact:
        log_lines = [
            "[stub] PATCH_AGENT_STUB is enabled; no real harness call was made.",
            f"feedback_id={feedback.get('id', '')}",
            f"title={feedback.get('title', '')}",
            f"area={feedback.get('area', '')}",
        ]
        stub_diff = (
            "--- a/apps/desktop/src/App.tsx\n"
            "+++ b/apps/desktop/src/App.tsx\n"
            "@@ -19,4 +19,4 @@\n"
            " import type { RuntimeIssue } from \"./stores/runtimeStore\";\n"
            " \n"
            "-const appName = \"Evolving AI Chat\";\n"
            "+const appName = \"Evolving AI Chat — your personal assistant\";\n"
            " const diagnosticsFlagKey = \"show_runtime_diagnostics\";\n"
        )
        return PatchArtifact(
            id=_new_patch_id(),
            created_at=datetime.now(timezone.utc).isoformat(),
            feedback_id=feedback.get("id", ""),
            base_ref=base_ref,
            status="pending_apply",
            title=f"[stub] UI adjustment: {feedback.get('title', 'feedback')}",
            description=(
                f"Stub patch for feedback '{feedback.get('title', '')}'. "
                "No real files modified (offline/test mode)."
            ),
            files_changed=["apps/desktop/src/App.tsx"],
            unified_diff=stub_diff,
            scope_violations=[],
            agent_model="stub",
            agent_harness="stub-v1",
            log_text="\n".join(log_lines),
        )

    # ------------------------------------------------------------------
    # Real harness path — pi subprocess
    # ------------------------------------------------------------------

    def _call_pi(self, feedback: dict[str, Any], base_ref: str) -> PatchArtifact:
        desktop_root = self._repo_root / "apps" / "desktop"
        if not desktop_root.exists():
            raise HarnessUnavailableError(
                f"Desktop root not found at {desktop_root}; check repo_root configuration."
            )

        with tempfile.TemporaryDirectory(prefix="pi-patch-") as temp_dir:
            temp_desktop = Path(temp_dir) / "desktop"

            # Copy desktop dir excluding large caches that pi doesn't need
            shutil.copytree(
                desktop_root,
                temp_desktop,
                ignore=shutil.ignore_patterns(
                    "node_modules", ".vite", "dist", "build",
                    "__pycache__", "*.pyc", ".pytest_cache",
                ),
            )

            src_dir = temp_desktop / "src"

            # Snapshot before
            before = _snapshot_src(src_dir, temp_desktop)

            # Build pi command (with area-based file hints per T-0076)
            area = feedback.get("area", "") or ""
            hint = _area_hint(area)
            prompt = (
                f"Address the following user feedback by modifying the React UI:\n\n"
                f"Feedback title: {feedback.get('title', '')}\n"
                f"Details: {feedback.get('summary', '')}\n"
                f"Area: {area}{hint}"
            )
            cmd = [
                "pi", "-p", prompt,
                "--no-session",
                "--no-extensions",
                "--no-skills",
                "--no-prompt-templates",
                "--tools", "read,write,edit,grep,find,ls",
                "--append-system-prompt", SCOPE_GUARD_SYSTEM_PROMPT,
            ]
            # Credentials passed as CLI flags, never stored in artifacts
            if self._provider:
                cmd += ["--provider", self._provider]
            if self._api_key:
                cmd += ["--api-key", self._api_key]
            if self._model:
                cmd += ["--model", self._model]

            # Log command (API key redacted) for re-testing/optimization.
            # Use warning level so it's always visible even when 422/malformed (default level hides INFO).
            redacted_for_log = _redact_cmd_for_log(cmd)
            logger.warning(
                "pi command (run from apps/desktop): %s",
                shlex.join(redacted_for_log),
            )

            try:
                result = subprocess.run(
                    cmd,
                    cwd=str(temp_desktop),
                    capture_output=True,
                    text=True,
                    timeout=120,
                )
            except subprocess.TimeoutExpired as exc:
                raise HarnessUnavailableError("pi agent timed out after 120s") from exc
            except FileNotFoundError as exc:
                raise HarnessUnavailableError(
                    "pi command not found; install with: "
                    "npm install -g @mariozechner/pi-coding-agent"
                ) from exc

            # Exit code 1 can mean "model responded but tool errors occurred" — still check diff
            if result.returncode not in (0, 1):
                stderr_preview = (result.stderr or "")[:400]
                raise HarnessUnavailableError(
                    f"pi exited with code {result.returncode}. stderr: {stderr_preview}"
                )

            # Snapshot after
            after = _snapshot_src(src_dir, temp_desktop)

            changed_files, unified_diff = _compute_diff(before, after)

            if not changed_files:
                output_preview = (result.stdout or "")[:300]
                raise MalformedPatchError(
                    f"pi made no changes to apps/desktop/src/. "
                    f"pi output: {output_preview}"
                )

            description = (result.stdout or "").strip()[:1000]
            if not description:
                description = f"Changes addressing: {feedback.get('summary', '')}"

            log_parts: list[str] = []
            log_parts.append("pi subprocess run for patch generation")
            log_parts.append(f"cwd={temp_desktop}")
            log_parts.append(f"returncode={result.returncode}")
            log_parts.append("")
            log_parts.append(
                "command (run from apps/desktop; API key redacted — add --api-key $PATCH_AGENT_API_KEY when re-running):"
            )
            log_parts.append(shlex.join(redacted_for_log))
            if result.stdout:
                log_parts.append("")
                log_parts.append("stdout:")
                log_parts.append(result.stdout)
            if result.stderr:
                log_parts.append("")
                log_parts.append("stderr:")
                log_parts.append(result.stderr)
            log_text = "\n".join(log_parts)

            return PatchArtifact(
                id=_new_patch_id(),
                created_at=datetime.now(timezone.utc).isoformat(),
                feedback_id=feedback.get("id", ""),
                base_ref=base_ref,
                status="pending_apply",
                title=f"UI adjustment: {feedback.get('title', 'feedback')}",
                description=description,
                files_changed=changed_files,
                unified_diff=unified_diff,
                scope_violations=[],
                agent_model=self._model or "pi-default",
                agent_harness="pi-v1",
                log_text=log_text,
            )
