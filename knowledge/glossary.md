> Last updated: 2026-03-17

# Glossary (Contract-to-Cash MVP)

- **Contract**: Source document (PDF) providing billing terms. In the MVP, the contract is treated as an immutable input artifact.
- **ExtractedText**: Raw text extracted from the PDF; persisted for audit/debug.
- **ExtractedBillingTerms**: AI-assisted (advisory) JSON representation of contract terms. Must be schema-validated and may include warnings/ambiguities.
- **NormalizedBillingModel**: Deterministic internal billing model derived from extracted terms. This is the authoritative input to invoice generation.
- **Invoice**: Deterministic totals + line items + issue/due dates. In MVP, invoices are JSON plus an HTML preview.
- **PaymentLink**: A provider URL used to pay an invoice. In MVP, this is mocked and never triggers real payments.
- **WhatsAppMessagePayload**: A message payload that could be sent via a WhatsApp provider. In MVP, generation/sending is mocked.
- **ReminderSchedule**: Planned reminder timestamps (UTC) relative to due date and issue date.
- **RevRecSchedule**: A simple monthly recognized vs deferred schedule derived from invoice total and service period.
- **Artifact**: Any persisted JSON/HTML/TXT/PDF output of a run stage (contract text, extracted terms, normalized model, invoice, trace).
- **RunId**: Correlation identifier for one workflow execution. Used to group artifacts.
- **IdempotencyKey**: Client-provided key that ensures retries do not duplicate side effects; same key returns same response JSON.

