import { describe, expect, it } from 'vitest';
import { normalizeExtractedTerms } from '../src/billing/normalize.js';

describe('normalizeExtractedTerms', () => {
  it('blocks when required fields are missing', () => {
    const r = normalizeExtractedTerms({});
    expect(r.ok).toBe(false);
    if (r.ok) throw new Error('expected error');
    expect(r.errors.length).toBeGreaterThan(0);
  });

  it('normalizes a minimal valid extracted terms shape', () => {
    const r = normalizeExtractedTerms({
      customerName: 'ACME',
      contractStartDate: '2026-01-01',
      termLengthMonths: 12,
      invoiceFrequency: 'annual',
      currency: 'USD',
      dueDateRule: 'net_30',
      lineItems: [{ description: 'Annual subscription', recurringFeeMinor: 120000, cadence: 'annual' }]
    });
    expect(r.ok).toBe(true);
    if (!r.ok) throw new Error('expected ok');
    expect(r.normalized.currency).toBe('USD');
    expect(r.normalized.invoice.dueDateRule).toBe('net_30');
  });
});

