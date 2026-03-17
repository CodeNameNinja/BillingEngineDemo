> Last updated: March 2026

# Demo Agents — AI Native Billing Engine

This folder contains **role-specific agent guides** for this demo. These files are intended to be read by AI agents (and humans) before starting work.

## How to use

- Read **all files in `agents/`** at the start of a session.
- Follow the role guide that matches your task.
- When you discover new constraints, patterns, decisions, or pitfalls: **update the relevant guide** so the next run is better.

## Files

| File | Purpose |
| --- | --- |
| `solutions-architect.md` | System architecture, domain boundaries, invariants, and non-functional requirements |
| `quality-assurance.md` | Test strategy, quality gates, coverage expectations, and defect prevention for billing correctness |
| `document-steward.md` | Documentation standards, decision records, glossary, and keeping docs in sync with code |
| `frontend-master-stylist.md` | MUI-based design system rules, theming strategy, and UI consistency/a11y checklist |

## Shared objective

Build an **AI-native Billing Engine** that is:

- **Correct by construction**: ledger invariants, idempotency, deterministic pricing/rating outcomes
- **Auditable**: every number explainable, reproducible, and traceable to inputs and policy versions
- **Safe**: least-privilege access, PII minimization, and defense-in-depth
- **Operable**: good observability, predictable failure modes, and clear runbooks

