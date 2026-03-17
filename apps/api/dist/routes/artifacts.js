import express from 'express';
import path from 'node:path';
import { readFile } from 'node:fs/promises';
import { listRuns, readArtifactIndex } from '../lib/fs-artifacts.js';
export const artifactsRouter = express.Router();
artifactsRouter.get('/runs', async (_req, res) => {
    const runs = await listRuns();
    res.json({ ok: true, runs });
});
artifactsRouter.get('/:runId', async (req, res) => {
    try {
        const index = await readArtifactIndex(req.params.runId);
        res.json({ ok: true, index });
    }
    catch {
        res.status(404).json({ ok: false, error: 'Run not found' });
    }
});
artifactsRouter.get('/:runId/file', async (req, res) => {
    const key = String(req.query.key ?? '');
    if (!key)
        return res.status(400).json({ ok: false, error: 'Missing key query param' });
    try {
        const index = await readArtifactIndex(req.params.runId);
        const f = index.files.find((x) => x.key === key);
        if (!f)
            return res.status(404).json({ ok: false, error: 'File not found' });
        const data = await readFile(f.path);
        res.setHeader('Content-Type', f.contentType);
        res.setHeader('Content-Disposition', `inline; filename="${path.basename(f.path)}"`);
        res.send(data);
    }
    catch {
        res.status(404).json({ ok: false, error: 'Run/file not found' });
    }
});
