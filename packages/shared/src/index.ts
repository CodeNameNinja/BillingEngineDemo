export type CurrencyCode = 'USD' | 'EUR' | 'GBP';

export type Money = {
  currency: CurrencyCode;
  /**
   * Integer minor units (e.g., cents). Never store floats for money.
   */
  amountMinor: number;
};

export type IsoUtcDateTimeString = string; // ISO-8601 UTC (e.g. 2026-03-17T12:34:56.000Z)
export type IsoDateString = string; // YYYY-MM-DD

export type UsageEvent = {
  /** Stable idempotency key from producer */
  id: string;
  accountId: string;
  occurredAt: IsoUtcDateTimeString;
  meter: string;
  quantity: number;
  unit: string;
  metadata?: Record<string, string>;
};

export type BillingWarning = {
  code:
    | 'missing_field'
    | 'ambiguous_term'
    | 'inconsistent_amount'
    | 'unsupported_term'
    | 'parse_error';
  message: string;
  path?: string;
};

export type ExtractedBillingTerms = {
  customerName?: string;
  contractStartDate?: IsoDateString;
  contractEndDate?: IsoDateString;
  termLengthMonths?: number;
  invoiceFrequency?: 'monthly' | 'quarterly' | 'annual' | 'one_time' | 'unknown';
  billingModel?: 'fixed' | 'recurring' | 'usage' | 'mixed' | 'unknown';
  currency?: CurrencyCode;
  paymentTerms?: string;
  dueDateRule?: string;
  lineItems?: Array<{
    description: string;
    quantity?: number;
    unit?: string;
    unitPriceMinor?: number;
    fixedFeeMinor?: number;
    recurringFeeMinor?: number;
    cadence?: 'monthly' | 'quarterly' | 'annual' | 'one_time';
  }>;
  variableUsageRules?: Array<{
    meter: string;
    unit: string;
    pricePerUnitMinor: number;
  }>;
  latePaymentPenalty?: string;
  contactChannel?: {
    whatsappPhoneE164?: string;
    email?: string;
  };
};

export type NormalizationResult =
  | {
      ok: true;
      normalized: NormalizedBillingModel;
      warnings: BillingWarning[];
    }
  | {
      ok: false;
      warnings: BillingWarning[];
      errors: string[];
    };

export type NormalizedBillingModel = {
  version: 1;
  customer: {
    name: string;
  };
  currency: CurrencyCode;
  contract: {
    startDate: IsoDateString;
    endDate?: IsoDateString;
    termLengthMonths?: number;
  };
  invoice: {
    frequency: 'monthly' | 'quarterly' | 'annual' | 'one_time';
    dueDateRule: 'net_0' | 'net_7' | 'net_14' | 'net_30' | 'unknown';
  };
  charges: Array<
    | {
        kind: 'fixed_fee';
        description: string;
        amountMinor: number;
        cadence: 'one_time';
      }
    | {
        kind: 'recurring_fee';
        description: string;
        amountMinor: number;
        cadence: 'monthly' | 'quarterly' | 'annual';
      }
    | {
        kind: 'usage';
        meter: string;
        unit: string;
        pricePerUnitMinor: number;
      }
  >;
  collections: {
    whatsappPhoneE164?: string;
  };
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  currency: CurrencyCode;
  issuedAt: IsoUtcDateTimeString;
  dueAt: IsoUtcDateTimeString;
  customerName: string;
  lineItems: Array<{
    id: string;
    description: string;
    quantity: number;
    unit: string;
    unitPriceMinor: number;
    amountMinor: number;
  }>;
  subtotalMinor: number;
  totalMinor: number;
};

export type PaymentLink = {
  provider: 'ozow';
  url: string;
};

export type WhatsAppMessagePayload = {
  to: string;
  template: string;
  variables: Record<string, string>;
};

export type ReminderSchedule = {
  invoiceId: string;
  reminders: Array<{
    at: IsoUtcDateTimeString;
    kind:
      | 'issue_immediately'
      | 'before_due_3d'
      | 'on_due'
      | 'after_due_3d'
      | 'after_due_7d';
  }>;
};

export type RevRecSchedule = {
  invoiceId: string;
  currency: CurrencyCode;
  months: Array<{
    month: string; // YYYY-MM
    recognizedMinor: number;
    deferredMinor: number;
  }>;
};

export type ArtifactIndex = {
  runId: string;
  createdAt: IsoUtcDateTimeString;
  contractId?: string;
  invoiceId?: string;
  files: Array<{
    key: string;
    path: string;
    contentType: string;
  }>;
};

export {
  CurrencyCodeSchema,
  ExtractedBillingTermsSchema,
  NormalizedBillingModelSchema
} from './schemas.js';


