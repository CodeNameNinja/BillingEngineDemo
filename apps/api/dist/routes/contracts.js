import express from 'express';
import multer from 'multer';
import pdf from 'pdf-parse';
import { nanoid } from 'nanoid';
import { nowIsoUtc } from '../lib/time.js';
import { writeArtifacts } from '../lib/fs-artifacts.js';
import { extractBillingTermsFromText } from '../llm/extractBillingTerms.js';
import { ExtractedBillingTermsSchema } from '@demo/shared';
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5_000_000 } });
export const contractsRouter = express.Router();
contractsRouter.post('/', upload.single('file'), async (req, res) => {
    const f = req.file;
    if (!f)
        return res.status(400).json({ ok: false, error: 'Missing file' });
    const contractId = `con_${nanoid(10)}`;
    const runId = `run_${nanoid(10)}`;
    const createdAt = nowIsoUtc();
    let extractedText = '';
    try {
        const parsed = await pdf(f.buffer);
        extractedText = (parsed.text ?? '').trim();
    }
    catch (e) {
        return res.status(422).json({ ok: false, error: 'Failed to extract text from PDF' });
    }
    if (!extractedText) {
        return res.status(422).json({ ok: false, error: 'No usable text extracted from PDF' });
    }
    const artifactIndex = await writeArtifacts({
        runId,
        createdAt,
        contractId,
        files: [
            { key: 'contract.pdf', filename: 'contract.pdf', contentType: f.mimetype, data: f.buffer },
            {
                key: 'contract.text',
                filename: 'contract.text.txt',
                contentType: 'text/plain',
                data: Buffer.from(extractedText, 'utf8')
            },
            {
                key: 'contract.metadata',
                filename: 'contract.metadata.json',
                contentType: 'application/json',
                data: Buffer.from(JSON.stringify({
                    originalName: f.originalname,
                    size: f.size,
                    mimeType: f.mimetype
                }, null, 2))
            }
        ]
    });
    res.json({
        ok: true,
        runId,
        contractId,
        extractedText,
        metadata: {
            originalName: f.originalname,
            size: f.size,
            mimeType: f.mimetype
        },
        artifactIndex
    });
});
contractsRouter.post('/:contractId/extract-terms', express.json(), async (req, res) => {
    const { text } = req.body;
    if (!text || typeof text !== 'string')
        return res.status(400).json({ ok: false, error: 'Missing text' });
    const runId = `run_${nanoid(10)}`;
    const createdAt = nowIsoUtc();
    const r = await extractBillingTermsFromText(text);
    const parsed = ExtractedBillingTermsSchema.safeParse(r.extractedTerms);
    const warnings = r.warnings;
    const schemaOk = parsed.success;
    const artifactIndex = await writeArtifacts({
        runId,
        createdAt,
        contractId: req.params.contractId,
        files: [
            {
                key: 'billing_terms.extracted',
                filename: 'billing_terms.extracted.json',
                contentType: 'application/json',
                data: Buffer.from(JSON.stringify(r.extractedTerms, null, 2))
            },
            {
                key: 'billing_terms.warnings',
                filename: 'billing_terms.warnings.json',
                contentType: 'application/json',
                data: Buffer.from(JSON.stringify(warnings, null, 2))
            },
            {
                key: 'billing_terms.validation',
                filename: 'billing_terms.validation.json',
                contentType: 'application/json',
                data: Buffer.from(JSON.stringify({
                    schemaOk,
                    schemaErrors: schemaOk ? [] : parsed.error.issues
                }, null, 2))
            }
        ]
    });
    res.json({
        ok: true,
        runId,
        extractedTerms: r.extractedTerms,
        warnings,
        validation: {
            schemaOk,
            schemaErrors: schemaOk ? [] : parsed.error.issues
        },
        artifactIndex
    });
});
