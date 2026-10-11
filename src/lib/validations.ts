import { z } from 'zod';

export const CheckoutItemSchema = z.object({
  productId: z.string().min(1, 'معرّف المنتج مطلوب / Product ID is required'),
  quantity: z
    .number()
    .int('الكمية يجب أن تكون عدداً صحيحاً / Quantity must be integer')
    .min(1, 'الكمية يجب أن تكون 1 على الأقل / Quantity must be at least 1')
    .max(50, 'الحد الأقصى للطلب هو 50 قطعة لكل منتج / Maximum 50 units per item'),
});

export const CheckoutPayloadSchema = z.object({
  customerName: z
    .string()
    .trim()
    .min(2, 'الاسم يجب أن يحتوي على حرفين على الأقل / Name must have at least 2 characters')
    .max(100, 'الاسم طويل جداً / Name is too long'),
  customerPhone: z
    .string()
    .trim()
    .min(8, 'رقم الهاتف غير صالح / Phone number must be at least 8 digits')
    .max(20, 'رقم الهاتف طويل جداً / Phone number is too long')
    .regex(/^[+]?[0-9\s\-()]{8,20}$/, 'صيغة رقم الهاتف غير صحيحة / Invalid phone format'),
  customerEmail: z
    .string()
    .trim()
    .email('البريد الإلكتروني غير صالح / Invalid email address')
    .optional()
    .or(z.literal('')),
  city: z
    .string()
    .trim()
    .min(2, 'يرجى تحديد المدينة / City is required')
    .max(80, 'اسم المدينة طويل جداً / City is too long'),
  address: z
    .string()
    .trim()
    .min(5, 'يرجى كتابة العنوان بالتفصيل / Address must be at least 5 characters')
    .max(300, 'العنوان طويل جداً / Address is too long'),
  notes: z
    .string()
    .trim()
    .max(500, 'الملاحظات يجب ألا تتجاوز 500 حرف / Notes must not exceed 500 characters')
    .optional()
    .or(z.literal('')),
  items: z
    .array(CheckoutItemSchema)
    .min(1, 'سلة المشتريات فارغة / Shopping cart is empty'),
  idempotencyKey: z.string().optional(),
});

export const AdminLoginSchema = z.object({
  username: z.string().trim().min(3, 'اسم المستخدم مطلوب / Username required'),
  password: z.string().min(6, 'كلمة المرور مطلوبة / Password required'),
});

export const ProductInputSchema = z.object({
  name: z.string().trim().min(2, 'Name is required'),
  nameAr: z.string().trim().min(2, 'Arabic name is required'),
  subtitle: z.string().trim().optional(),
  subtitleAr: z.string().trim().optional(),
  description: z.string().trim().min(5, 'Description is required'),
  descriptionAr: z.string().trim().min(5, 'Arabic description is required'),
  price: z.number().positive('Price must be greater than 0'),
  compareAtPrice: z.number().positive().optional().nullable(),
  sku: z.string().trim().min(2, 'SKU is required'),
  image: z.string().trim().min(1, 'Image path or URL is required'),
  size: z.string().trim().optional(),
  category: z.string().trim().min(2, 'Category is required'),
  categoryAr: z.string().trim().min(2, 'Arabic category is required'),
  stock: z.number().int().min(0, 'Stock cannot be negative'),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

export const ChangePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, 'كلمة المرور الحالية مطلوبة / Current password required'),
    newPassword: z
      .string()
      .min(8, 'كلمة المرور الجديدة يجب أن تكون 8 أحرف على الأقل / Minimum 8 characters')
      .max(100, 'كلمة المرور طويلة جداً / Password too long')
      .regex(
        /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/,
        'يجب أن تحتوي كلمة المرور على أحرف كبيرة وصغيرة وأرقام / Must include uppercase, lowercase, and numbers'
      ),
    confirmPassword: z.string().min(1, 'يرجى تأكيد كلمة المرور الجديدة / Confirm password required'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: 'كلمتا المرور غير متطابقتين / Passwords do not match',
    path: ['confirmPassword'],
  });

export const CreateAdminUserSchema = z.object({
  username: z
    .string()
    .trim()
    .min(3, 'اسم المستخدم يجب أن يكون 3 أحرف على الأقل / Min 3 characters')
    .max(50, 'اسم المستخدم طويل جداً / Max 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'اسم المستخدم يجب أن يحتوي على أحرف وأرقام فقط / Letters and numbers only'),
  name: z.string().trim().min(2, 'الاسم مطلوب / Full name required'),
  email: z.string().trim().email('صيغة البريد الإلكتروني غير صحيحة / Invalid email').optional().or(z.literal('')),
  password: z
    .string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل / Minimum 8 characters')
    .max(100),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'SUPPORT'], {
    errorMap: () => ({ message: 'الدور المحدد غير صالح / Invalid role' }),
  }),
});

export const UpdateAdminUserSchema = z.object({
  name: z.string().trim().min(2, 'الاسم مطلوب / Full name required').optional(),
  email: z.string().trim().email('صيغة البريد الإلكتروني غير صحيحة / Invalid email').optional().or(z.literal('')),
  role: z.enum(['SUPER_ADMIN', 'ADMIN', 'SUPPORT']).optional(),
  isActive: z.boolean().optional(),
  password: z
    .string()
    .min(8, 'كلمة المرور يجب أن تكون 8 أحرف على الأقل / Minimum 8 characters')
    .optional(),
});

export const ShippingConfigSchema = z.object({
  isFreeShippingPromo: z.boolean().default(false),
  freeShippingThreshold: z.number().min(0, 'الحد الأدنى لا يمكن أن يكون سالباً / Threshold cannot be negative'),
  standardFee: z.number().min(0, 'الرسوم لا يمكن أن تكون سالبة / Standard fee cannot be negative'),
  ammanFee: z.number().min(0, 'رسوم عمّان لا يمكن أن تكون سالبة / Amman fee cannot be negative'),
  outerGovernoratesFee: z.number().min(0, 'رسوم المحافظات لا يمكن أن تكون سالبة / Outer fee cannot be negative'),
  estimatedDeliveryTime: z.string().trim().min(2, 'مدة التوصيل مطلوبة / Delivery time required').max(100),
});


