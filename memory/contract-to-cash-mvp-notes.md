> Started: 2026-03-17

# Contract-to-Cash MVP notes

- **Run command**: `npm run dev` (runs `apps/web` + `apps/api` concurrently).
- **Validate**: `npm run validate`.
- **Artifacts**: written to `artifacts/<runId>/` (gitignored), with `index.json` + stage outputs.
- **Idempotency**: `Idempotency-Key` cached under `artifacts/_idempotency/`.
- **LLM extraction**: OpenAI-backed (`apps/api/src/llm/extractBillingTerms.ts`).
- **Channel360 upload**: invoice PDF is generated + uploaded to `.../templates/upload`; WhatsApp header uses returned `location`.
  - Auth token: `WA_TEMPLATE_UPLOAD_KEY` (falls back to `WA_API_KEY`).
  - Debug artifacts: `invoice.pdf`, `invoice.pdf_upload.json`, `invoice.pdf_location.json`.
## Gotchas

- Typecheck uses TS path mapping for `@demo/shared` in apps; API build compiles against shared `dist`.
- Avoid putting secrets/real PII in fixtures and artifacts.
