import { CurrencyCodeSchema } from '@demo/shared';
export function normalizeExtractedTerms(terms) {
    const warnings = [];
    const errors = [];
    const customerName = terms.customerName?.trim();
    if (!customerName) {
        errors.push('customerName is required');
        warnings.push({ code: 'missing_field', message: 'Missing customer name', path: 'customerName' });
    }
    const startDate = terms.contractStartDate;
    if (!startDate) {
        errors.push('contractStartDate is required');
        warnings.push({
            code: 'missing_field',
            message: 'Missing contract start date',
            path: 'contractStartDate'
        });
    }
    const currency = terms.currency;
    if (!currency) {
        errors.push('currency is required');
        warnings.push({ code: 'missing_field', message: 'Missing currency', path: 'currency' });
    }
    else if (!CurrencyCodeSchema.safeParse(currency).success) {
        errors.push(`Unsupported currency: ${currency}`);
    }
    const frequency = normalizeFrequency(terms.invoiceFrequency);
    if (!frequency) {
        errors.push('invoiceFrequency is required');
        warnings.push({
            code: 'missing_field',
            message: 'Missing invoice frequency',
            path: 'invoiceFrequency'
        });
    }
    const dueDateRule = normalizeDueDateRule(terms.dueDateRule ?? terms.paymentTerms);
    if (dueDateRule === 'unknown') {
        warnings.push({
            code: 'ambiguous_term',
            message: 'Due date rule could not be normalized; requires explicit override',
            path: 'dueDateRule'
        });
        errors.push('dueDateRule could not be normalized (blocked)');
    }
    const charges = [];
    const lineItems = terms.lineItems ?? [];
    for (const li of lineItems) {
        const desc = li.description?.trim();
        if (!desc) {
            warnings.push({ code: 'parse_error', message: 'Line item missing description' });
            errors.push('lineItems[].description is required');
            continue;
        }
        if (li.fixedFeeMinor != null) {
            charges.push({ kind: 'fixed_fee', description: desc, amountMinor: li.fixedFeeMinor, cadence: 'one_time' });
            continue;
        }
        if (li.recurringFeeMinor != null) {
            const cadence = li.cadence;
            if (!cadence || cadence === 'one_time') {
                warnings.push({
                    code: 'ambiguous_term',
                    message: `Recurring fee cadence missing/invalid for "${desc}"`,
                    path: 'lineItems[].cadence'
                });
                errors.push(`Recurring cadence missing for "${desc}" (blocked)`);
                continue;
            }
            charges.push({ kind: 'recurring_fee', description: desc, amountMinor: li.recurringFeeMinor, cadence });
            continue;
        }
        warnings.push({
            code: 'ambiguous_term',
            message: `Line item "${desc}" has no amount (fixedFeeMinor/recurringFeeMinor)`,
            path: 'lineItems[]'
        });
        errors.push(`Line item "${desc}" missing fee amount (blocked)`);
    }
    for (const r of terms.variableUsageRules ?? []) {
        charges.push({
            kind: 'usage',
            meter: r.meter,
            unit: r.unit,
            pricePerUnitMinor: r.pricePerUnitMinor
        });
    }
    if (errors.length > 0 || !customerName || !startDate || !currency || !frequency) {
        return { ok: false, warnings, errors };
    }
    const normalized = {
        version: 1,
        customer: { name: customerName },
        currency,
        contract: {
            startDate,
            endDate: terms.contractEndDate,
            termLengthMonths: terms.termLengthMonths
        },
        invoice: {
            frequency,
            dueDateRule
        },
        charges,
        collections: {
            whatsappPhoneE164: terms.contactChannel?.whatsappPhoneE164
        }
    };
    return { ok: true, normalized, warnings };
}
function normalizeFrequency(f) {
    if (!f || f === 'unknown')
        return null;
    return f;
}
function normalizeDueDateRule(input) {
    const s = (input ?? '').toLowerCase();
    if (s.includes('net 0') || s.includes('net0'))
        return 'net_0';
    if (s.includes('net 7') || s.includes('net7'))
        return 'net_7';
    if (s.includes('net 14') || s.includes('net14'))
        return 'net_14';
    if (s.includes('net 30') || s.includes('net30'))
        return 'net_30';
    if (s === 'net_0' || s === 'net_7' || s === 'net_14' || s === 'net_30')
        return s;
    return 'unknown';
}
