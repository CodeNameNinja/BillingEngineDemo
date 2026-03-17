> Last updated: March 2026

# ADRs — Architectural Decision Records

ADRs capture **engineering decisions** that affect system shape, invariants, or long-term maintenance.

If a decision can change billed amounts, ledger correctness, determinism, auditability, or replay behavior, it likely requires an ADR.

## File naming

- `ADR-0001-<kebab-case-title>.md`

## Required sections (minimum)

- **Context**: what problem are we solving, and what constraints exist?
- **Decision**: what we chose (be specific)
- **Options considered**: 2–3 realistic alternatives (with trade-offs)
- **Consequences**: what becomes easier/harder; risks; operational impacts
- **Rollout / Migration** (if applicable): steps, backfill plan, compatibility notes
- **Correctness & Auditability impact**: how this affects determinism, idempotency, replay, ledger invariants

## Templates

Use `docs/adr/ADR-TEMPLATE.md`.

