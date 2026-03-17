export type CurrencyCode = 'USD' | 'EUR' | 'GBP';

export type Money = {
  currency: CurrencyCode;
  /**
   * Integer minor units (e.g., cents). Never store floats for money.
   */
  amountMinor: number;
};

export type UsageEvent = {
  /** Stable idempotency key from producer */
  id: string;
  accountId: string;
  occurredAt: string; // ISO-8601 UTC
  meter: string;
  quantity: number;
  unit: string;
  metadata?: Record<string, string>;
};

