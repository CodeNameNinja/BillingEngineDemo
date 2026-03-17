import PDFDocument from 'pdfkit';
import type { Invoice, PaymentLink } from '@demo/shared';

export async function renderInvoicePdf(args: { invoice: Invoice; paymentLink: PaymentLink }): Promise<Buffer> {
  const doc = new PDFDocument({ size: 'A4', margin: 48 });
  const chunks: Buffer[] = [];

  doc.on('data', (c: Buffer) => chunks.push(Buffer.isBuffer(c) ? c : Buffer.from(c)));

  doc.fontSize(18).text(`Invoice ${args.invoice.invoiceNumber}`, { align: 'left' });
  doc.moveDown(0.25);
  doc.fontSize(11).fillColor('#333').text(`Customer: ${args.invoice.customerName}`);
  doc.text(`Issued: ${args.invoice.issuedAt.slice(0, 10)}    Due: ${args.invoice.dueAt.slice(0, 10)}`);
  doc.moveDown(0.75);
  doc.fillColor('#111').text(`Pay link: ${args.paymentLink.url}`);
  doc.moveDown(1);

  doc.fontSize(12).text('Line items', { underline: true });
  doc.moveDown(0.5);

  for (const li of args.invoice.lineItems) {
    doc
      .fontSize(10)
      .fillColor('#111')
      .text(`${li.description}`, { continued: false });
    doc
      .fillColor('#555')
      .text(`Qty ${li.quantity} ${li.unit}  @  ${formatMinor(li.unitPriceMinor, args.invoice.currency)}  =  ${formatMinor(li.amountMinor, args.invoice.currency)}`);
    doc.moveDown(0.3);
  }

  doc.moveDown(0.75);
  doc.fontSize(13).fillColor('#111').text(`Total: ${formatMinor(args.invoice.totalMinor, args.invoice.currency)}`, {
    align: 'right'
  });

  doc.end();

  await new Promise<void>((resolve, reject) => {
    doc.on('end', () => resolve());
    doc.on('error', reject);
  });

  return Buffer.concat(chunks);
}

function formatMinor(amountMinor: number, currency: string) {
  const sign = amountMinor < 0 ? '-' : '';
  const v = Math.abs(amountMinor);
  const major = Math.floor(v / 100);
  const minor = String(v % 100).padStart(2, '0');
  return `${sign}${currency} ${major}.${minor}`;
}

