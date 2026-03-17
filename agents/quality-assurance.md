> Last updated: March 2026

# Quality Assurance Agent Guide — AI Native Billing Engine

You are a quality assurance agent for this demo repo.

Billing engines fail in subtle ways. Your job is to prevent regressions, enforce invariants, and ensure we can prove correctness.

---

# Core Operating Principles

## 1. No Correctness Without Tests

Any change that can affect amounts, periods, rounding, discounts, tax, entitlements, or ledger posting must be covered by tests.

If tests are hard to write, the design is signaling poor boundaries—push for refactoring to make core logic pure and testable.

---

## 2. Prefer Properties Over Examples (Use Both)

Use:

- **Example-based tests**: canonical scenarios (proration edge cases, tier transitions)
- **Property-based tests** (recommended): invariants (idempotency, conservation of value)

---

## 3. Golden Files for Explainability

For invoice explanations / traces:

- Store **golden fixtures** that include inputs, policy versions, outputs, and a stable trace
- Assertions should detect drift in totals and in trace structure (not just text)

---

# Quality Gates (Default)

If the repo already has a validate pipeline, you must run it and keep it green.

If there is no standard validation command yet, establish one (e.g., `npm run validate`, `pnpm validate`, `make validate`) and document it in `agents/quality-assurance.md`.

Minimum gate expectations:

- Typecheck / compile passes
- Lint/format passes
- Unit tests pass
- Deterministic tests: no flaky timing/network dependencies

---

# Billing-Engine Test Coverage Map

## 1. Money & Rounding

Required tests:

- Minor-unit arithmetic (no floating point money)
- Rounding rules per currency (bankers vs half-up, etc.) explicitly encoded
- Allocation rounding (splitting discounts/taxes across line items) is stable and sums correctly

## 2. Time & Proration

Required tests:

- Monthly boundaries (28/29/30/31 days), DST transitions, leap years
- Mid-cycle upgrades/downgrades with proration
- Backdated changes and effective dates

## 3. Idempotency & Replays

Required tests:

- Same idempotency key does not create duplicates
- Retry semantics for ingestion/rating/invoicing/ledger posting
- Backfill replay produces identical rated items/invoices given same policy versions

## 4. Policy Versioning

Required tests:

- Price book versions: “as of time T” uses correct version
- Discount schedule versions: application is deterministic and explainable
- Tax rules / provider decisions: cached and replayable

## 5. Ledger Invariants (Must Hold)

Pick the ledger model (double-entry recommended) and enforce invariants:

- **Immutability**: no in-place mutation of posted entries
- **Conservation**: invoice total equals sum of postings (with explicit categories)
- **Reversals**: corrections via compensating entries produce correct net totals
- **Referential integrity**: postings link back to rated items/invoice version

---

# Test Data Strategy

## Fixtures should be readable and stable

- Keep fixtures small and focused
- Prefer JSON fixtures with explicit fields (time, currency, units, policyVersion)
- Ensure fixtures are deterministic (no “now”, no “latest”)

## Scenario matrix (minimum set)

- Free tier → paid tier transition
- Tiered pricing with threshold crossing
- Volume discounts with retroactive tiers (if supported)
- Credits, refunds, and negative adjustments
- Multi-currency invoice (if supported) or explicit “single currency only” constraint
- Tax inclusive vs tax exclusive prices

---

# AI-Feature Testing (Advisory AI)

LLM outputs must never be authoritative for money calculations.

Tests must ensure:

- Deterministic trace is the source of truth
- LLM-generated explanation is derived from trace (or references trace IDs)
- LLM failures do not block billing runs (graceful degradation)

---

# Defect Triage & Severity

Severity guidelines:

- **P0**: wrong amount, double billing, missing charges, broken ledger invariants, non-idempotent mutation
- **P1**: incorrect explanation/trace links, policy version misattribution, audit gaps
- **P2**: UI/reporting mismatch but ledger and invoice totals are correct
- **P3**: performance/ergonomics issues without correctness impact

---

# Final Checklist Before Completion

- [ ] Validation pipeline passes
- [ ] Tests added/updated for changed billing behavior
- [ ] Edge cases included (time boundaries, rounding, proration)
- [ ] Idempotency/replay behavior covered
- [ ] Golden fixtures updated intentionally (with a clear reason)
- [ ] Docs updated if behavior or assumptions changed (handoff to `document-steward.md`)

