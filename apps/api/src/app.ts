import cors from 'cors';
import express from 'express';
import { apiRouter } from './routes/api.js';

export function createApp() {
  const app = express();
  app.use(cors());
  app.use(express.json({ limit: '2mb' }));
  app.get('/healthz', (_req, res) => res.json({ ok: true }));
  app.use('/api', apiRouter);
  return app;
}

