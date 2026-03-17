> Started: 2026-03-17

# Contract-to-Cash MVP notes

- **Run command**: `npm run dev` (runs `apps/web` + `apps/api` concurrently).\n- **Validate**: `npm run validate`.\n- **Artifacts**: written to `artifacts/<runId>/` (gitignored), with `index.json` + stage outputs.\n- **Idempotency**: `Idempotency-Key` cached under `artifacts/_idempotency/`.\n- **Integrations**: Ozow + WhatsApp are mocked (payload generation + fake send status).\n- **LLM extraction**: mocked (`apps/api/src/llm/extractBillingTerms.ts`) for single known template.\n
## Gotchas

- Typecheck uses TS path mapping for `@demo/shared` in apps; API build compiles against shared `dist`.\n- Avoid putting secrets/real PII in fixtures and artifacts.\n+
