import express from 'express';
import { contractsRouter } from './contracts.js';
import { invoicesRouter } from './invoices.js';
import { artifactsRouter } from './artifacts.js';
export const apiRouter = express.Router();
apiRouter.get('/status', (_req, res) => {
    res.json({ ok: true, service: 'api' });
});
apiRouter.use('/contracts', contractsRouter);
apiRouter.use('/invoices', invoicesRouter);
apiRouter.use('/artifacts', artifactsRouter);
