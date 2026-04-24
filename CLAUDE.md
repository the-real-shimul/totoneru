# CLAUDE.md

This file is a short Claude-facing entry point for the repository.

Before doing any work, read these files in order:

1. [PROGRESS.md](/Users/shimul/Documents/Claude%20Playground/totoneru/PROGRESS.md)
2. [PROJECT_SPEC.md](/Users/shimul/Documents/Claude%20Playground/totoneru/PROJECT_SPEC.md)
3. [agents.md](/Users/shimul/Documents/Claude%20Playground/totoneru/agents.md)

## Repo expectations

- Follow the current phase target in `PROGRESS.md`
- Keep changes minimal and directly tied to the task
- Respect the client-side-only architecture
- Preserve the separation of data, behavior, and presentation
- Never skip backup, dry-run, or transactional safety rules

## Current handoff

- Foundation work is complete through `S0.4`
- The next implementation target is `S1.1` — `jszip + sql.js` setup for deck parsing

## Verification

Before wrapping up a coding task, run:

- `npm run typecheck`
- `npx eslint . --max-warnings 0`
- `npm run build`

If the task changes project status, update `PROGRESS.md` before finishing.
