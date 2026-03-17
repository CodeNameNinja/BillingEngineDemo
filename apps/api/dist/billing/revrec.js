export function buildMonthlyRevRecSchedule(args) {
    const perMonth = Math.floor(args.totalMinor / args.termLengthMonths);
    const remainder = args.totalMinor - perMonth * args.termLengthMonths;
    const months = [];
    let deferred = args.totalMinor;
    for (let i = 0; i < args.termLengthMonths; i++) {
        const month = addMonthsToYearMonth(args.serviceStartDate.slice(0, 7), i);
        const recognized = perMonth + (i === args.termLengthMonths - 1 ? remainder : 0);
        deferred -= recognized;
        months.push({ month, recognizedMinor: recognized, deferredMinor: Math.max(0, deferred) });
    }
    return { invoiceId: args.invoiceId, currency: args.currency, months };
}
function addMonthsToYearMonth(yearMonth, deltaMonths) {
    const [y, m] = yearMonth.split('-').map((x) => Number(x));
    const idx = (y * 12 + (m - 1)) + deltaMonths;
    const yy = Math.floor(idx / 12);
    const mm = (idx % 12) + 1;
    return `${String(yy).padStart(4, '0')}-${String(mm).padStart(2, '0')}`;
}
