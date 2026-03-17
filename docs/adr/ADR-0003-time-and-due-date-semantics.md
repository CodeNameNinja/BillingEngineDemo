> Status: Proposed
>
> Date: 2026-03-17
>
> Owner: Solutions Architect

# ADR-0003: Time semantics (UTC) and due date rules

## Context

The demo includes contract start/end dates, invoice issue/due dates, reminder schedules, and rev rec monthly schedules. Time boundary bugs are common (DST, month length, leap years).

## Decision

- Store timestamps as ISO-8601 **UTC** strings.
- Store contract “dates” as `YYYY-MM-DD` and interpret them in **UTC midnight** when converting to timestamps.
- Normalize due date rules into a small explicit set (`net_0`, `net_7`, `net_14`, `net_30`). Block invoice generation when due date cannot be normalized.

## Options considered

### Option A: UTC-only semantics (MVP)

- Pros
  - Deterministic across machines/time zones
  - Easy to test and audit
- Cons
  - User-local date display requires extra formatting later
- Risks
  - Incorrect assumptions if source contracts define local time zones (out of scope for MVP)

### Option B: Store original timezone + convert

- Pros
  - More faithful to contract semantics
- Cons
  - More complexity and ambiguity for MVP
- Risks
  - Easy to introduce DST bugs without strong test coverage

## Consequences

- Reminder scheduling uses UTC computations from `issuedAt`/`dueAt`.
- Rev rec schedule uses month buckets computed from the contract start month.

## Correctness & Auditability impact

- Determinism: UTC timestamps remove local clock/time zone variability.
- Idempotency: unaffected.
- Ledger invariants: future postings can use consistent posting timestamps.
- Traceability: due dates and reminders are reproducible from rule + issue date.

## Rollout / Migration (if applicable)

- N/A for MVP.

## References

- `apps/api/src/lib/time.ts`
- `apps/api/src/billing/invoice.ts` (due date computation)

