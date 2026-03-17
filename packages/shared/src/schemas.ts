import { z } from 'zod';

export const CurrencyCodeSchema = z.enum(['USD', 'EUR', 'GBP', 'ZAR']);

export const ExtractedBillingTermsSchema = z
  .object({
    customerName: z.string().min(1).optional(),
    contractStartDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    contractEndDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    termLengthMonths: z.number().int().positive().optional(),
    invoiceFrequency: z
      .enum(['monthly', 'quarterly', 'annual', 'one_time', 'unknown'])
      .optional(),
    billingModel: z.enum(['fixed', 'recurring', 'usage', 'mixed', 'unknown']).optional(),
    currency: CurrencyCodeSchema.optional(),
    paymentTerms: z.string().optional(),
    dueDateRule: z.string().optional(),
    lineItems: z
      .array(
        z.object({
          description: z.string().min(1),
          quantity: z.number().positive().optional(),
          unit: z.string().optional(),
          unitPriceMinor: z.number().int().nonnegative().optional(),
          fixedFeeMinor: z.number().int().nonnegative().optional(),
          recurringFeeMinor: z.number().int().nonnegative().optional(),
          cadence: z.enum(['monthly', 'quarterly', 'annual', 'one_time']).optional()
        })
      )
      .optional(),
    variableUsageRules: z
      .array(
        z.object({
          meter: z.string().min(1),
          unit: z.string().min(1),
          pricePerUnitMinor: z.number().int().nonnegative()
        })
      )
      .optional(),
    latePaymentPenalty: z.string().optional(),
    contactChannel: z
      .object({
        whatsappPhoneE164: z.string().optional(),
        email: z.string().email().optional()
      })
      .optional()
  })
  .strict();

export const NormalizedBillingModelSchema = z
  .object({
    version: z.literal(1),
    customer: z.object({
      name: z.string().min(1)
    }),
    currency: CurrencyCodeSchema,
    contract: z.object({
      startDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      endDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
      termLengthMonths: z.number().int().positive().optional()
    }),
    invoice: z.object({
      frequency: z.enum(['monthly', 'quarterly', 'annual', 'one_time']),
      dueDateRule: z.enum(['net_0', 'net_7', 'net_14', 'net_15', 'net_30', 'unknown'])
    }),
    charges: z.array(
      z.discriminatedUnion('kind', [
        z.object({
          kind: z.literal('fixed_fee'),
          description: z.string().min(1),
          amountMinor: z.number().int().nonnegative(),
          cadence: z.literal('one_time')
        }),
        z.object({
          kind: z.literal('recurring_fee'),
          description: z.string().min(1),
          amountMinor: z.number().int().nonnegative(),
          cadence: z.enum(['monthly', 'quarterly', 'annual'])
        }),
        z.object({
          kind: z.literal('usage'),
          meter: z.string().min(1),
          unit: z.string().min(1),
          pricePerUnitMinor: z.number().int().nonnegative()
        })
      ])
    ),
    collections: z.object({
      whatsappPhoneE164: z.string().optional()
    })
  })
  .strict();

