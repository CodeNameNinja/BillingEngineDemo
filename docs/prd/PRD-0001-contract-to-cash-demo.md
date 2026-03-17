> Status: Draft
>
> Date: 2026-03-17
>
> Owner: Document Steward / Solutions Architect

# PRD-0001: Contract-to-Cash Demo (PDF → Terms → Invoice → Payment Link → WhatsApp Collections)

## Problem

In many businesses, billing begins in messy, unstructured contracts (PDFs, emails, signed agreements). Teams manually interpret terms into invoices, reminders, and accounting records.

This creates:

- Slow billing setup and iteration
- Inconsistent interpretation of ambiguous terms
- Error-prone invoice generation
- Manual collections follow-up
- Weak traceability between contract terms, invoices, and finance reporting

This demo shows how AI can accelerate interpretation, while deterministic software preserves control, correctness, and auditability.

## Goals (measurable)

- Produce an end-to-end happy-path demo run in **< 30 seconds** (local/dev environment).
- Convert **one uploaded dummy contract PDF** into **validated structured billing terms** (schema-valid JSON).
- Generate an invoice with:
  - deterministic totals
  - a payment link attached (Ozow for the demo)
  - a WhatsApp message payload ready to send via UnifiedSend
- Create a reminder schedule for the invoice (configurable cadence).
- Produce a basic revenue recognition output (recognized vs deferred schedule) for the invoice.
- Make artifacts inspectable and auditable: raw extraction text, extracted JSON, normalized model, invoice JSON, reminder schedule.

## Non-goals

Out of scope for the demo (avoid live-demo chaos):

- Real accounting ledger / ERP integrations
- Full tax engine and jurisdiction-complete invoice compliance
- Multi-currency FX logic (unless explicitly scoped later)
- Production-grade payments reconciliation
- OCR recovery for low-quality scanned PDFs
- Signature verification
- Full ASC 606 / IFRS 15 compliant rev rec across all scenarios

## Users & Use cases

- **User type**: Finance lead / Operations lead / RevOps analyst
  - **Use case**: Upload a contract, confirm extracted terms, generate invoice + reminders, and show finance-aware outputs.
- **User type**: Product / Engineering stakeholder evaluating AI workflows
  - **Use case**: See AI embedded inside a controlled workflow with deterministic guardrails and replayable outputs.
- **User type**: SaaS founder / operator
  - **Use case**: Understand how contract terms can become executable billing + collections automation.

## Functional requirements

- **FR1 — Contract ingestion**
  - Allow upload of a contract PDF (dummy data).
  - Extract and store raw text + file metadata.
  - Surface extracted raw text for debugging/demo visibility.
  - Fail gracefully if no usable text is found.
- **FR2 — Billing term extraction (AI-assisted)**
  - Send extracted text to an LLM (using `OPEN_API_KEY`) to produce **strict JSON only**.
  - Capture uncertainty/ambiguity as warnings (do not invent terms).
  - Minimum extracted fields:
    - customer name
    - contract start date
    - contract end date or term length
    - invoice frequency
    - billing model
    - currency
    - payment terms
    - due date rule
    - line items (including unit price / fixed fee / recurring fee)
    - variable usage rules if present
    - late payment penalty if present
    - contact/channel info if present
- **FR3 — Deterministic billing rule model**
  - Validate extracted JSON against a schema.
  - Normalize into deterministic internal rules (e.g., fixed monthly fee, setup fee, usage-based, tiered).
  - Block invoice generation on unresolved ambiguity (or require explicit defaults).
- **FR4 — Optional usage ingestion**
  - Support optional usage/events input for variable billing.
  - Demo input can be JSON or CSV dummy events.
- **FR5 — Invoice generation**
  - Generate invoice JSON from normalized rules + optional usage.
  - Apply due date logic.
  - Generate invoice reference/number (demo-safe).
  - Attach Ozow payment link.
  - Provide a human-readable invoice preview (HTML is sufficient for demo; PDF optional).
- **FR6 — Collections automation**
  - Send invoice notification via UnifiedSend WhatsApp (real send or simulation).
  - Include invoice summary, amount due, due date, payment link.
  - Schedule reminders at configurable cadences.
