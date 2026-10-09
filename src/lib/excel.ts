import ExcelJS from 'exceljs';

export interface OrderExportRecord {
  orderNumber: string;
  createdAt: Date;
  customerName: string;
  customerPhone: string;
  customerEmail?: string | null;
  city: string;
  address: string;
  items: Array<{
    productName: string;
    productNameAr?: string | null;
    productSku?: string | null;
    quantity: number;
    unitPrice: number;
    lineTotal: number;
  }>;
  totalAmount: number;
  notes?: string | null;
  status: string;
}

export async function generateOrdersExcelWorkbook(orders: OrderExportRecord[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'THE BOOTY REPUBLIC Jordan';
  workbook.lastModifiedBy = 'THE BOOTY REPUBLIC Admin';
  workbook.created = new Date();
  workbook.modified = new Date();

  const worksheet = workbook.addWorksheet('طلبات الأردن - Jordan Orders', {
    views: [{ state: 'normal', rightToLeft: true }],
    pageSetup: { paperSize: 9, orientation: 'landscape' },
  });

  // Define Columns
  worksheet.columns = [
    { header: 'رقم الطلب / Order ID', key: 'orderId', width: 22 },
    { header: 'تاريخ وتوقيت الطلب / Order Date', key: 'orderDate', width: 22 },
    { header: 'اسم العميل / Customer Name', key: 'customerName', width: 25 },
    { header: 'رقم الهاتف / Phone Number', key: 'customerPhone', width: 18 },
    { header: 'البريد الإلكتروني / Email', key: 'customerEmail', width: 25 },
    { header: 'المدينة / المحافظة / City', key: 'city', width: 18 },
    { header: 'عنوان التوصيل / Delivery Address', key: 'address', width: 35 },
    { header: 'المنتجات / Product Names', key: 'productNames', width: 35 },
    { header: 'أكواد المنتجات / SKUs', key: 'productSkus', width: 22 },
    { header: 'الكميات / Quantities', key: 'quantities', width: 15 },
    { header: 'أسعار الوحدة (د.أ) / Unit Prices', key: 'unitPrices', width: 20 },
    { header: 'إجمالي الأصناف (د.أ) / Line Totals', key: 'lineTotals', width: 20 },
    { header: 'إجمالي الطلب / Order Total (JOD)', key: 'orderTotal', width: 22 },
    { header: 'ملاحظات العميل / Customer Notes', key: 'notes', width: 30 },
    { header: 'حالة الطلب / Order Status', key: 'status', width: 18 },
  ];

  // Header row style (Brand Rose/Pink #FF7B98)
  const headerRow = worksheet.getRow(1);
  headerRow.height = 30;
  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFFF7B98' },
    };
    cell.font = {
      name: 'Arial',
      size: 11,
      bold: true,
      color: { argb: 'FFFFFFFF' },
    };
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'center',
      wrapText: true,
    };
    cell.border = {
      top: { style: 'thin', color: { argb: 'FFE06080' } },
      left: { style: 'thin', color: { argb: 'FFE06080' } },
      bottom: { style: 'medium', color: { argb: 'FFE06080' } },
      right: { style: 'thin', color: { argb: 'FFE06080' } },
    };
  });

  // Status localization
  const statusTranslations: Record<string, string> = {
    NEW: 'جديد / New',
    PROCESSING: 'قيد التنفيذ / Processing',
    COMPLETED: 'مكتمل / Completed',
    CANCELLED: 'ملغي / Cancelled',
  };

  // Populate data
  orders.forEach((order, index) => {
    const productNamesStr = order.items
      .map((it) => it.productNameAr ? `${it.productNameAr} (${it.productName})` : it.productName)
      .join('\n');

    const productSkusStr = order.items
      .map((it) => it.productSku || '-')
      .join('\n');

    const productQuantitiesStr = order.items
      .map((it) => it.quantity.toString())
      .join('\n');

    const unitPricesStr = order.items
      .map((it) => `${it.unitPrice.toFixed(2)} JOD`)
      .join('\n');

    const lineTotalsStr = order.items
      .map((it) => `${it.lineTotal.toFixed(2)} JOD`)
      .join('\n');

    const formattedDate = new Intl.DateTimeFormat('ar-JO', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    }).format(new Date(order.createdAt));

    const row = worksheet.addRow({
      orderId: order.orderNumber,
      orderDate: formattedDate,
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerEmail: order.customerEmail || '-',
      city: order.city,
      address: order.address,
      productNames: productNamesStr,
      productSkus: productSkusStr,
      quantities: productQuantitiesStr,
      unitPrices: unitPricesStr,
      lineTotals: lineTotalsStr,
      orderTotal: Number(order.totalAmount.toFixed(2)),
      notes: order.notes || '-',
      status: statusTranslations[order.status] || order.status,
    });

    const isEven = index % 2 === 0;
    row.height = Math.max(26, order.items.length * 18);

    row.eachCell((cell, colNumber) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: isEven ? 'FFFFFFFF' : 'FFFFF5F7' },
      };
      cell.font = {
        name: 'Arial',
        size: 10,
        color: { argb: 'FF2A1820' },
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        bottom: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        left: { style: 'thin', color: { argb: 'FFE5E7EB' } },
        right: { style: 'thin', color: { argb: 'FFE5E7EB' } },
      };

      // Alignment
      if (colNumber === 1 || colNumber === 2 || colNumber === 4 || colNumber === 15) {
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      } else if (colNumber === 13) {
        cell.alignment = { vertical: 'middle', horizontal: 'right', wrapText: true };
        cell.numFmt = '#,##0.00 "JOD"';
      } else {
        cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
      }
    });
  });

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
