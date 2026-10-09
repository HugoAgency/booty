import { describe, it, expect } from 'vitest';
import { generateOrdersExcelWorkbook, OrderExportRecord } from '../src/lib/excel';
import ExcelJS from 'exceljs';

describe('Excel Generation Service (Jordan / JOD)', () => {
  it('generates a valid XLSX buffer with RTL orientation and Jordan JOD headers', async () => {
    const mockOrders: OrderExportRecord[] = [
      {
        orderNumber: 'TBR-20261009-TEST',
        createdAt: new Date('2026-10-09T10:30:00Z'),
        customerName: 'رنا المجالي',
        customerPhone: '+962791234567',
        customerEmail: 'rana@example.com',
        city: 'عمّان',
        address: 'دابوق - قرب مدرسة البكالوريا',
        items: [
          {
            productName: 'Lightening Intimate Gel',
            productNameAr: 'جل تفتيح المناطق الحساسة',
            productSku: 'TBR-LIG-060',
            quantity: 2,
            unitPrice: 35.0,
            lineTotal: 70.0,
          },
          {
            productName: 'Clarifying Booty Cleanser',
            productNameAr: 'غسول منقي ومقشر للبشرة',
            productSku: 'TBR-CBC-180',
            quantity: 1,
            unitPrice: 28.0,
            lineTotal: 28.0,
          },
        ],
        totalAmount: 98.0,
        notes: 'يرجى التوصيل بعد الظهر',
        status: 'NEW',
      },
    ];

    const buffer = await generateOrdersExcelWorkbook(mockOrders);
    expect(buffer).toBeDefined();
    expect(buffer.length).toBeGreaterThan(1000);

    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer);

    const sheet = workbook.getWorksheet(1);
    expect(sheet).toBeDefined();
    expect(sheet?.name).toContain('طلبات الأردن');
    expect(sheet?.views[0]?.rightToLeft).toBe(true);
    expect(sheet?.rowCount).toBe(2);

    const headerRow = sheet?.getRow(1);
    expect(headerRow?.getCell(1).value).toContain('رقم الطلب');
    expect(headerRow?.getCell(13).value).toContain('JOD');

    const dataRow = sheet?.getRow(2);
    expect(dataRow?.getCell(1).value).toBe('TBR-20261009-TEST');
    expect(dataRow?.getCell(3).value).toBe('رنا المجالي');
    expect(dataRow?.getCell(13).value).toBe(98.0);
  });
});
