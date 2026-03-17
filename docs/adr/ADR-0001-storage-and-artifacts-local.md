> Status: Proposed
>
> Date: 2026-03-17
>
> Owner: Solutions Architect

# ADR-0001: Local artifact store for demo runs

## Context

The Contract-to-Cash demo must keep every intermediate artifact inspectable (raw text, extracted JSON, normalized model, invoice JSON/HTML, reminder schedule, rev rec schedule). The demo also targets a fast, reliable local run (< 30s) and needs replayability.

Constraints:

- Deterministic billing outputs must not depend on LLM wording alone.
- Artifacts must be easy to locate and share during the demo.
- No production storage/ERP integrations for the MVP.

## Decision

Store all run artifacts on local disk under `artifacts/<runId>/` and write a stable `index.json` that enumerates files, content types, and linkage IDs (`contractId`, `invoiceId`). Treat the artifact store as the primary demo “audit surface”.

## Options considered

### Option A: Local filesystem (`artifacts/`)

- Pros
  - Fast, local, zero infra
  - Easy to inspect and replay
  - Works offline; demo-safe
- Cons
  - Not multi-user; no retention controls
  - Not suitable for production
- Risks
  - Disk growth if not pruned

### Option B: SQLite

- Pros
  - Single file; queryable
  - More structured retention options
- Cons
  - Adds schema/migrations overhead
  - Less “drop a folder of artifacts” friendly for a demo
- Risks
  - Drift between schema and evolving artifact needs

## Consequences

- The API will write artifacts for each stage and expose a lightweight read-only endpoint to list/download them.
- Demo operators can delete `artifacts/` to reset the environment.

## Correctness & Auditability impact

- Determinism: artifacts include a `trace.json` with stable IDs and model versioning to enable replay.
- Idempotency: mutating operations should accept idempotency keys; artifacts should not double-write for the same key.
- Ledger invariants: MVP omits a true ledger, but artifacts preserve invoice totals and inputs for later invariants.
- Traceability: invoice totals can be audited back to normalized rules + usage inputs via saved JSON.

## Rollout / Migration (if applicable)

- MVP only; revisit for production (likely database + immutable append log).

## References

- `docs/prd/PRD-0001-contract-to-cash-demo.md`
- `apps/api/src/lib/fs-artifacts.ts`

