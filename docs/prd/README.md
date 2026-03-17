> Last updated: March 2026

# PRDs — Product Requirements Documents

PRDs capture **what we are building and why** (product intent), and define acceptance criteria that QA can enforce.

PRDs are not architecture documents. They can reference ADRs for “how”.

## File naming

- `PRD-0001-<kebab-case-title>.md`

## Required sections (minimum)

- **Problem**: what user/business problem are we solving?
- **Goals**: measurable outcomes
- **Non-goals**: explicit exclusions
- **User stories / Use cases**: who does what and why
- **Functional requirements**: what must exist
- **Non-functional requirements**: scale, latency, reliability, compliance
- **Acceptance criteria**: testable checklist
- **Risks & open questions**
- **Analytics/Observability**: what we must measure

## Templates

Use `docs/prd/PRD-TEMPLATE.md`.

