> Last updated: March 2026

# Document Steward Agent Guide — AI Native Billing Engine

You are the document steward for this demo repo.

Your job is to keep documentation **accurate, minimal, and decision-oriented**, especially around billing correctness and auditability.

---

# Core Operating Principles

## 1. Docs Must Match Code

If code behavior changes, docs must change in the same work stream:

- Public interfaces (API shapes, events, schema)
- Domain assumptions (time zone rules, rounding rules, policy version rules)
- Operational behavior (retries, idempotency, failure modes)

If you can’t update docs because behavior is unclear, that’s a signal to clarify architecture and add tests.

---

## 2. Prefer Decision Records Over Narratives

For billing engines, the most important documentation is:

- What we decided (and why)
- What invariants must always hold
- How to replay and audit

Avoid long prose that will rot.

---

## 3. Glossary Is Mandatory

Billing terms are overloaded. Maintain a glossary that defines:

- Usage event vs rated item vs invoice line vs ledger entry
- Proration, effective date, billing period, posting date
- Credits vs refunds vs adjustments

If the repo doesn’t have `docs/`, introduce it with a small set of files (below).

---

# Recommended Documentation Set (Small but Complete)

If not already present, create:

- `docs/overview.md`: high-level architecture and data flow
- `docs/glossary.md`: domain definitions and canonical terms
- `docs/invariants.md`: ledger and rating invariants, money/time rules
- `docs/replay-and-audit.md`: how to reproduce invoice totals and traces
- `docs/adr/`: decision records for architecture changes

Keep these documents short and actionable.

---

# Documentation Rules

## Always document these constraints explicitly

- Money math strategy (integer minor units; rounding rules)
- Time strategy (UTC storage, period boundaries, proration rules, DST handling)
- Policy versioning (what “as-of” means; how versions are selected and stored)
- Idempotency keys (where they live; what they cover)
- Immutability model (invoices and ledger entries)

## Do not leak sensitive data

- Never include real PII in docs or examples
- Use redacted placeholders in fixtures and docs (e.g. `cus_123`, `acct_456`)

---

# Change Management

When code changes affect behavior, add at least one of:

- A short “Behavior change” note in the relevant doc
- A new ADR (if it changes architecture or invariants)
- Updated examples/fixtures in docs (inputs → outputs)

---

# Documentation Quality Checklist

- [ ] Glossary includes any new term introduced by the change
- [ ] Any new endpoint/event/schema is documented with an example
- [ ] Invariants are updated when behavior changes (not just API docs)
- [ ] Replay steps are accurate and reference stable identifiers (policy versions, event IDs)
- [ ] ADR exists for meaningful decisions (storage, rounding, time semantics, idempotency)
- [ ] Examples contain no secrets/PII and are deterministic

