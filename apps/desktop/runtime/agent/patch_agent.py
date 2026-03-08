"""
PatchAgent interface and implementations for M8 agentic code-patch generation.

Layer 2 allowlist validation (validate_scope) is called by the endpoint before persisting.

Integration model:
  PiDevPatchAgent invokes pi (https://pi.dev) as a local subprocess in the repo root.
  pi runs the self-evolving agent workflow; we compute a unified diff using git after the
  run and return a PatchArtifact.
"""

from __future__ import annotations

import abc
import difflib
import json
import logging
import os
import re
import shlex
import subprocess
import uuid
from dataclasses import dataclass
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

logger = logging.getLogger(__name__)

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
# Public helpers
# ---------------------------------------------------------------------------


def _redact_cmd_for_log(cmd: list[str]) -> list[str]:
    """Redact --api-key value for safe logging. Returns a copy."""
    out = list(cmd)
    for i, arg in enumerate(out):
        if arg == "--api-key" and i + 1 < len(out):
            out[i + 1] = "***"
            break
    return out


def _new_patch_id() -> str:
    date_part = datetime.now(timezone.utc).strftime("%Y%m%d")
    uid_part = uuid.uuid4().hex[:8]
    return f"PA-{date_part}-{uid_part}"


def _git_diff(repo_root: Path, base_ref: str) -> tuple[list[str], str]:
    """Return (changed_paths, unified_diff_text) using git diff against base_ref.

    Captures tracked modifications via `git diff base_ref` and new untracked files
    via `git ls-files --others --exclude-standard`.
    """
    changed_files: list[str] = []
    unified_diff = ""
    try:
        diff_proc = subprocess.run(
            ["git", "diff", base_ref],
            cwd=str(repo_root),
            capture_output=True, text=True, timeout=30,
        )
        unified_diff = diff_proc.stdout or ""

        name_proc = subprocess.run(
            ["git", "diff", base_ref, "--name-only"],
            cwd=str(repo_root),
            capture_output=True, text=True, timeout=30,
        )
        changed_files = [f for f in name_proc.stdout.splitlines() if f]

        ls_proc = subprocess.run(
            ["git", "ls-files", "--others", "--exclude-standard"],
            cwd=str(repo_root),
            capture_output=True, text=True, timeout=30,
        )
        for path in ls_proc.stdout.splitlines():
            if not path:
                continue
            changed_files.append(path)
            try:
                content = (repo_root / path).read_text(encoding="utf-8", errors="replace")
                lines = content.splitlines(keepends=True)
                chunk = difflib.unified_diff(
                    [], lines,
                    fromfile=f"a/{path}",
                    tofile=f"b/{path}",
                )
                unified_diff += "".join(chunk)
            except OSError:
                pass
    except (subprocess.TimeoutExpired, FileNotFoundError) as exc:
        logger.warning("git diff failed: %s", exc)
    return changed_files, unified_diff


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
    status: str  # pending_apply | applying | applied | apply_failed | scope_blocked | reverted | retrying | …
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
    # ISO timestamp recorded just before the pi subprocess is launched (T-0093).
    started_at: str | None = None
    # Raw agent execution log for this patch run (stdout/stderr, tool events, etc.).
    # Persisted separately in the runtime database; kept here for transport only.
    log_text: str | None = None
    # T-0097: refinement conversation id when patch was started from Fix with AI refinement flow.
    refinement_conversation_id: str | None = None

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
            "started_at": self.started_at,
            "log_text": self.log_text,
            "refinement_conversation_id": self.refinement_conversation_id,
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
            started_at=data.get("started_at"),
            log_text=data.get("log_text"),
            refinement_conversation_id=data.get("refinement_conversation_id"),
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
        self,
        feedback: dict[str, Any],
        base_ref: str,
        retry_context: str | None = None,
        existing_artifact_id: str | None = None,
        existing_created_at: str | None = None,
    ) -> PatchArtifact:
        """Generate a patch artifact from a feedback payload.

        Args:
            feedback: dict with keys id, title, summary, area.
            base_ref: git SHA of the working tree at invocation time.
            retry_context: optional failure context from a previous attempt (T-0091).
            existing_artifact_id: when provided (retry path), use this id for the
                returned artifact so the frontend keeps polling the same patch_id.
            existing_created_at: when provided with existing_artifact_id, use this
                as created_at for the returned artifact.

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
      1. Run: pi -p "Run the self-evolving agent with the following user feedback, without asking for any external output. Feedback: <content>" --tools read,write,edit,grep,find,ls [--provider P] [--api-key K] [--model M] --thinking low --verbose
         <content> is the feedback body (summary), not the title. pi runs from the repo root so it has access to all AGENTS.md guides and the full project.
      2. Compute unified diff using git after pi finishes; return PatchArtifact with status 'pending_apply'.

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
        self,
        feedback: dict[str, Any],
        base_ref: str,
        retry_context: str | None = None,
        existing_artifact_id: str | None = None,
        existing_created_at: str | None = None,
    ) -> PatchArtifact:
        if self._use_stub:
            return self._generate_stub(
                feedback, base_ref,
                existing_artifact_id=existing_artifact_id,
                existing_created_at=existing_created_at,
            )
        return self._call_pi(
            feedback, base_ref,
            retry_context=retry_context,
            existing_artifact_id=existing_artifact_id,
            existing_created_at=existing_created_at,
        )

    # ------------------------------------------------------------------
    # Stub path (offline / test)
    # ------------------------------------------------------------------

    def _generate_stub(
        self,
        feedback: dict[str, Any],
        base_ref: str,
        existing_artifact_id: str | None = None,
        existing_created_at: str | None = None,
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
        patch_id = existing_artifact_id or _new_patch_id()
        created_at = existing_created_at or datetime.now(timezone.utc).isoformat()
        started_at = datetime.now(timezone.utc).isoformat()
        return PatchArtifact(
            id=patch_id,
            created_at=created_at,
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
            started_at=started_at,
            log_text="\n".join(log_lines),
            refinement_conversation_id=feedback.get("refinement_conversation_id"),
        )

    # ------------------------------------------------------------------
    # Prompt assembly (M13 §7)
    # ------------------------------------------------------------------

    def _build_structured_prompt(
        self,
        content: str,
        retry_context: str | None = None,
    ) -> str:
        """Build the pi prompt: feedback + optional retry context.

        pi reads AGENTS.md from the repo root and can explore the codebase itself.
        This prompt adds only the change request and retry failure context when applicable.

        Args:
            content: the change request text (feedback summary or refined functional description).
            retry_context: if provided, appends failure context so the agent can self-correct
                           (used by T-0091 retry logic).
        """
        parts = [
            "Run the self-evolving agent with the following user feedback, "
            f"without asking for any external output.\n\nFeedback: {content}",
        ]
        if retry_context:
            parts.append(
                "Previous attempt failed. Here is what went wrong:\n"
                f"{retry_context}\n"
                "Please try again, addressing the failure."
            )
        return "\n\n".join(parts)

    # ------------------------------------------------------------------
    # Real harness path — pi subprocess
    # ------------------------------------------------------------------

    def _call_pi(
        self,
        feedback: dict[str, Any],
        base_ref: str,
        retry_context: str | None = None,
        existing_artifact_id: str | None = None,
        existing_created_at: str | None = None,
    ) -> PatchArtifact:
        if not self._repo_root.exists():
            raise HarnessUnavailableError(
                f"Repo root not found at {self._repo_root}; check repo_root configuration."
            )

        # T-0092: prefer validated functional description when present
        content = (
            feedback.get("refined_spec_text", "").strip()
            or feedback.get("summary", "").strip()
            or feedback.get("title", "")
        )
        prompt = self._build_structured_prompt(content, retry_context=retry_context)
        cmd = [
            "pi", "-p", prompt,
            "--tools", "read,write,edit,grep,find,ls",
        ]
        if self._provider:
            cmd += ["--provider", self._provider]
        if self._api_key:
            cmd += ["--api-key", self._api_key]
        if self._model:
            cmd += ["--model", self._model]
        cmd += ["--thinking", "low", "--verbose"]

        redacted_for_log = _redact_cmd_for_log(cmd)
        logger.warning(
            "pi command (run from repo root): %s",
            shlex.join(redacted_for_log),
        )

        started_at = datetime.now(timezone.utc).isoformat()
        try:
            result = subprocess.run(
                cmd,
                cwd=str(self._repo_root),
                capture_output=True,
                text=True,
                timeout=600,
            )
        except subprocess.TimeoutExpired as exc:
            raise HarnessUnavailableError("pi agent timed out after 600s") from exc
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

        changed_files, unified_diff = _git_diff(self._repo_root, base_ref)

        # Reset working tree to HEAD so apply pipeline starts from a clean base.
        # pi writes files directly; without this reset, _apply_patch in the pipeline
        # would try to re-apply an already-applied diff → patch exits 1.
        try:
            subprocess.run(
                ["git", "checkout", "HEAD", "--", "."],
                cwd=str(self._repo_root),
                capture_output=True, text=True, timeout=30,
            )
            subprocess.run(
                ["git", "clean", "-fd"],
                cwd=str(self._repo_root),
                capture_output=True, text=True, timeout=30,
            )
        except Exception:
            logger.warning("patch_agent: failed to reset working tree after pi run; apply pipeline may fail")

        # #region agent log
        try:
            import json as _json, time as _time
            from urllib.request import urlopen, Request as _Req
            _payload = _json.dumps({'sessionId':'6c587d','location':'patch_agent.py:_call_pi:after_reset','message':'working_tree_reset','data':{'changed_files':changed_files,'diff_len':len(unified_diff)},'timestamp':_time.time()*1000,'hypothesisId':'H-B'}).encode()
            urlopen(_Req('http://127.0.0.1:7883/ingest/cdc69240-2558-4092-a6a2-058d79d39464',data=_payload,headers={'Content-Type':'application/json','X-Debug-Session-Id':'6c587d'}),timeout=2)
        except Exception: pass
        # #endregion

        if not changed_files:
            output_preview = (result.stdout or "")[:300]
            raise MalformedPatchError(
                f"pi made no changes. pi output: {output_preview}"
            )

        description = (result.stdout or "").strip()[:1000]
        if not description:
            description = f"Changes addressing: {feedback.get('summary', '')}"

        log_parts: list[str] = []
        log_parts.append("pi subprocess run for self-evolving agent")
        log_parts.append(f"cwd={self._repo_root}")
        log_parts.append(f"returncode={result.returncode}")
        log_parts.append("")
        log_parts.append(
            "command (run from repo root; API key redacted — add --api-key $PATCH_AGENT_API_KEY when re-running):"
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

        patch_id = existing_artifact_id or _new_patch_id()
        created_at = existing_created_at or datetime.now(timezone.utc).isoformat()
        return PatchArtifact(
            id=patch_id,
            created_at=created_at,
            feedback_id=feedback.get("id", ""),
            base_ref=base_ref,
            status="pending_apply",
            title=f"Agent change: {feedback.get('title', 'feedback')}",
            description=description,
            files_changed=changed_files,
            unified_diff=unified_diff,
            scope_violations=[],
            agent_model=self._model or "pi-default",
            agent_harness="pi-v1",
            started_at=started_at,
            log_text=log_text,
            refinement_conversation_id=feedback.get("refinement_conversation_id"),
        )
