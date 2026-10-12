export type OrderStatusType = 'NEW' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';

export interface ProductItem {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  subtitle?: string | null;
  subtitleAr?: string | null;
  description: string;
  descriptionAr: string;
  howToUse?: string | null;
  howToUseAr?: string | null;
  ingredients?: string | null;
  ingredientsAr?: string | null;
  price: number;
  compareAtPrice?: number | null;
  sku: string;
  image: string;
  size?: string | null;
  category: string;
  categoryAr: string;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  isBundle?: boolean;
  bundleItems?: BundleComponent[];
  createdAt?: string | Date;
  updatedAt?: string | Date;
}

export interface BundleComponent {
  productId: string;
  quantity: number;
  product: {
    id: string;
    slug: string;
    name: string;
    nameAr: string;
    sku: string;
    image: string;
    stock: number;
    isActive: boolean;
    isBundle?: boolean;
  };
}

export interface BundleContentSnapshot {
  productId: string;
  productName: string;
  productNameAr: string;
  productSku: string;
  quantity: number;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  nameAr: string;
  price: number;
  image: string;
  sku: string;
  quantity: number;
  maxStock: number;
}

export interface OrderItemPayload {
  productId: string;
  quantity: number;
}

export interface CheckoutPayload {
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  city: string;
  address: string;
  notes?: string;
  items: OrderItemPayload[];
  idempotencyKey?: string;
  expectedSubtotal?: number;
  expectedShippingFee?: number;
}

export interface OrderSummaryItem {
  id: string;
  productId: string | null;
  productName: string;
  productNameAr: string | null;
  productSku: string | null;
  unitPrice: number;
  quantity: number;
  lineTotal: number;
  bundleContents?: BundleContentSnapshot[] | null;
}

export interface OrderDetail {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerEmail: string | null;
  city: string;
  address: string;
  notes: string | null;
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  status: OrderStatusType;
  paymentMethod: string;
  createdAt: string | Date;
  updatedAt: string | Date;
  items: OrderSummaryItem[];
}

export type AdminRole = 'SUPER_ADMIN' | 'ADMIN' | 'SUPPORT';

export type AdminPermission =
  | 'orders:read'
  | 'orders:update'
  | 'orders:export'
  | 'products:read'
  | 'products:write'
  | 'products:delete'
  | 'users:manage'
  | 'audit:read'
  | 'shipping:write';

export interface AdminUserSummary {
  id: string;
  username: string;
  email?: string | null;
  name: string;
  role: AdminRole;
  isActive: boolean;
  lastLoginAt?: string | Date | null;
  createdAt: string | Date;
}

export interface AdminAuditLogItem {
  id: string;
  adminId?: string | null;
  username: string;
  action: string;
  ipAddress?: string | null;
  details?: string | null;
  createdAt: string | Date;
}
