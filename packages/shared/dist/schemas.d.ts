import { z } from 'zod';
export declare const CurrencyCodeSchema: z.ZodEnum<["USD", "EUR", "GBP"]>;
export declare const ExtractedBillingTermsSchema: z.ZodObject<{
    customerName: z.ZodOptional<z.ZodString>;
    contractStartDate: z.ZodOptional<z.ZodString>;
    contractEndDate: z.ZodOptional<z.ZodString>;
    termLengthMonths: z.ZodOptional<z.ZodNumber>;
    invoiceFrequency: z.ZodOptional<z.ZodEnum<["monthly", "quarterly", "annual", "one_time", "unknown"]>>;
    billingModel: z.ZodOptional<z.ZodEnum<["fixed", "recurring", "usage", "mixed", "unknown"]>>;
    currency: z.ZodOptional<z.ZodEnum<["USD", "EUR", "GBP"]>>;
    paymentTerms: z.ZodOptional<z.ZodString>;
    dueDateRule: z.ZodOptional<z.ZodString>;
    lineItems: z.ZodOptional<z.ZodArray<z.ZodObject<{
        description: z.ZodString;
        quantity: z.ZodOptional<z.ZodNumber>;
        unit: z.ZodOptional<z.ZodString>;
        unitPriceMinor: z.ZodOptional<z.ZodNumber>;
        fixedFeeMinor: z.ZodOptional<z.ZodNumber>;
        recurringFeeMinor: z.ZodOptional<z.ZodNumber>;
        cadence: z.ZodOptional<z.ZodEnum<["monthly", "quarterly", "annual", "one_time"]>>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        quantity?: number | undefined;
        unit?: string | undefined;
        unitPriceMinor?: number | undefined;
        fixedFeeMinor?: number | undefined;
        recurringFeeMinor?: number | undefined;
        cadence?: "monthly" | "quarterly" | "annual" | "one_time" | undefined;
    }, {
        description: string;
        quantity?: number | undefined;
        unit?: string | undefined;
        unitPriceMinor?: number | undefined;
        fixedFeeMinor?: number | undefined;
        recurringFeeMinor?: number | undefined;
        cadence?: "monthly" | "quarterly" | "annual" | "one_time" | undefined;
    }>, "many">>;
    variableUsageRules: z.ZodOptional<z.ZodArray<z.ZodObject<{
        meter: z.ZodString;
        unit: z.ZodString;
        pricePerUnitMinor: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        unit: string;
        meter: string;
        pricePerUnitMinor: number;
    }, {
        unit: string;
        meter: string;
        pricePerUnitMinor: number;
    }>, "many">>;
    latePaymentPenalty: z.ZodOptional<z.ZodString>;
    contactChannel: z.ZodOptional<z.ZodObject<{
        whatsappPhoneE164: z.ZodOptional<z.ZodString>;
        email: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        whatsappPhoneE164?: string | undefined;
        email?: string | undefined;
    }, {
        whatsappPhoneE164?: string | undefined;
        email?: string | undefined;
    }>>;
}, "strict", z.ZodTypeAny, {
    customerName?: string | undefined;
    contractStartDate?: string | undefined;
    contractEndDate?: string | undefined;
    termLengthMonths?: number | undefined;
    invoiceFrequency?: "monthly" | "quarterly" | "annual" | "one_time" | "unknown" | undefined;
    billingModel?: "unknown" | "fixed" | "recurring" | "usage" | "mixed" | undefined;
    currency?: "USD" | "EUR" | "GBP" | undefined;
    paymentTerms?: string | undefined;
    dueDateRule?: string | undefined;
    lineItems?: {
        description: string;
        quantity?: number | undefined;
        unit?: string | undefined;
        unitPriceMinor?: number | undefined;
        fixedFeeMinor?: number | undefined;
        recurringFeeMinor?: number | undefined;
        cadence?: "monthly" | "quarterly" | "annual" | "one_time" | undefined;
    }[] | undefined;
    variableUsageRules?: {
        unit: string;
        meter: string;
        pricePerUnitMinor: number;
    }[] | undefined;
    latePaymentPenalty?: string | undefined;
    contactChannel?: {
        whatsappPhoneE164?: string | undefined;
        email?: string | undefined;
    } | undefined;
}, {
    customerName?: string | undefined;
    contractStartDate?: string | undefined;
    contractEndDate?: string | undefined;
    termLengthMonths?: number | undefined;
    invoiceFrequency?: "monthly" | "quarterly" | "annual" | "one_time" | "unknown" | undefined;
    billingModel?: "unknown" | "fixed" | "recurring" | "usage" | "mixed" | undefined;
    currency?: "USD" | "EUR" | "GBP" | undefined;
    paymentTerms?: string | undefined;
    dueDateRule?: string | undefined;
    lineItems?: {
        description: string;
        quantity?: number | undefined;
        unit?: string | undefined;
        unitPriceMinor?: number | undefined;
        fixedFeeMinor?: number | undefined;
        recurringFeeMinor?: number | undefined;
        cadence?: "monthly" | "quarterly" | "annual" | "one_time" | undefined;
    }[] | undefined;
    variableUsageRules?: {
        unit: string;
        meter: string;
        pricePerUnitMinor: number;
    }[] | undefined;
    latePaymentPenalty?: string | undefined;
    contactChannel?: {
        whatsappPhoneE164?: string | undefined;
        email?: string | undefined;
    } | undefined;
}>;
export declare const NormalizedBillingModelSchema: z.ZodObject<{
    version: z.ZodLiteral<1>;
    customer: z.ZodObject<{
        name: z.ZodString;
    }, "strip", z.ZodTypeAny, {
        name: string;
    }, {
        name: string;
    }>;
    currency: z.ZodEnum<["USD", "EUR", "GBP"]>;
    contract: z.ZodObject<{
        startDate: z.ZodString;
        endDate: z.ZodOptional<z.ZodString>;
        termLengthMonths: z.ZodOptional<z.ZodNumber>;
    }, "strip", z.ZodTypeAny, {
        startDate: string;
        termLengthMonths?: number | undefined;
        endDate?: string | undefined;
    }, {
        startDate: string;
        termLengthMonths?: number | undefined;
        endDate?: string | undefined;
    }>;
    invoice: z.ZodObject<{
        frequency: z.ZodEnum<["monthly", "quarterly", "annual", "one_time"]>;
        dueDateRule: z.ZodEnum<["net_0", "net_7", "net_14", "net_30", "unknown"]>;
    }, "strip", z.ZodTypeAny, {
        dueDateRule: "unknown" | "net_0" | "net_7" | "net_14" | "net_30";
        frequency: "monthly" | "quarterly" | "annual" | "one_time";
    }, {
        dueDateRule: "unknown" | "net_0" | "net_7" | "net_14" | "net_30";
        frequency: "monthly" | "quarterly" | "annual" | "one_time";
    }>;
    charges: z.ZodArray<z.ZodDiscriminatedUnion<"kind", [z.ZodObject<{
        kind: z.ZodLiteral<"fixed_fee">;
        description: z.ZodString;
        amountMinor: z.ZodNumber;
        cadence: z.ZodLiteral<"one_time">;
    }, "strip", z.ZodTypeAny, {
        description: string;
        cadence: "one_time";
        kind: "fixed_fee";
        amountMinor: number;
    }, {
        description: string;
        cadence: "one_time";
        kind: "fixed_fee";
        amountMinor: number;
    }>, z.ZodObject<{
        kind: z.ZodLiteral<"recurring_fee">;
        description: z.ZodString;
        amountMinor: z.ZodNumber;
        cadence: z.ZodEnum<["monthly", "quarterly", "annual"]>;
    }, "strip", z.ZodTypeAny, {
        description: string;
        cadence: "monthly" | "quarterly" | "annual";
        kind: "recurring_fee";
        amountMinor: number;
    }, {
        description: string;
        cadence: "monthly" | "quarterly" | "annual";
        kind: "recurring_fee";
        amountMinor: number;
    }>, z.ZodObject<{
        kind: z.ZodLiteral<"usage">;
        meter: z.ZodString;
        unit: z.ZodString;
        pricePerUnitMinor: z.ZodNumber;
    }, "strip", z.ZodTypeAny, {
        unit: string;
        meter: string;
        pricePerUnitMinor: number;
        kind: "usage";
    }, {
        unit: string;
        meter: string;
        pricePerUnitMinor: number;
        kind: "usage";
    }>]>, "many">;
    collections: z.ZodObject<{
        whatsappPhoneE164: z.ZodOptional<z.ZodString>;
    }, "strip", z.ZodTypeAny, {
        whatsappPhoneE164?: string | undefined;
    }, {
        whatsappPhoneE164?: string | undefined;
    }>;
}, "strict", z.ZodTypeAny, {
    currency: "USD" | "EUR" | "GBP";
    version: 1;
    customer: {
        name: string;
    };
    contract: {
        startDate: string;
        termLengthMonths?: number | undefined;
        endDate?: string | undefined;
    };
    invoice: {
        dueDateRule: "unknown" | "net_0" | "net_7" | "net_14" | "net_30";
        frequency: "monthly" | "quarterly" | "annual" | "one_time";
    };
    charges: ({
        description: string;
        cadence: "one_time";
        kind: "fixed_fee";
        amountMinor: number;
    } | {
        description: string;
        cadence: "monthly" | "quarterly" | "annual";
        kind: "recurring_fee";
        amountMinor: number;
    } | {
        unit: string;
        meter: string;
        pricePerUnitMinor: number;
        kind: "usage";
    })[];
    collections: {
        whatsappPhoneE164?: string | undefined;
    };
}, {
    currency: "USD" | "EUR" | "GBP";
    version: 1;
    customer: {
        name: string;
    };
    contract: {
        startDate: string;
        termLengthMonths?: number | undefined;
        endDate?: string | undefined;
    };
    invoice: {
        dueDateRule: "unknown" | "net_0" | "net_7" | "net_14" | "net_30";
        frequency: "monthly" | "quarterly" | "annual" | "one_time";
    };
    charges: ({
        description: string;
        cadence: "one_time";
        kind: "fixed_fee";
        amountMinor: number;
    } | {
        description: string;
        cadence: "monthly" | "quarterly" | "annual";
        kind: "recurring_fee";
        amountMinor: number;
    } | {
        unit: string;
        meter: string;
        pricePerUnitMinor: number;
        kind: "usage";
    })[];
    collections: {
        whatsappPhoneE164?: string | undefined;
    };
}>;
//# sourceMappingURL=schemas.d.ts.map