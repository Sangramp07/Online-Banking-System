import PDFDocument from 'pdfkit';
import { prisma } from '../config/database.js';
import { AppError } from '../middleware/error.middleware.js';

export class StatementService {
  /**
   * Generate CSV Statement
   */
  static async generateCsv(
    accountId: string,
    customerId: string | null,
    startDate?: string,
    endDate?: string
  ): Promise<string> {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: { customer: true },
    });

    if (!account) {
      throw new AppError('Account not found.', 404);
    }

    if (customerId && account.customerId !== customerId) {
      throw new AppError('Unauthorized access to account statement.', 403);
    }

    const whereClause: any = { accountId };
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const entries = await prisma.transactionEntry.findMany({
      where: whereClause,
      include: { transfer: true },
      orderBy: { createdAt: 'desc' },
    });

    // CSV Header
    let csv =
      'Date,Reference,Type,Description,Amount,Balance After,Currency\n';

    for (const entry of entries) {
      const date = entry.createdAt.toISOString().split('T')[0];
      const ref = entry.transfer?.reference || 'N/A';
      const type = entry.type;
      const desc = `"${entry.description.replace(/"/g, '""')}"`;
      const amount = Number(entry.amount).toFixed(2);
      const balAfter = Number(entry.balanceAfter).toFixed(2);
      const curr = account.currency;

      csv += `${date},${ref},${type},${desc},${amount},${balAfter},${curr}\n`;
    }

    return csv;
  }

  /**
   * Generate PDF Statement Buffer
   */
  static async generatePdf(
    accountId: string,
    customerId: string | null,
    startDate?: string,
    endDate?: string
  ): Promise<Buffer> {
    const account = await prisma.account.findUnique({
      where: { id: accountId },
      include: { customer: true },
    });

    if (!account) {
      throw new AppError('Account not found.', 404);
    }

    if (customerId && account.customerId !== customerId) {
      throw new AppError('Unauthorized access to account statement.', 403);
    }

    const whereClause: any = { accountId };
    if (startDate || endDate) {
      whereClause.createdAt = {};
      if (startDate) whereClause.createdAt.gte = new Date(startDate);
      if (endDate) whereClause.createdAt.lte = new Date(endDate);
    }

    const entries = await prisma.transactionEntry.findMany({
      where: whereClause,
      include: { transfer: true },
      orderBy: { createdAt: 'desc' },
      take: 100, // limit PDF rows to recent 100 entries
    });

    return new Promise<Buffer>((resolve, reject) => {
      try {
        const doc = new PDFDocument({ margin: 40, size: 'A4' });
        const buffers: Buffer[] = [];

        doc.on('data', buffers.push.bind(buffers));
        doc.on('end', () => {
          const pdfData = Buffer.concat(buffers);
          resolve(pdfData);
        });

        // Header
        doc.fontSize(22).fillColor('#0f243d').text('NEXBANK', { align: 'left' });
        doc.fontSize(10).fillColor('#64748b').text('OFFICIAL ACCOUNT STATEMENT — SIMULATION', { align: 'left' });
        doc.moveDown(0.5);

        // Divider
        doc.strokeColor('#cbd5e1').lineWidth(1).moveTo(40, doc.y).lineTo(555, doc.y).stroke();
        doc.moveDown(1);

        // Customer & Account Details Table
        const startY = doc.y;
        doc.fontSize(10).fillColor('#334155');
        doc.text(`Account Holder: ${account.customer.fullName}`, 40, startY);
        doc.text(`Customer ID: ${account.customer.customerNumber}`, 40, startY + 15);
        doc.text(`Address: ${account.customer.address}`, 40, startY + 30);

        doc.text(`Account Number: ${account.accountNumber}`, 320, startY);
        doc.text(`Account Type: ${account.accountType}`, 320, startY + 15);
        doc.text(`Available Balance: $${Number(account.balance).toFixed(2)} ${account.currency}`, 320, startY + 30);
        doc.text(`Statement Date: ${new Date().toLocaleDateString()}`, 320, startY + 45);

        doc.moveDown(4.5);

        // Transaction Table Header
        const tableTop = doc.y + 10;
        doc.rect(40, tableTop, 515, 20).fill('#0f243d');
        doc.fontSize(9).fillColor('#ffffff');
        doc.text('Date', 45, tableTop + 5);
        doc.text('Reference', 115, tableTop + 5);
        doc.text('Description', 215, tableTop + 5);
        doc.text('Type', 360, tableTop + 5);
        doc.text('Amount', 415, tableTop + 5, { width: 60, align: 'right' });
        doc.text('Balance', 485, tableTop + 5, { width: 65, align: 'right' });

        let currentY = tableTop + 24;
        doc.fontSize(8).fillColor('#1e293b');

        for (const entry of entries) {
          if (currentY > 750) {
            doc.addPage();
            currentY = 40;
          }

          const dateStr = entry.createdAt.toISOString().split('T')[0];
          const refStr = entry.transfer?.reference || 'N/A';
          const descStr =
            entry.description.length > 30
              ? entry.description.substring(0, 28) + '...'
              : entry.description;

          doc.text(dateStr, 45, currentY);
          doc.text(refStr, 115, currentY);
          doc.text(descStr, 215, currentY);

          if (entry.type === 'CREDIT') {
            doc.fillColor('#059669').text('CREDIT', 360, currentY);
            doc.text(`+$${Number(entry.amount).toFixed(2)}`, 415, currentY, { width: 60, align: 'right' });
          } else {
            doc.fillColor('#dc2626').text('DEBIT', 360, currentY);
            doc.text(`-$${Number(entry.amount).toFixed(2)}`, 415, currentY, { width: 60, align: 'right' });
          }

          doc.fillColor('#1e293b').text(
            `$${Number(entry.balanceAfter).toFixed(2)}`,
            485,
            currentY,
            { width: 65, align: 'right' }
          );

          currentY += 18;
        }

        // Footer disclaimer
        doc.fontSize(8).fillColor('#94a3b8');
        doc.text(
          'Notice: This statement is generated for simulation and educational purposes only by NEXBANK. No real-world monetary funds are held or processed.',
          40,
          780,
          { align: 'center', width: 515 }
        );

        doc.end();
      } catch (err) {
        reject(err);
      }
    });
  }
}
