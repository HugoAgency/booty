import { BundleComponent, BundleContentSnapshot, OrderItemPayload } from '@/types';

export interface StockProduct {
  stock: number;
  isBundle?: boolean;
  bundleItems?: BundleComponent[];
}

/** A bundle has no separate inventory: its limiting component owns availability. */
export function getAvailableStock(product: StockProduct): number {
  if (!product.isBundle) return product.stock;
  const components = product.bundleItems || [];
  if (components.length < 2) return 0;
  return Math.min(...components.map(({ product: component, quantity }) =>
    !component.isActive || component.isBundle || !Number.isInteger(quantity) || quantity < 1
      ? 0 : Math.floor(component.stock / quantity)
  ));
}

export function withAvailableStock<T extends StockProduct>(product: T): T {
  return { ...product, stock: getAvailableStock(product) };
}

export interface OrderProduct extends StockProduct {
  id: string;
  name: string;
  nameAr: string;
  sku: string;
  price: number;
}

export function calculateOrderItems(items: OrderItemPayload[], products: OrderProduct[]) {
  const quantities = new Map<string, number>();
  for (const item of items) {
    const quantity = (quantities.get(item.productId) || 0) + item.quantity;
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > 50) {
      throw new Error('الحد الأقصى 50 قطعة لكل سلعة في الطلب');
    }
    quantities.set(item.productId, quantity);
  }
  const productMap = new Map(products.map(product => [product.id, product]));
  const inventory = new Map<string, { quantity: number; name: string; stock: number }>();
  const reserve = (id: string, quantity: number, name: string, stock: number) => {
    inventory.set(id, { quantity: (inventory.get(id)?.quantity || 0) + quantity, name, stock });
  };
  const lineItems = Array.from(quantities).map(([id, quantity]) => {
    const product = productMap.get(id);
    if (!product) throw new Error('بعض المنتجات غير متوفرة أو لم يتم العثور عليها');
    if (!Number.isFinite(product.price) || product.price <= 0) throw new Error('سعر المنتج غير صالح؛ تعذر تأكيد الطلب');
    if (getAvailableStock(product) < quantity) {
      throw new Error(`الكمية المطلوبة من "${product.nameAr || product.name}" غير متوفرة في المخزون`);
    }
    const bundleContents: BundleContentSnapshot[] = [];
    if (product.isBundle) {
      for (const component of product.bundleItems || []) {
        reserve(component.productId, quantity * component.quantity, component.product.nameAr, component.product.stock);
        bundleContents.push({
          productId: component.productId,
          productName: component.product.name,
          productNameAr: component.product.nameAr,
          productSku: component.product.sku,
          quantity: component.quantity,
        });
      }
    } else {
      reserve(id, quantity, product.nameAr || product.name, product.stock);
    }
    return {
      productId: id, productName: product.name, productNameAr: product.nameAr,
      productSku: product.sku, unitPrice: product.price, quantity,
      lineTotal: Number((product.price * quantity).toFixed(2)),
      ...(product.isBundle ? { bundleContents } : {}),
    };
  });
  for (const item of Array.from(inventory.values())) {
    if (item.quantity > item.stock) {
      throw new Error(`المخزون غير كافٍ للمنتج "${item.name}" ضمن المنتجات والبكجات المختارة`);
    }
  }
  return {
    lineItems, inventory,
    subtotal: Number(lineItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2)),
  };
}

/** Decode historical snapshots without depending on the current catalog. */
export function readBundleContents(value: unknown): BundleContentSnapshot[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is BundleContentSnapshot => item !== null && typeof item === 'object'
    && typeof item.productId === 'string' && typeof item.productName === 'string'
    && typeof item.productNameAr === 'string' && typeof item.productSku === 'string'
    && Number.isInteger(item.quantity) && item.quantity > 0);
}
