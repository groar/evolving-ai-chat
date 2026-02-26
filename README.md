# Agentic Coding Scaffold

Project-agnostic repository scaffold for AI-assisted delivery workflows.

## Includes
- Root agent operating guide: `AGENTS.md`
- Living project snapshot: `STATUS.md`
- Ticketing system: `tickets/`
- PM workflow guide: `tickets/AGENTS.md`
- QA workflow guide: `tests/AGENTS.md`
- Reusable templates for feature tickets, bug tickets, and feedback intake.

## Purpose
- Keep planning, implementation status, QA checkpoints, and PM feedback loops in version control.
- Provide a simple filesystem-based workflow that agents can operate without external tooling.

## Next Step for a New Project
1. Add project-specific product/design docs.
2. Fill out `STATUS.md` with the initial project description and constraints.
3. Create initial tickets in `tickets/status/backlog/`.
4. Prioritize work in `tickets/status/ready/ORDER.md`.

## Desktop App Setup
For the local desktop shell bootstrap and environment commands, see:
- `apps/desktop/README.md`

## Validation Gate (v1)
Run the required validation checks and produce a timestamped artifact:

```bash
npm run validate
```

Artifacts are written under `tickets/meta/qa/artifacts/validate/<run-id>/` with:
- `README.md` summary
- `summary.json` machine-readable status
- `logs/` raw per-step logs
