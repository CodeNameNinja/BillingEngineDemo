> Status: Proposed
>
> Date: 2026-03-17
>
> Owner: Solutions Architect

# ADR-0004: Idempotency keys and replay behavior (MVP)

## Context

Even in a demo, retries happen (UI double-clicks, refreshes, flaky networks). Billing workflows must not duplicate side effects, especially anything that could be mistaken for a “charge”.

## Decision

- Accept an `Idempotency-Key` header on mutating endpoints (starting with invoice generation).\n- Store idempotency responses in a disk-backed cache under `artifacts/_idempotency/`.\n- Treat replays as safe: the same key returns the same JSON response.\n
## Options considered

### Option A: Disk-backed idempotency cache (MVP)

- Pros
  - Simple and deterministic
  - Works without a database
- Cons
  - No TTL/eviction policy
  - Not safe for multi-process concurrency
- Risks
  - Key collisions if not scoped (mitigated by prefixing with stable IDs in UI)

### Option B: Database-backed idempotency table

- Pros
  - Correct under concurrency; supports TTL and observability
- Cons
  - Adds infra and migrations (out of MVP scope)
- Risks
  - Overkill for a demo

## Consequences

- UI uses stable keys (e.g. `demo-<contractId>`) for invoice generation.\n- Operators can delete `artifacts/_idempotency` to reset.\n
## Correctness & Auditability impact

- Determinism: retrying produces identical outputs.\n- Idempotency: explicit contract on endpoints.\n- Ledger invariants: prevents double-posting in future ledger layer.\n- Traceability: stored response JSON can be linked to run IDs and artifacts.\n
## Rollout / Migration (if applicable)

- Replace disk cache with database when introducing real persistence.\n
## References

- `apps/api/src/lib/idempotency.ts`\n- `apps/api/src/routes/invoices.ts`\n+
