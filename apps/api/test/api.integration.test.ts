import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../src/app.js';

describe('api integration', () => {
  it('serves status + can generate invoice from extracted terms', async () => {
    const app = createApp();
    const status = await request(app).get('/api/status');
    expect(status.status).toBe(200);
    expect(status.body.ok).toBe(true);

    const generate = await request(app)
      .post('/api/invoices/generate')
      .set('Content-Type', 'application/json')
      .send({
        contractId: 'con_test',
        extractedTerms: {
          customerName: 'ACME',
          contractStartDate: '2026-01-01',
          termLengthMonths: 12,
          invoiceFrequency: 'annual',
          billingModel: 'recurring',
          currency: 'USD',
          paymentTerms: 'Net 30',
          dueDateRule: 'net_30',
          lineItems: [{ description: 'Annual subscription', recurringFeeMinor: 120000, cadence: 'annual' }],
          contactChannel: { whatsappPhoneE164: '+15555550100' }
        }
      });

    expect(generate.status).toBe(200);
    expect(generate.body.ok).toBe(true);
    expect(generate.body.invoice.totalMinor).toBe(120000);
    expect(generate.body.paymentLink.provider).toBe('ozow');
  });
});

