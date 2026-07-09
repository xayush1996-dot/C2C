import PDFDocument from 'pdfkit';

/**
 * Helper to generate structured tabular PDF reports and stream them directly to HTTP response.
 * @param {Object} res Express Response object
 * @param {Object} options Report options
 * @param {string} options.title Title of the report
 * @param {string} options.dateRange Date range label (e.g. "2026-07-01 to 2026-07-10")
 * @param {Array<Object>} options.data Array of raw records
 * @param {Array<Object>} options.columns Column configurations: { header: string, width: number, x: number, valueGetter: function }
 * @param {string} [options.summaryText] Optional additional summary text on top
 */
export const generatePdfReport = (res, options) => {
  const { title, dateRange, data, columns, summaryText } = options;

  const doc = new PDFDocument({
    margin: 50,
    size: 'A4',
    bufferPages: true
  });

  // Pipe to response stream
  doc.pipe(res);

  // 1. Report Title
  doc.fontSize(20).font('Helvetica-Bold').fillColor('#1a1a1a').text(title, 50, 50);
  
  // 2. Metadata Section
  doc.fontSize(10).font('Helvetica').fillColor('#555555');
  doc.text(`Generated On: ${new Date().toLocaleString()}`, 50, 80);
  doc.text(`Date Range: ${dateRange}`, 50, 95);
  doc.text(`Total Records: ${data.length}`, 50, 110);
  
  if (summaryText) {
    doc.text(summaryText, 50, 125);
  }

  // Draw separation line
  doc.moveTo(50, 140).lineTo(545, 140).strokeColor('#cccccc').stroke();

  const startY = 160;
  let currentY = startY;

  // Draw Table Headers
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a1a1a');
  columns.forEach(col => {
    doc.text(col.header, col.x, currentY);
  });

  // Header bottom border
  doc.moveTo(50, currentY + 15).lineTo(545, currentY + 15).strokeColor('#a0a0a0').stroke();
  currentY += 25;

  // Draw Rows
  doc.fontSize(8).font('Helvetica').fillColor('#333333');

  data.forEach(row => {
    // If we are reaching the bottom margin, add a new page
    if (currentY > 750) {
      doc.addPage();
      currentY = 50;

      // Draw Headers again on new page
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a1a1a');
      columns.forEach(col => {
        doc.text(col.header, col.x, currentY);
      });
      doc.moveTo(50, currentY + 15).lineTo(545, currentY + 15).strokeColor('#a0a0a0').stroke();
      currentY += 25;
      
      // Reset font size/color for rows
      doc.fontSize(8).font('Helvetica').fillColor('#333333');
    }

    columns.forEach(col => {
      const val = col.valueGetter(row) || '';
      // Ensure single line / short text truncates or fits within width without overlap
      doc.text(val.toString(), col.x, currentY, { width: col.width, lineBreak: false });
    });

    // Row border line
    doc.moveTo(50, currentY + 12).lineTo(545, currentY + 12).strokeColor('#f0f0f0').stroke();
    currentY += 18;
  });

  // Add Page Numbers Footer
  const range = doc.bufferedPageRange();
  for (let i = range.start; i < range.start + range.count; i++) {
    doc.switchToPage(i);
    doc.fontSize(8).font('Helvetica').fillColor('#999999');
    doc.text(
      `Page ${i + 1} of ${range.count}`,
      50,
      800,
      { align: 'center', width: 495 }
    );
  }

  // End stream
  doc.end();
};

/**
 * Compiles a structured receipt invoice PDF in memory as a binary Buffer.
 * @param {Object} payment - Populated Payment model document
 * @returns {Promise<Buffer>} Raw PDF file binary buffer
 */
export const generateInvoicePdfBuffer = (payment) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));

      // Title
      doc.fontSize(20).font('Helvetica-Bold').fillColor('#c5a880').text('INVOICE', 50, 50);
      
      // Business details
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a1a1a').text('Confusion to Clarity Mentorship', 350, 50, { align: 'right' });
      doc.font('Helvetica').fillColor('#555555');
      doc.text('Email: support@c2c.com', 350, 65, { align: 'right' });
      doc.text('Website: con2c.vercel.app', 350, 80, { align: 'right' });
      
      doc.moveTo(50, 105).lineTo(545, 105).strokeColor('#cccccc').stroke();

      // Invoice Details
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a1a1a').text('Bill To:', 50, 125);
      doc.font('Helvetica').fillColor('#555555');
      doc.text(`Name: ${payment.user?.name || 'Customer'}`, 50, 140);
      doc.text(`Email: ${payment.user?.email || 'N/A'}`, 50, 155);

      doc.font('Helvetica-Bold').fillColor('#1a1a1a').text('Invoice Metadata:', 300, 125);
      doc.font('Helvetica').fillColor('#555555');
      doc.text(`Invoice No: INV-${payment._id.toString().substring(18).toUpperCase()}`, 300, 140);
      doc.text(`Date: ${new Date(payment.paidAt || payment.updatedAt).toLocaleDateString()}`, 300, 155);
      doc.text(`Razorpay Payment ID: ${payment.razorpayPaymentId || 'N/A'}`, 300, 170);

      doc.moveTo(50, 195).lineTo(545, 195).strokeColor('#cccccc').stroke();

      // Table Headers
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a1a1a');
      doc.text('Description', 50, 215);
      doc.text('Amount', 450, 215, { width: 95, align: 'right' });

      doc.moveTo(50, 230).lineTo(545, 230).strokeColor('#a0a0a0').stroke();

      // Row Detail
      const serviceName = payment.booking?.service?.name || 'Coaching Service Setup fee';
      const amountInINR = (payment.amount / 100).toFixed(2);
      
      doc.fontSize(9).font('Helvetica').fillColor('#333333');
      doc.text(serviceName, 50, 245, { width: 350 });
      doc.text(`INR ${amountInINR}`, 450, 245, { width: 95, align: 'right' });

      doc.moveTo(50, 270).lineTo(545, 270).strokeColor('#f0f0f0').stroke();

      // Summary Total
      doc.fontSize(10).font('Helvetica-Bold').fillColor('#1a1a1a');
      doc.text('Total Amount Paid:', 300, 290);
      doc.text(`INR ${amountInINR}`, 450, 290, { width: 95, align: 'right' });

      // Footer
      doc.fontSize(8).font('Helvetica').fillColor('#999999');
      doc.text('Thank you for choosing Confusion to Clarity Mentorship. We look forward to our session.', 50, 750, { align: 'center', width: 495 });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};
