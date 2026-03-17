import type { BillingWarning, ExtractedBillingTerms } from '@demo/shared';

export type ExtractTermsResult = {
  extractedTerms: ExtractedBillingTerms;
  warnings: BillingWarning[];
  mode: 'mock';
};

export async function extractBillingTermsFromText(_text: string): Promise<ExtractTermsResult> {
  // MVP: deterministic mock extraction for a single known contract template.
  // The LLM boundary is implemented here so we can swap to real calls later while preserving traces.
  const extractedTerms: ExtractedBillingTerms = {
    customerName: 'Demo Customer',
    contractStartDate: '2026-01-01',
    termLengthMonths: 12,
    invoiceFrequency: 'annual',
    billingModel: 'recurring',
    currency: 'USD',
    paymentTerms: 'Net 30',
    dueDateRule: 'net_30',
    lineItems: [
      {
        description: 'Annual subscription',
        recurringFeeMinor: 120000,
        cadence: 'annual'
      }
    ],
    contactChannel: {
      whatsappPhoneE164: '+15555550100'
    }
  };

  const warnings: BillingWarning[] = [
    {
      code: 'unsupported_term',
      message:
        'LLM extraction is mocked in this MVP (single template). Replace with real extraction when ready.'
    }
  ];

  return { extractedTerms, warnings, mode: 'mock' };
}

