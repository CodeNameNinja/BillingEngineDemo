import { nanoid } from 'nanoid';
import { addDaysIsoUtc, nowIsoUtc } from '../lib/time.js';
const OZOW_PAY_LINK = 'https://pay.ozow.com/8a27a62f-2967-4888-88df-8d66a1c67bdd/payment-option/';
export function generateInvoice(args) {
    const issuedAt = nowIsoUtc();
    const dueAt = computeDueAt(issuedAt, args.model.invoice.dueDateRule);
    const invoiceId = `inv_${nanoid(10)}`;
    const invoiceNumber = `DEMO-${issuedAt.slice(0, 10).replace(/-/g, '')}-${invoiceId.slice(-4)}`;
    const lineItems = [];
    for (const c of args.model.charges) {
        if (c.kind === 'fixed_fee') {
            lineItems.push({
                id: `li_${nanoid(8)}`,
                description: c.description,
                quantity: 1,
                unit: 'each',
                unitPriceMinor: c.amountMinor,
                amountMinor: c.amountMinor
            });
        }
        if (c.kind === 'recurring_fee') {
            // MVP: single invoice period; assume one cadence unit.
            lineItems.push({
                id: `li_${nanoid(8)}`,
                description: `${c.description} (${c.cadence})`,
                quantity: 1,
                unit: 'period',
                unitPriceMinor: c.amountMinor,
                amountMinor: c.amountMinor
            });
        }
        if (c.kind === 'usage') {
            const matched = args.usageEvents.filter((e) => e.meter === c.meter && e.unit === c.unit);
            const qty = matched.reduce((sum, e) => sum + e.quantity, 0);
            const amount = qty * c.pricePerUnitMinor;
            lineItems.push({
                id: `li_${nanoid(8)}`,
                description: `Usage: ${c.meter}`,
                quantity: qty,
                unit: c.unit,
                unitPriceMinor: c.pricePerUnitMinor,
                amountMinor: amount
            });
        }
    }
    const subtotalMinor = lineItems.reduce((sum, li) => sum + li.amountMinor, 0);
    const totalMinor = subtotalMinor;
    const invoice = {
        id: invoiceId,
        invoiceNumber,
        currency: args.model.currency,
        issuedAt,
        dueAt,
        customerName: args.model.customer.name,
        lineItems,
        subtotalMinor,
        totalMinor
    };
    const paymentLink = {
        provider: 'ozow',
        url: OZOW_PAY_LINK
    };
    const invoiceHtml = renderInvoiceHtml(invoice, paymentLink);
    return { invoice, invoiceHtml, paymentLink };
}
function computeDueAt(issuedAtIso, rule) {
    if (rule === 'net_0')
        return issuedAtIso;
    if (rule === 'net_7')
        return addDaysIsoUtc(issuedAtIso, 7);
    if (rule === 'net_14')
        return addDaysIsoUtc(issuedAtIso, 14);
    if (rule === 'net_15')
        return addDaysIsoUtc(issuedAtIso, 15);
    return addDaysIsoUtc(issuedAtIso, 30);
}
function formatMinor(amountMinor, currency) {
    const sign = amountMinor < 0 ? '-' : '';
    const v = Math.abs(amountMinor);
    const dollars = Math.floor(v / 100);
    const cents = String(v % 100).padStart(2, '0');
    return `${sign}${currency} ${dollars}.${cents}`;
}
function renderInvoiceHtml(invoice, paymentLink) {
    const rows = invoice.lineItems
        .map((li) => `
        <tr>
          <td>${escapeHtml(li.description)}</td>
          <td style="text-align:right">${li.quantity}</td>
          <td style="text-align:right">${escapeHtml(li.unit)}</td>
          <td style="text-align:right">${escapeHtml(formatMinor(li.unitPriceMinor, invoice.currency))}</td>
          <td style="text-align:right">${escapeHtml(formatMinor(li.amountMinor, invoice.currency))}</td>
        </tr>
      `)
        .join('');
    return `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width,initial-scale=1" />
    <title>Invoice ${escapeHtml(invoice.invoiceNumber)}</title>
    <style>
      body{font-family:ui-sans-serif,system-ui,-apple-system,Segoe UI,Roboto,Helvetica,Arial;margin:24px;color:#111}
      .card{max-width:920px;margin:0 auto;border:1px solid #ddd;border-radius:12px;padding:18px}
      table{width:100%;border-collapse:collapse;margin-top:16px}
      th,td{border-bottom:1px solid #eee;padding:10px 8px;font-size:14px}
      th{text-align:left;background:#fafafa}
      .meta{display:flex;justify-content:space-between;gap:24px;flex-wrap:wrap}
      .pill{display:inline-block;padding:6px 10px;border-radius:999px;background:#f3f4f6}
      .total{font-size:18px;font-weight:700}
      a{color:#2563eb;text-decoration:none}
    </style>
  </head>
  <body>
    <div class="card">
      <div class="meta">
        <div>
          <div class="pill">Invoice</div>
          <h1 style="margin:10px 0 4px 0">${escapeHtml(invoice.invoiceNumber)}</h1>
          <div>Customer: <strong>${escapeHtml(invoice.customerName)}</strong></div>
        </div>
        <div>
          <div>Issued: ${escapeHtml(invoice.issuedAt.slice(0, 10))}</div>
          <div>Due: ${escapeHtml(invoice.dueAt.slice(0, 10))}</div>
          <div style="margin-top:8px"><a href="${escapeHtml(paymentLink.url)}">Pay via Ozow</a></div>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Description</th>
            <th style="text-align:right">Qty</th>
            <th style="text-align:right">Unit</th>
            <th style="text-align:right">Unit price</th>
            <th style="text-align:right">Amount</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
      <div style="display:flex;justify-content:flex-end;margin-top:14px">
        <div class="total">Total: ${escapeHtml(formatMinor(invoice.totalMinor, invoice.currency))}</div>
      </div>
    </div>
  </body>
</html>`;
}
function escapeHtml(s) {
    return s.replace(/[&<>"']/g, (c) => {
        if (c === '&')
            return '&amp;';
        if (c === '<')
            return '&lt;';
        if (c === '>')
            return '&gt;';
        if (c === '"')
            return '&quot;';
        return '&#39;';
    });
}
