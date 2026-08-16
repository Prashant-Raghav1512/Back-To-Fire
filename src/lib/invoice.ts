// Client-side PDF invoice generation — fits this site's "no backend" model
// (see CLAUDE.md): there's no payment gateway wired up anywhere, so
// enrolling in a paid plan or joining a membership only ever records a
// stated price/payment-method preference in Neon, never a real charge.
// This generates a receipt-styled PDF from that recorded data entirely in
// the browser via jsPDF — no server round-trip, nothing to fetch. Because
// no real transaction exists, the PDF says so explicitly in its footer
// rather than implying a processed payment.
import jsPDF from 'jspdf';

export interface InvoiceLineItem {
  description: string;
  detail?: string;
  amount: number;
}

export interface InvoiceInput {
  invoiceNumber: string;
  invoiceDate: Date;
  billedToName: string;
  billedToEmail?: string;
  memberId?: string;
  items: InvoiceLineItem[];
  paymentMethod?: string;
}

function formatInr(amount: number): string {
  return `Rs. ${amount.toLocaleString('en-IN')}`;
}

export function downloadInvoicePdf(input: InvoiceInput): void {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 48;
  let y = 56;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(17, 24, 39);
  doc.text('Born to Fire', marginX, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text('Calisthenics for India - train anywhere', marginX, y + 14);
  doc.text('hello@borntofire.in', marginX, y + 27);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(17, 24, 39);
  doc.text('INVOICE', pageWidth - marginX, y, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text(`No. ${input.invoiceNumber}`, pageWidth - marginX, y + 16, { align: 'right' });
  doc.text(
    `Date: ${input.invoiceDate.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}`,
    pageWidth - marginX,
    y + 29,
    { align: 'right' }
  );

  y += 56;
  doc.setDrawColor(229, 231, 235);
  doc.line(marginX, y, pageWidth - marginX, y);
  y += 28;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(107, 114, 128);
  doc.text('BILLED TO', marginX, y);
  y += 16;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(17, 24, 39);
  doc.text(input.billedToName, marginX, y);
  y += 15;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(75, 85, 99);
  if (input.billedToEmail) {
    doc.text(input.billedToEmail, marginX, y);
    y += 14;
  }
  if (input.memberId) {
    doc.text(`Member ID: ${input.memberId}`, marginX, y);
    y += 14;
  }

  y += 20;

  const tableLeft = marginX;
  const tableRight = pageWidth - marginX;
  doc.setFillColor(243, 244, 246);
  doc.rect(tableLeft, y, tableRight - tableLeft, 26, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(55, 65, 81);
  doc.text('DESCRIPTION', tableLeft + 10, y + 17);
  doc.text('AMOUNT', tableRight - 10, y + 17, { align: 'right' });
  y += 26;

  let total = 0;
  for (const item of input.items) {
    const rowStartY = y;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text(item.description, tableLeft + 10, y + 18);
    if (item.detail) {
      doc.setFontSize(9);
      doc.setTextColor(107, 114, 128);
      doc.text(item.detail, tableLeft + 10, y + 32);
    }
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(17, 24, 39);
    doc.text(formatInr(item.amount), tableRight - 10, y + 18, { align: 'right' });
    total += item.amount;

    const rowHeight = item.detail ? 44 : 30;
    doc.setDrawColor(243, 244, 246);
    doc.line(tableLeft, rowStartY + rowHeight, tableRight, rowStartY + rowHeight);
    y = rowStartY + rowHeight;
  }

  y += 18;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  doc.setTextColor(17, 24, 39);
  doc.text('Total', tableRight - 150, y);
  doc.text(formatInr(total), tableRight - 10, y, { align: 'right' });

  y += 30;
  if (input.paymentMethod) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(75, 85, 99);
    doc.text(`Payment method: ${input.paymentMethod}`, marginX, y);
  }

  const footerY = doc.internal.pageSize.getHeight() - 70;
  doc.setDrawColor(229, 231, 235);
  doc.line(marginX, footerY, tableRight, footerY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  const disclaimer = doc.splitTextToSize(
    'This invoice records the plan and payment method you selected with Born to Fire. Born to Fire does not process payments through a payment gateway on this site, so no real charge has been made against this document. Questions? Write to hello@borntofire.in.',
    tableRight - marginX
  );
  doc.text(disclaimer, marginX, footerY + 16);

  doc.save(`${input.invoiceNumber}.pdf`);
}
