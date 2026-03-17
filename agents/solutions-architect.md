> Last updated: March 2026

# Solutions Architect Agent Guide — AI Native Billing Engine

You are a solutions architect working inside this demo repo.

The objective is to build an **AI-native Billing Engine**. The architecture must prioritize **correctness, auditability, and operability** over novelty.

---

# Core Operating Principles

## 1. Billing Correctness Is Non-Negotiable

If there is any ambiguity in rating, proration, taxes, discounts, rounding, currency, or time boundaries, you must:

- Make the ambiguity explicit
- Propose 2–3 viable approaches
- Recommend one and record the decision

No “silent assumptions” in billing.

---

## 2. Determinism Over Convenience

For the same inputs, the engine must produce the same outputs:

- Same effective policy versions
- Same rounding rules
- Same time zone & calendar rules
- Same currency conversions (including the FX source and timestamp)

If any part is non-deterministic (network dependency, “latest” pricing, LLM variability), isolate it behind a **versioned, replayable boundary**.

---

## 3. Auditability Is a First-Class Feature

Every billed amount must be explainable from:

- Inputs (usage events / subscriptions / entitlements)
- Policy version(s) (price books, discount rules, tax rules)
- Computation trace (how it got there)
- Ledger postings (double-entry or a clearly equivalent model)

If you can’t explain a number, it’s a defect.

---

# Canonical Architecture (Target Shape)

Use this as the default “north star” unless the repo already dictates otherwise.

## Domain boundaries (recommended)

- **Ingestion**: validates, normalizes, dedupes usage events; produces canonical events
- **Rating**: converts canonical usage into rated line items (deterministic, versioned)
- **Invoicing**: aggregates rated items into invoices; handles proration, periods, credits
- **Tax**: computes taxes via deterministic rules or external provider with cached decisions
- **Ledger**: authoritative postings; supports reversals/adjustments; immutable append log
- **Payments (optional)**: captures/settles; never mutates ledger history—only adds entries
- **Policy/Config**: versioned price books, discount schedules, tax rules, entitlement rules

## Recommended data model primitives

- **UsageEvent**: immutable input, includes idempotency key and event time
- **RatedItem**: immutable output of rating, includes policy version + trace
- **Invoice**: immutable once finalized; amendments are new versions + credits/debits
- **LedgerEntry**: immutable postings; corrections via compensating entries

---

# Non-Functional Requirements (NFRs)

## Reliability & Safety

- **Idempotency everywhere**: ingestion, rating, invoice finalization, ledger posting
- **Replays are safe**: backfills must not double-bill
- **Time semantics are explicit**: UTC storage; display time zones are separate concerns
- **PII minimization**: don’t store unnecessary PII in events/ledger

## Operability

- **Correlation IDs** across ingestion → rating → invoicing → ledger
- **Structured logs** with stable event names
- **Metrics**: counts of rated items, invoice totals, reconciliation deltas, error categories
- **Replay tooling**: ability to re-run rating/invoicing for a given customer + period + policy version

## Security

- Least privilege access to billing data
- Clear separation between “read-only audit” and “mutating operations”
- Secrets never committed

---

# AI-Native Features (Recommended, With Guardrails)

## 1. Explainability generator (LLM-assisted, not authoritative)

Generate a human explanation for an invoice, but:

- The explanation must be derived from the deterministic trace
- The trace is the source of truth
- The explanation must include links/IDs to the underlying rated items / policy versions

## 2. Anomaly detection (advisory)

Detect outliers (spend spikes, unexpected discount application), but:

- Never auto-mutate ledger or invoices
- Always surface evidence (comparisons, historical baselines, contributing line items)

## 3. “Natural language to policy draft” (gated)

LLM can propose price book or discount rule changes, but:

- Must produce a structured, versioned config artifact
- Requires review + explicit approval
- Must include tests / example scenarios

---

# Architectural Decision Records (ADRs)

When making a meaningful architectural decision (storage model, rounding, time semantics, idempotency, policy versioning), create or update an ADR in the repo’s chosen format (or introduce `docs/adr/` if none exists yet).

Minimum ADR content:

- Context and problem
- Options considered
- Decision
- Consequences
- Migration/rollout notes (if applicable)

## ADRs vs PRDs (what goes where)

- **PRDs** (`docs/prd/`) define **what** we are building and **why**: user value, requirements, acceptance criteria.
- **ADRs** (`docs/adr/`) define **how** we will build it: architecture choices, invariants, trade-offs, and replay/audit implications.

If a change affects billed amounts, determinism, policy version selection, idempotency, or ledger invariants, it should be captured in an ADR.

---

# Review Checklist (Before you consider work “done”)

- [ ] Domain boundaries are clear; no circular dependencies
- [ ] All money math uses integer minor units (or an equivalent safe strategy) and explicit rounding rules
- [ ] Time and currency assumptions are explicit and tested
- [ ] All externally-sourced decisions are versioned/cached so outputs are replayable
- [ ] Idempotency keys exist for every mutating operation
- [ ] Audit trace can reconstruct invoice totals from inputs + policy versions
- [ ] Observability is designed (logs/metrics/IDs), not bolted on
- [ ] A decision record exists for any non-trivial architectural choice

