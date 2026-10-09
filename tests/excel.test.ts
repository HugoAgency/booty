import { describe, it, expect } from 'vitest';
import { generateOrdersExcelWorkbook, OrderExportRecord } from '../src/lib/excel';
import ExcelJS from 'exceljs';

describe('Excel Generation Service', () => {
  it('generates a valid XLSX buffer with RTL orientation and Arabic headers', async () => {
    const mockOrders: OrderExportRecord[] = [
      {
        orderNumber: 'TBR-20261009-TEST',
        createdAt: new Date('2026-10-09T10:30:00Z'),
        customerName: 'ريما العتيبي',
        customerPhone: '+966509876543',
        customerEmail: 'reema@example.com',
        city: 'الرياض',
        address: 'حي الملقا - شارع وادي حنيفة',
        items: [
          {
            productName: 'Lightening Intimate Gel',
            productNameAr: 'جل تفتيح المناطق الحساسة',
            productSku: 'TBR-LIG-060',
            quantity: 2,
            unitPrice: 180.0,
            lineTotal: 360.0,
          },
          {
            productName: 'Clarifying Booty Cleanser',
            productNameAr: 'غسول منقي ومقشر للبشرة',
            productSku: 'TBR-CBC-180',
            quantity: 1,
            unitPrice: 145.0,
            lineTotal: 145.0,
          },
        ],
        totalAmount: 505.0,
        notes: 'يرجى التوصيل بعد العصر',
        status: 'NEW',
      },
    ];

    const buffer = await generateOrdersExcelWorkbook(mockOrders);
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(1000);

    // Verify it can be loaded back by ExcelJS
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.getWorksheet(1);
    expect(sheet).toBeDefined();
    expect(sheet?.name).toBe('طلبات العملاء - Orders');
    expect(sheet?.views[0]?.rightToLeft).toBe(true);
    expect(sheet?.rowCount).toBe(2); // 1 header + 1 data row

    // Verify cell contents
    const headerRow = sheet?.getRow(1);
    expect(headerRow?.getCell(1).value).toContain('رقم الطلب');
    expect(headerRow?.getCell(13).value).toContain('إجمالي الطلب');

    const dataRow = sheet?.getRow(2);
    expect(dataRow?.getCell(1).value).toBe('TBR-20261009-TEST');
    expect(dataRow?.getCell(3).value).toBe('ريما العتيبي');
    expect(dataRow?.getCell(13).value).toBe(505.0);
  });
});
