> Status: Proposed
>
> Date: 2026-03-17
>
> Owner: Solutions Architect

# ADR-0005: LLM boundary for term extraction (advisory, replayable)

## Context

The demo uses AI to convert contract text into structured billing terms, but billed amounts must remain deterministic and auditable. LLM output can be wrong, ambiguous, or non-deterministic.

## Decision

- Treat the LLM step as **advisory extraction** only.\n- Require schema validation (`ExtractedBillingTermsSchema`).\n- Normalize into a deterministic internal model (`NormalizedBillingModel`).\n- Block invoice generation on unresolved ambiguities (no silent defaults that change money).\n- For MVP, use a deterministic “mock extraction” mode optimized for a single known contract template.\n
## Options considered

### Option A: Advisory extraction with deterministic normalization (chosen)

- Pros
  - Clear correctness boundary\n  - Replayable outputs by persisting extracted JSON + normalized model\n- Cons
  - Requires explicit ambiguity handling\n- Risks
  - Users may assume extraction is authoritative; UI must surface warnings\n
### Option B: Let LLM directly output invoices

- Pros
  - Fast to prototype\n- Cons
  - Non-auditable and non-deterministic; unacceptable for billing\n- Risks
  - Wrong amounts in live demos\n
## Consequences

- Persist `billing_terms.extracted.json`, warnings, validation results, and `billing.normalized.json`.\n- Later: swap mock extraction for real provider calls, but keep the same artifact shapes and trace IDs.\n
## Correctness & Auditability impact

- Determinism: invoice math depends on normalized model, not free-form text.\n- Idempotency: extraction results can be cached by contract hash/version.\n- Ledger invariants: future ledger postings derive from deterministic invoice/rated items.\n- Traceability: any invoice number can be traced to contract text → extracted terms → normalized rules.\n
## Rollout / Migration (if applicable)

- Introduce real provider calls behind a versioned interface; persist provider model/version and prompt inputs in trace.\n
## References

- `docs/prd/PRD-0001-contract-to-cash-demo.md`\n- `apps/api/src/llm/extractBillingTerms.ts`\n- `apps/api/src/billing/normalize.ts`\n+
