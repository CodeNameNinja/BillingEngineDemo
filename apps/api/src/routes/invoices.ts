import express from 'express';
import { nanoid } from 'nanoid';
import {
  ExtractedBillingTermsSchema,
  type ExtractedBillingTerms,
  type UsageEvent,
  type NormalizedBillingModel,
  NormalizedBillingModelSchema
} from '@demo/shared';
import { nowIsoUtc } from '../lib/time.js';
import { writeArtifacts } from '../lib/fs-artifacts.js';
import { getIdempotentResponse, setIdempotentResponse } from '../lib/idempotency.js';
import { normalizeExtractedTerms } from '../billing/normalize.js';
import { generateInvoice } from '../billing/invoice.js';
import { buildDefaultReminderSchedule } from '../billing/reminders.js';
import { buildMonthlyRevRecSchedule } from '../billing/revrec.js';

export const invoicesRouter = express.Router();

invoicesRouter.post('/generate', express.json({ limit: '2mb' }), async (req, res) => {
  const idemKey = req.header('Idempotency-Key');
  if (idemKey) {
    const existing = await getIdempotentResponse(idemKey);
    if (existing) return res.json(existing.responseJson);
  }

  const body = req.body as {
    contractId?: string;
    extractedTerms?: ExtractedBillingTerms;
    normalizedModel?: NormalizedBillingModel;
    usageEvents?: UsageEvent[];
    runId?: string;
  };

  const runId = body.runId ?? `run_${nanoid(10)}`;
  const createdAt = nowIsoUtc();

  const usageEvents: UsageEvent[] = Array.isArray(body.usageEvents) ? body.usageEvents : [];

  let normalized: NormalizedBillingModel | null = null;
  let warnings: unknown[] = [];

  if (body.normalizedModel) {
    const parsed = NormalizedBillingModelSchema.safeParse(body.normalizedModel);
    if (!parsed.success) {
      const responseJson = { ok: false, error: 'Invalid normalized model', issues: parsed.error.issues };
      if (idemKey) await setIdempotentResponse(idemKey, { createdAt, responseJson });
      return res.status(400).json(responseJson);
    }
    normalized = parsed.data;
  } else if (body.extractedTerms) {
    const parsedTerms = ExtractedBillingTermsSchema.safeParse(body.extractedTerms);
    if (!parsedTerms.success) {
      const responseJson = { ok: false, error: 'Invalid extracted terms', issues: parsedTerms.error.issues };
      if (idemKey) await setIdempotentResponse(idemKey, { createdAt, responseJson });
      return res.status(400).json(responseJson);
    }
    const norm = normalizeExtractedTerms(parsedTerms.data);
    warnings = norm.warnings;
    if (!norm.ok) {
      const responseJson = {
        ok: false,
        error: 'Ambiguous/invalid extracted terms (invoice generation blocked)',
        warnings: norm.warnings,
        errors: norm.errors
      };
      if (idemKey) await setIdempotentResponse(idemKey, { createdAt, responseJson });
      return res.status(422).json(responseJson);
    }
    normalized = norm.normalized;
  } else {
    const responseJson = { ok: false, error: 'Provide normalizedModel or extractedTerms' };
    if (idemKey) await setIdempotentResponse(idemKey, { createdAt, responseJson });
    return res.status(400).json(responseJson);
  }

  const gen = generateInvoice({ model: normalized, usageEvents, runId });
  const reminders = buildDefaultReminderSchedule({
    invoiceId: gen.invoice.id,
    issuedAt: gen.invoice.issuedAt,
    dueAt: gen.invoice.dueAt
  });

  const termMonths = normalized.contract.termLengthMonths ?? 12;
  const revrec = buildMonthlyRevRecSchedule({
    invoiceId: gen.invoice.id,
    currency: gen.invoice.currency,
    serviceStartDate: normalized.contract.startDate,
    termLengthMonths: termMonths,
    totalMinor: gen.invoice.totalMinor
  });

  const artifactIndex = await writeArtifacts({
    runId,
    createdAt,
    contractId: body.contractId,
    invoiceId: gen.invoice.id,
    files: [
      {
        key: 'billing.normalized',
        filename: 'billing.normalized.json',
        contentType: 'application/json',
        data: Buffer.from(JSON.stringify(normalized, null, 2))
      },
      {
        key: 'invoice.json',
        filename: 'invoice.json',
        contentType: 'application/json',
        data: Buffer.from(JSON.stringify(gen.invoice, null, 2))
      },
      {
        key: 'invoice.html',
        filename: 'invoice.html',
        contentType: 'text/html',
        data: Buffer.from(gen.invoiceHtml, 'utf8')
      },
      {
        key: 'invoice.payment_link',
        filename: 'invoice.payment_link.json',
        contentType: 'application/json',
        data: Buffer.from(JSON.stringify(gen.paymentLink, null, 2))
      },
      {
        key: 'invoice.whatsapp_payload',
        filename: 'invoice.whatsapp_payload.json',
        contentType: 'application/json',
        data: Buffer.from(JSON.stringify(gen.whatsappPayload, null, 2))
      },
      {
        key: 'invoice.reminders',
        filename: 'invoice.reminders.json',
        contentType: 'application/json',
        data: Buffer.from(JSON.stringify(reminders, null, 2))
      },
      {
        key: 'invoice.revrec',
        filename: 'invoice.revrec.json',
        contentType: 'application/json',
        data: Buffer.from(JSON.stringify(revrec, null, 2))
      },
      {
        key: 'trace.json',
        filename: 'trace.json',
        contentType: 'application/json',
        data: Buffer.from(
          JSON.stringify(
            {
              runId,
              createdAt,
              contractId: body.contractId,
              invoiceId: gen.invoice.id,
              warnings,
              inputs: {
                usageEventsCount: usageEvents.length
              },
              policy: {
                normalizedModelVersion: normalized.version
              }
            },
            null,
            2
          )
        )
      }
    ]
  });

  const responseJson = {
    ok: true,
    runId,
    invoice: gen.invoice,
    invoiceHtml: gen.invoiceHtml,
    paymentLink: gen.paymentLink,
    whatsappPayload: gen.whatsappPayload,
    reminders,
    revrec,
    artifactIndex
  };

  if (idemKey) await setIdempotentResponse(idemKey, { createdAt, responseJson });
  return res.json(responseJson);
});

invoicesRouter.post('/:invoiceId/send-whatsapp', express.json(), async (req, res) => {
  const { messagePayload } = req.body as { messagePayload?: unknown };
  // MVP: mocked send — validate shape lightly.
  if (!messagePayload || typeof messagePayload !== 'object') {
    return res.status(400).json({ ok: false, error: 'Missing messagePayload' });
  }
  res.json({ ok: true, status: 'mock_sent', at: nowIsoUtc() });
});

invoicesRouter.post('/:invoiceId/reminders', express.json(), async (req, res) => {
  const { issuedAt, dueAt } = req.body as { issuedAt?: string; dueAt?: string };
  if (!issuedAt || !dueAt) return res.status(400).json({ ok: false, error: 'Missing issuedAt/dueAt' });
  const schedule = buildDefaultReminderSchedule({ invoiceId: req.params.invoiceId, issuedAt, dueAt });
  res.json({ ok: true, schedule });
});

invoicesRouter.get('/:invoiceId/revrec', async (req, res) => {
  // In MVP, revrec is computed during generation and stored as artifact; this endpoint is a convenience.
  res.status(501).json({ ok: false, error: 'Use /api/invoices/generate response (MVP)' });
});

