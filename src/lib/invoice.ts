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

// Loads public/logo.png as a base64 data URL jsPDF's addImage() can embed,
// plus its natural pixel dimensions so it's drawn at the right aspect ratio
// instead of stretched into a square.
async function loadLogoForPdf(): Promise<{ dataUrl: string; width: number; height: number } | null> {
  try {
    const res = await fetch(`${import.meta.env.BASE_URL}logo.png`);
    const blob = await res.blob();
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(blob);
    });
    const { width, height } = await new Promise<{ width: number; height: number }>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight });
      img.onerror = () => reject(new Error('Could not read logo dimensions.'));
      img.src = dataUrl;
    });
    return { dataUrl, width, height };
  } catch {
    // Offline, blocked request, etc. — invoice still generates, just without the logo.
    return null;
  }
}

export async function downloadInvoicePdf(input: InvoiceInput): Promise<void> {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const pageWidth = doc.internal.pageSize.getWidth();
  const marginX = 48;
  let y = 56;

  const logo = await loadLogoForPdf();
  let textX = marginX;
  if (logo) {
    const logoHeight = 74;
    const logoWidth = logoHeight * (logo.width / logo.height);
    doc.addImage(logo.dataUrl, 'PNG', marginX, y - 40, logoWidth, logoHeight);
    textX = marginX + logoWidth + 14;
  }

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.setTextColor(17, 24, 39);
  doc.text('Born to Fire', textX, y);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text('Calisthenics for India - train anywhere', textX, y + 14);
  doc.text('hello@borntofire.in', textX, y + 27);
  // Placeholder until Born to Fire actually registers for GST — kept as a
  // fixed string here rather than an InvoiceInput field since it's a
  // business-level detail, not something that varies per invoice.
  doc.text('GSTIN: XXXXXXXXXX', textX, y + 40);

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
    y += 20;
  }

  y += 20;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(107, 114, 128);
  doc.text('TERMS & GUIDELINES', marginX, y);
  y += 16;

  const terms = [
    'This invoice is a record of the plan and payment method you selected, not a payment receipt - Born to Fire does not process real payments through a gateway on this site.',
    'No refund applies to this document, since no charge was made against it.',
    "To change your plan, cancel your current one from your Profile or Membership page and rejoin - there's no direct switch flow.",
    'Full Terms & Conditions and Privacy Policy are available at borntofire.in. For any questions, write to hello@borntofire.in.',
  ];
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(107, 114, 128);
  for (const term of terms) {
    const lines = doc.splitTextToSize(`- ${term}`, tableRight - marginX);
    doc.text(lines, marginX, y);
    y += lines.length * 11 + 4;
  }

  // Defaults to the fixed near-bottom position for a typical short invoice,
  // but never overlaps the terms block above it if that content ever grows
  // (more line items, longer terms text) past where the fixed position sits.
  const footerY = Math.max(doc.internal.pageSize.getHeight() - 70, y + 20);
  doc.setDrawColor(229, 231, 235);
  doc.line(marginX, footerY, tableRight, footerY);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(156, 163, 175);
  doc.text('Thank you for training with Born to Fire.', marginX, footerY + 16);

  doc.save(`${input.invoiceNumber}.pdf`);
}