- **FR7 — Revenue recognition (demo-simple)**
  - Generate a monthly schedule of recognized vs deferred revenue based on service period.
  - Example: 12-month service billed upfront recognized monthly.

## Non-functional requirements

- **Reliability**
  - Deterministic billing output must not depend solely on LLM wording.
  - System must fail safely when extraction is ambiguous (no “silent defaults” that change money).
- **Performance**
  - Happy-path end-to-end demo completes in under 30 seconds.
- **Security & compliance**
  - Dummy customer data only by default.
  - Do not store secrets in repo.
  - Avoid PII in logs, fixtures, and docs (use placeholders).
- **Determinism & replayability**
  - Given the same contract + same extracted terms + same policy versions/config, the outputs must be replayable.
  - LLM output is advisory; the normalized deterministic model is the source of truth.
- **Auditability**
  - Every invoice must link back to the contract source + extracted terms + normalized rule set and any usage inputs.

## Acceptance criteria (testable)

- [ ] Uploading a dummy PDF returns a `contractId`, extracted text, metadata, and ingestion status.
- [ ] Extract-billing-terms returns strict JSON and a list of warnings for ambiguities (if any).
- [ ] Invalid/ambiguous extracted terms **block invoice generation** (or require explicit “override defaults” in the workflow).
- [ ] Building rules produces a normalized deterministic billing model with validation status.
- [ ] Generating an invoice produces:
  - [ ] invoice JSON (line items, subtotal, total, due date)
  - [ ] invoice preview (HTML or URL)
  - [ ] Ozow payment link attached
- [ ] Sending invoice produces a WhatsApp message payload and UnifiedSend send status (real or simulated).
- [ ] Reminder schedule is created with at least these default cadences:
  - [ ] immediately on invoice issue
  - [ ] 3 days before due date
  - [ ] on due date
  - [ ] 3 days after due date
  - [ ] 7 days after due date
- [ ] Revenue recognition endpoint returns a monthly schedule (recognized vs deferred).
- [ ] All artifacts are inspectable for the demo (raw text, extracted JSON, normalized model, invoice, reminders, rev rec).

## Edge cases

- Contract text extraction returns empty or partial text (fail gracefully).
- Ambiguous terms: missing end date, unclear frequency, missing currency, inconsistent amounts.
- Time boundaries: leap years, month length differences, DST (store and compute in UTC).
- Rounding rules for money (integer minor units; no floating point).
- Variable billing with usage spikes/outliers (should be inspectable; not auto-corrected).

## Risks & open questions

- **Risk**: LLM extraction can be wrong or ambiguous.
- **Risk**: Some PDFs are unstructured/scanned and text extraction may be poor.
- **Risk**: Payment link + messaging in a live demo can cause accidental real-world sends/charges if not gated.
- **Open question**: What is the minimum “human review” step in the demo for ambiguous terms?
- **Open question**: Which contract patterns do we explicitly support for the demo (one template vs multiple)?
- **Open question**: Do we simulate Ozow + UnifiedSend, or integrate real sandboxes?

## Analytics / Observability

- Events to emit:
  - `contract.uploaded`
  - `contract.text_extracted`
  - `billing_terms.extracted`
  - `billing_terms.validated`
  - `billing_rules.built`
  - `invoice.generated`
  - `invoice.sent_whatsapp`
  - `invoice.reminders_scheduled`
  - `invoice.revrec_generated`
- Metrics to track:
  - end-to-end duration
  - extraction warning rate
  - validation failure rate
  - invoice generation success rate
  - reminder scheduling success rate
- Dashboards/alerts needed (demo-light):
  - error categories by stage
  - run duration histogram

## Dependencies

- LLM provider access via `OPEN_API_KEY`
- PDF text extraction library/service
- Ozow payment link generation (sandbox or mocked)
- UnifiedSend WhatsApp messaging (sandbox or mocked)

## References

- Related docs:
  - `docs/prd/PRD-TEMPLATE.md`
  - `docs/adr/ADR-TEMPLATE.md`
- Related agent guides:
  - `agents/solutions-architect.md`
  - `agents/quality-assurance.md`
  - `agents/document-steward.md`

