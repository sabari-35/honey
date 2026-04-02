import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

/**
 * Generates an ultra-premium PDF invoice for a given order.
 * Follows the 'Honey Hub' aesthetic with gold accents, sleek dark headers, 
 * and professional layout for production readiness.
 */
export const generateInvoice = async (order: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.width;
  const pageHeight = doc.internal.pageSize.height;

  // Custom Currency Formatter for PDF (manual to avoid character issues in jsPDF)
  const formatPDFCurrency = (amt: number) => `Rs. ${new Intl.NumberFormat('en-IN').format(amt)}`;

  // --- Background Design ---
  // Subtle side border in gold
  doc.setFillColor(212, 175, 55, 0.1);
  doc.rect(0, 0, 5, pageHeight, 'F');

  // --- Header Block (The "Vault" Aesthetic) ---
  doc.setFillColor(15, 15, 18); // Obsidian Deep
  doc.rect(5, 0, pageWidth - 5, 60, 'F');
  
  // Gold Accent Line below header
  doc.setFillColor(212, 175, 55);
  doc.rect(5, 60, pageWidth - 5, 2, 'F');
  
  // Branding
  doc.setTextColor(212, 175, 55);
  doc.setFont('times', 'bold');
  doc.setFontSize(32);
  doc.text('HONEY HUB', 25, 35);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(150, 150, 150);
  doc.text('RAW COLLECTION • LIQUID GOLD IN THE DARK', 25, 45);
  
  // Invoice Label
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.text('INVOICE', pageWidth - 25, 35, { align: 'right' });
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(212, 175, 55);
  doc.text(order.order_number, pageWidth - 25, 45, { align: 'right' });

  // --- Customer & Order Context ---
  const metadataY = 80;
  
  // Bill To Section (Left)
  doc.setTextColor(212, 175, 55);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RECIPIENT INTEL', 25, metadataY);
  
  doc.setTextColor(40, 40, 40);
  doc.setFontSize(12);
  doc.text(order.shipping_address?.full_name || 'Anonymous', 25, metadataY + 8);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(100, 100, 100);
  doc.text([
    `Phone: ${order.shipping_address?.phone || 'N/A'}`,
    '',
    'Delivery Coordinates:',
    ...(doc.splitTextToSize(order.shipping_address?.label || 'Direct Collection', 80))
  ], 25, metadataY + 16);

  // Order Info (Right)
  doc.setTextColor(212, 175, 55);
  doc.setFont('helvetica', 'bold');
  doc.text('TRANSACTION LOG', pageWidth - 100, metadataY);
  
  doc.setTextColor(40, 40, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  const orderDetails = [
    `Timestamp: ${new Date(order.created_at).toLocaleString()}`,
    `Status: ${order.status.toUpperCase()}`,
    `Gateway: ${order.payment_status.toUpperCase()}`,
    `Security: VAULT-SECURED-E2E`
  ];
  doc.text(orderDetails, pageWidth - 100, metadataY + 8);

  // --- Purchase Manifest (Table) ---
  const tableRows = (order.order_items || []).map((item: any) => [
    item.product_snapshot?.name || 'Pure Extracted Honey',
    item.quantity.toString(),
    formatPDFCurrency(Number(item.unit_price)),
    formatPDFCurrency(Number(item.total_price))
  ]);

  (doc as any).autoTable({
    startY: 135,
    head: [['Extract Manifest', 'Qty', 'Unit Yield', 'Total Yield']],
    body: tableRows,
    theme: 'grid',
    headStyles: { 
      fillColor: [15, 15, 18], 
      textColor: [212, 175, 55], 
      fontStyle: 'bold',
      fontSize: 10,
      halign: 'left'
    },
    styles: {
      fontSize: 9,
      cellPadding: 6,
      lineColor: [230, 230, 230],
      lineWidth: 0.1,
    },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'right' },
      3: { halign: 'right', fontStyle: 'bold' }
    },
    margin: { left: 25, right: 25 },
  });

  const finalY = (doc as any).lastAutoTable.finalY + 15;

  // --- Financial Summary ---
  const summaryX = pageWidth - 100;
  
  // Summary Background
  doc.setFillColor(250, 250, 250);
  doc.rect(summaryX - 5, finalY - 5, 80, 45, 'F');
  
  doc.setTextColor(120, 120, 120);
  doc.setFontSize(9);
  doc.text('Manifest Subtotal:', summaryX, finalY + 5);
  doc.text(formatPDFCurrency(Number(order.subtotal)), pageWidth - 25, finalY + 5, { align: 'right' });
  
  doc.text('Logistics (Shipping):', summaryX, finalY + 15);
  doc.text(formatPDFCurrency(Number(order.shipping_amount)), pageWidth - 25, finalY + 15, { align: 'right' });
  
  // Total Value
  doc.setFillColor(212, 175, 55);
  doc.rect(summaryX - 5, finalY + 22, 80, 12, 'F');
  
  doc.setTextColor(15, 15, 18);
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL VALUE:', summaryX, finalY + 30);
  doc.text(formatPDFCurrency(Number(order.total_amount)), pageWidth - 25, finalY + 30, { align: 'right' });

  // --- Security Seal & Footer ---
  // Subtle watermark
  doc.setTextColor(240, 240, 240);
  doc.setFontSize(40);
  doc.setFont('times', 'bold');
  doc.text('VAULT CERTIFIED', pageWidth / 2, 220, { align: 'center', angle: 45, opacity: 0.1 } as any);

  doc.setFontSize(8);
  doc.setTextColor(180, 180, 180);
  doc.setFont('helvetica', 'italic');
  doc.text([
    'This is a digitally generated vault certificate. No physical signature required.',
    'Thank you for preserving the Raw Collection. Guard your nectar carefully.'
  ], pageWidth / 2, pageHeight - 20, { align: 'center' });

  // Save PDF
  doc.save(`HoneyHub_Vault_${order.order_number}.pdf`);
};
