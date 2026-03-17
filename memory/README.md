> Last updated: March 2026

# Memory (Session-to-Session Working Notes)

This folder contains **working memory**: short, high-signal notes intended to help agents continue work across sessions.

Keep it lightweight and aggressively prune.

## What belongs here

- Current architectural constraints discovered while implementing
- “Gotchas” and pitfalls encountered in the codebase
- Short implementation notes that are not yet worth turning into ADR/PRD/docs
- Links to relevant files, commands, and validation steps

## What does NOT belong here

- Long-lived decisions (use `docs/adr/`)
- Product requirements (use `docs/prd/`)
- Anything with secrets or PII

## Suggested pattern

- One file per topic, e.g. `memory/billing-engine-notes.md`
- Prefer bullet points, keep entries dated
- Promote stable items into ADRs/docs and delete stale notes

