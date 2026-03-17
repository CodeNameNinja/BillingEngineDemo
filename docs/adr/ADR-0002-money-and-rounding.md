> Status: Proposed
>
> Date: 2026-03-17
>
> Owner: Solutions Architect

# ADR-0002: Money representation and rounding

## Context

Billing systems fail when money math uses floats or rounding is implicit. The MVP must keep deterministic totals and be auditable.

## Decision

Represent money as **integer minor units** (`amountMinor`) with an explicit currency code. Avoid floating point arithmetic entirely. Any rounding/allocation rules must be explicit and tested.

## Options considered

### Option A: Integer minor units (cents) everywhere

- Pros
  - Deterministic and safe for addition/subtraction
  - Simple audit trail and tests
- Cons
  - Requires explicit decisions for non-2-decimal currencies (out of MVP scope)
- Risks
  - Hidden implicit cents conversion if inputs are not normalized

### Option B: Decimal library

- Pros
  - Flexible for currency subunits/precision
- Cons
  - More dependency surface; still requires explicit rounding rules
- Risks
  - Inconsistent usage across modules if not enforced

## Consequences

- API schemas and shared types use `amountMinor: number` and known currency codes.
- UI formats minor units for display; never stores floats.

## Correctness & Auditability impact

- Determinism: stable integer math avoids rounding drift.
- Idempotency: unaffected.
- Ledger invariants: future ledger postings can sum exactly to invoice totals without float error.
- Traceability: every number in the invoice is explainable as a sum of minor-unit line items.

## Rollout / Migration (if applicable)

- N/A for MVP.

## References

- `packages/shared/src/index.ts` (`Money`)
- `docs/prd/PRD-0001-contract-to-cash-demo.md` (rounding edge case)

