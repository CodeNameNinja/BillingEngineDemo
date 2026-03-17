import express from 'express';
import { nanoid } from 'nanoid';
import { ExtractedBillingTermsSchema, NormalizedBillingModelSchema } from '@demo/shared';
import { nowIsoUtc } from '../lib/time.js';
import { writeArtifacts } from '../lib/fs-artifacts.js';
import { getIdempotentResponse, setIdempotentResponse } from '../lib/idempotency.js';
import { normalizeExtractedTerms } from '../billing/normalize.js';
import { generateInvoice } from '../billing/invoice.js';
import { renderInvoicePdf } from '../billing/invoicePdf.js';
import { buildDefaultReminderSchedule } from '../billing/reminders.js';
import { buildMonthlyRevRecSchedule } from '../billing/revrec.js';
import { uploadToFileIo } from '../integrations/fileio.js';
const CHANNEL360_ORG_ID = '639700347749ed00181de224';
const CHANNEL360_ENDPOINT = `https://www.channel360.co.za/v1.1/org/${CHANNEL360_ORG_ID}/notification`;
const DEMO_WHATSAPP_DOCUMENT_LINK = 'https://d2q3tfs05n2hft.cloudfront.net/2026-03-17T09%3A53%3A13.436Z-invoice.pdf';
export const invoicesRouter = express.Router();
invoicesRouter.post('/generate', express.json({ limit: '2mb' }), async (req, res) => {
    const idemKey = req.header('Idempotency-Key');
    if (idemKey) {
        const existing = await getIdempotentResponse(idemKey);
        if (existing)
            return res.json(existing.responseJson);
    }
    const body = req.body;
    const runId = body.runId ?? `run_${nanoid(10)}`;
    const createdAt = nowIsoUtc();
    const usageEvents = Array.isArray(body.usageEvents) ? body.usageEvents : [];
    let normalized = null;
    let warnings = [];
    if (body.normalizedModel) {
        const parsed = NormalizedBillingModelSchema.safeParse(body.normalizedModel);
        if (!parsed.success) {
            const responseJson = { ok: false, error: 'Invalid normalized model', issues: parsed.error.issues };
            if (idemKey)
                await setIdempotentResponse(idemKey, { createdAt, responseJson });
            return res.status(400).json(responseJson);
        }
        normalized = parsed.data;
    }
    else if (body.extractedTerms) {
        const parsedTerms = ExtractedBillingTermsSchema.safeParse(body.extractedTerms);
        if (!parsedTerms.success) {
            const responseJson = { ok: false, error: 'Invalid extracted terms', issues: parsedTerms.error.issues };
            if (idemKey)
                await setIdempotentResponse(idemKey, { createdAt, responseJson });
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
            if (idemKey)
                await setIdempotentResponse(idemKey, { createdAt, responseJson });
            return res.status(422).json(responseJson);
        }
        normalized = norm.normalized;
    }
    else {
        const responseJson = { ok: false, error: 'Provide normalizedModel or extractedTerms' };
        if (idemKey)
            await setIdempotentResponse(idemKey, { createdAt, responseJson });
        return res.status(400).json(responseJson);
    }
    const gen = generateInvoice({ model: normalized, usageEvents, runId });
    // Generate invoice PDF and upload to file.io so we can use the hosted location in the WhatsApp header document.
    let invoicePdfLocation = null;
    let invoicePdfUpload = null;
    let invoicePdfUploadError = null;
    let invoicePdf = null;
    try {
        invoicePdf = await renderInvoicePdf({ invoice: gen.invoice, paymentLink: gen.paymentLink });
        const upload = await uploadToFileIo({
            filename: `${gen.invoice.invoiceNumber}.pdf`,
            contentType: 'application/pdf',
            data: invoicePdf
        });
        invoicePdfLocation = upload.link ?? null;
        invoicePdfUpload = upload;
    }
    catch (e) {
        // For demo safety: invoice generation should not fail if upload fails.
        invoicePdfLocation = null;
        invoicePdfUploadError = e instanceof Error ? e.message : String(e);
    }
    const whatsappPayload = {
        destination: '27656225667',
        message: {
            type: 'template',
            template: {
                name: 'ozow_demo_utility',
                language: { policy: 'deterministic', code: 'en' },
                components: [
                    {
                        type: 'header',
                        parameters: [
                            {
                                type: 'document',
                                document: { link: invoicePdfLocation ?? DEMO_WHATSAPP_DOCUMENT_LINK }
                            }
                        ]
                    },
                    {
                        type: 'body',
                        parameters: [
                            { type: 'text', text: firstName(gen.invoice.customerName) },
                            { type: 'text', text: gen.invoice.invoiceNumber },
                            { type: 'text', text: formatMinor(gen.invoice.totalMinor, gen.invoice.currency) },
                            { type: 'text', text: gen.invoice.dueAt.slice(0, 10) }
                        ]
                    }
                ]
            }
        }
    };
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
            ...(invoicePdf
                ? [
                    {
                        key: 'invoice.pdf',
                        filename: 'invoice.pdf',
                        contentType: 'application/pdf',
                        data: invoicePdf
                    }
                ]
                : []),
            {
                key: 'invoice.whatsapp_payload',
                filename: 'invoice.whatsapp_payload.json',
                contentType: 'application/json',
                data: Buffer.from(JSON.stringify(whatsappPayload, null, 2))
            },
            {
                key: 'invoice.pdf_location',
                filename: 'invoice.pdf_location.json',
                contentType: 'application/json',
                data: Buffer.from(JSON.stringify({ location: invoicePdfLocation }, null, 2))
            },
            {
                key: 'invoice.pdf_upload',
                filename: 'invoice.pdf_upload.json',
                contentType: 'application/json',
                data: Buffer.from(JSON.stringify({ upload: invoicePdfUpload, error: invoicePdfUploadError }, null, 2))
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
                data: Buffer.from(JSON.stringify({
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
                }, null, 2))
            }
        ]
    });
    const responseJson = {
        ok: true,
        runId,
        invoice: gen.invoice,
        invoiceHtml: gen.invoiceHtml,
        paymentLink: gen.paymentLink,
        whatsappPayload,
        reminders,
        revrec,
        artifactIndex
    };
    if (idemKey)
        await setIdempotentResponse(idemKey, { createdAt, responseJson });
    return res.json(responseJson);
});
invoicesRouter.post('/:invoiceId/send-whatsapp', express.json(), async (req, res) => {
    const { messagePayload } = req.body;
    if (!messagePayload || typeof messagePayload !== 'object') {
        return res.status(400).json({ ok: false, error: 'Missing messagePayload' });
    }
    const token = process.env.WA_API_KEY;
    if (!token) {
        return res.status(500).json({ ok: false, error: 'Missing WA_API_KEY for WhatsApp send' });
    }
    try {
        const r = await fetch(CHANNEL360_ENDPOINT, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token}`
            },
            body: JSON.stringify(messagePayload)
        });
        const text = await r.text();
        let json = null;
        try {
            json = JSON.parse(text);
        }
        catch {
            json = { raw: text };
        }
        if (!r.ok)
            return res.status(502).json({ ok: false, error: 'WhatsApp send failed', status: r.status, response: json });
        res.json({ ok: true, status: 'accepted', at: nowIsoUtc(), response: json });
    }
    catch (e) {
        res.status(502).json({ ok: false, error: 'WhatsApp send failed', detail: e instanceof Error ? e.message : String(e) });
    }
});
function firstName(full) {
    const trimmed = String(full ?? '').trim();
    if (!trimmed)
        return 'Customer';
    const [first] = trimmed.split(/\s+/);
    return first ?? 'Customer';
}
function formatMinor(amountMinor, currency) {
    const sign = amountMinor < 0 ? '-' : '';
    const v = Math.abs(amountMinor);
    const major = Math.floor(v / 100);
    const minor = String(v % 100).padStart(2, '0');
    return `${sign}${currency} ${major}.${minor}`;
}
invoicesRouter.post('/:invoiceId/reminders', express.json(), async (req, res) => {
    const { issuedAt, dueAt } = req.body;
    if (!issuedAt || !dueAt)
        return res.status(400).json({ ok: false, error: 'Missing issuedAt/dueAt' });
    const schedule = buildDefaultReminderSchedule({ invoiceId: req.params.invoiceId, issuedAt, dueAt });
    res.json({ ok: true, schedule });
});
invoicesRouter.get('/:invoiceId/revrec', async (req, res) => {
    // In MVP, revrec is computed during generation and stored as artifact; this endpoint is a convenience.
    res.status(501).json({ ok: false, error: 'Use /api/invoices/generate response (MVP)' });
});
