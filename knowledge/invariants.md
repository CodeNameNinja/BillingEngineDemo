> Last updated: 2026-03-17

# Invariants (MVP)

## Money

- All money values are **integer minor units** (no floats).
- Invoice totals are computed as sums of line item `amountMinor`.
- Any future allocation/rounding logic must be explicit and tested.

## Time

- Timestamps are ISO-8601 **UTC** strings.
- Contract dates are `YYYY-MM-DD` and interpreted as **UTC midnight** when converted to timestamps.
- Reminder schedule timestamps are derived deterministically from `issuedAt` and `dueAt`.

## Determinism

- Given the same extracted terms + normalized model + usage events, invoice JSON is reproducible.\n- The LLM step is advisory; the normalized model is the source of truth for money.\n
## Replay & Idempotency

- Mutating operations accept an `Idempotency-Key`.\n- Repeating the same key returns the same response JSON.\n- Artifacts are stored per `runId` and are inspectable.\n+
