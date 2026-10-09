import { prisma } from './prisma';
import { ProductItem } from '@/types';

export const FALLBACK_PRODUCTS: ProductItem[] = [
  {
    id: 'prod-lightening-intimate-gel',
    slug: 'lightening-intimate-gel',
    name: 'Lightening Intimate Gel',
    nameAr: 'جل تفتيح المناطق الحساسة',
    subtitle: 'Advanced brightening & color correcting',
    subtitleAr: 'تفتيح متطور وتوحيد متقن للون البشرة',
    description: 'An advanced, ultra-gentle brightening formula crafted specifically for delicate areas. Infused with natural botanical extracts, niacinamide, and soothing antioxidants to effectively diminish dark spots, correct hyperpigmentation, and restore natural skin luminosity without irritation.',
    descriptionAr: 'تركيبة متطورة وفائقة اللطف مصممة خصيصاً للمناطق الحساسة. غنية بمستخلصات نباتية طبيعية والنياسيناميد ومضادات الأكسدة المهدئة لتقليل التصبغات والبقع الداكنة وتوحيد لون البشرة واستعادة إشراقتها الطبيعية بكل أمان.',
    price: 180.0,
    compareAtPrice: 220.0,
    sku: 'TBR-LIG-060',
    image: '/images/lightening-intimate-gel.jpg',
    size: '60ml | 2.0 fl. oz.',
    category: 'Intimate Care',
    categoryAr: 'العناية بالمناطق الحساسة',
    stock: 75,
    isActive: true,
    isFeatured: true,
  },
  {
    id: 'prod-clarifying-booty-cleanser',
    slug: 'clarifying-booty-cleanser',
    name: 'Clarifying Booty Cleanser',
    nameAr: 'غسول منقي ومقشر للبشرة',
    subtitle: 'Pore refining & skin perfecting',
    subtitleAr: 'تنقية المسام وصقل ملمس البشرة بعمق',
    description: 'A targeted purifying cleanser designed to eliminate friction bumps, clear congested pores, and gently exfoliate rough patches. Formulated with gentle AHAs/BHAs and tea tree water to leave your skin feeling remarkably clean, smooth, and refreshed.',
    descriptionAr: 'غسول علاجي فاخر ومنقي للمسام مصمم للتخلص من الحبوب والبثور الناتجة عن الاحتكاك، وتنقية المسام المسدودة وتقشير خلايا الجلد الميتة بلطف، ليمنح البشرة نعومة فائقة ونقاءً منعشاً.',
    price: 145.0,
    compareAtPrice: 175.0,
    sku: 'TBR-CBC-180',
    image: '/images/clarifying-booty-cleanser.jpg',
    size: '180mL | 6.08 fl. oz.',
    category: 'Cleansers',
    categoryAr: 'غسول ومنظفات الجسم',
    stock: 90,
    isActive: true,
    isFeatured: true,
  },
  {
    id: 'prod-firming-booty-lotion',
    slug: 'firming-booty-lotion',
    name: 'Firming Booty Lotion',
    nameAr: 'لوشن شد وصقل البشرة بالببتيدات',
    subtitle: 'Peptide Boosting & Cellulite smoothing',
    subtitleAr: 'تعزيز الببتيدات وتنعيم مظهر السيلوليت',
    description: 'A luxurious restorative body cream enriched with potent multi-peptides, caffeine, and firming botanical lipids. Intensely hydrates, visibly tightens loose skin, and smooths the appearance of cellulite for a firmer, toned, and velvety silhouette.',
    descriptionAr: 'لوشن فاخر لشد وصقل القوام معزز بمركبات الببتيد المتطورة والكافيين ومضادات الأكسدة. يعمل على تحسين مرونة الجلد وشد الترهلات وتقليل ظهور السيلوليت مع ترطيب غني يترك ملمساً ناعماً ومشدوداً.',
    price: 195.0,
    compareAtPrice: 240.0,
    sku: 'TBR-FBL-200',
    image: '/images/firming-booty-lotion.jpg',
    size: '200ml | 6.7 fl. oz.',
    category: 'Lotions & Creams',
    categoryAr: 'كريمات ولوشن الشد',
    stock: 60,
    isActive: true,
    isFeatured: true,
  },
];

export async function getActiveProducts(): Promise<ProductItem[]> {
  try {
    const products = await prisma.product.findMany({
      where: { isActive: true },
      orderBy: { createdAt: 'asc' },
    });

    if (products && products.length > 0) {
      return products as unknown as ProductItem[];
    }
  } catch (error) {
    console.warn('Database query fallback to initial verified products:', error);
  }
  return FALLBACK_PRODUCTS;
}

export async function getProductBySlug(slug: string): Promise<ProductItem | null> {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
    });
    if (product) return product as unknown as ProductItem;
  } catch (error) {
    console.warn('Database query fallback for slug:', error);
  }
  return FALLBACK_PRODUCTS.find((p) => p.slug === slug) || null;
}
