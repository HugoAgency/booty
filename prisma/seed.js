const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

const initialProducts = [
  {
    slug: 'lightening-intimate-gel',
    name: 'Lightening Intimate Gel',
    nameAr: 'جل تفتيح المناطق الحساسة',
    subtitle: 'Advanced brightening & color correcting',
    subtitleAr: 'تفتيح متطور وتوحيد متقن للون البشرة',
    description: 'An advanced, ultra-gentle brightening formula crafted specifically for delicate areas. Infused with natural botanical extracts, niacinamide, and soothing antioxidants to effectively diminish dark spots, correct hyperpigmentation, and restore natural skin luminosity without irritation.',
    descriptionAr: 'تركيبة متطورة وفائقة اللطف مصممة خصيصاً للمناطق الحساسة. غنية بمستخلصات نباتية طبيعية والنياسيناميد ومضادات الأكسدة المهدئة لتقليل التصبغات والبقع الداكنة وتوحيد لون البشرة واستعادة إشراقتها الطبيعية بكل أمان.',
    price: 35.0,
    compareAtPrice: 42.0,
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
    slug: 'clarifying-booty-cleanser',
    name: 'Clarifying Booty Cleanser',
    nameAr: 'غسول منقي ومقشر للبشرة',
    subtitle: 'Pore refining & skin perfecting',
    subtitleAr: 'تنقية المسام وصقل ملمس البشرة بعمق',
    description: 'A targeted purifying cleanser designed to eliminate friction bumps, clear congested pores, and gently exfoliate rough patches. Formulated with gentle AHAs/BHAs and tea tree water to leave your skin feeling remarkably clean, smooth, and refreshed.',
    descriptionAr: 'غسول علاجي فاخر ومنقي للمسام مصمم للتخلص من الحبوب والبثور الناتجة عن الاحتكاك، وتنقية المسام المسدودة وتقشير خلايا الجلد الميتة بلطف، ليمنح البشرة نعومة فائقة ونقاءً منعشاً.',
    price: 28.0,
    compareAtPrice: 34.0,
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
    slug: 'firming-booty-lotion',
    name: 'Firming Booty Lotion',
    nameAr: 'لوشن شد وصقل البشرة بالببتيدات',
    subtitle: 'Peptide Boosting & Cellulite smoothing',
    subtitleAr: 'تعزيز الببتيدات وتنعيم مظهر السيلوليت',
    description: 'A luxurious restorative body cream enriched with potent multi-peptides, caffeine, and firming botanical lipids. Intensely hydrates, visibly tightens loose skin, and smooths the appearance of cellulite for a firmer, toned, and velvety silhouette.',
    descriptionAr: 'لوشن فاخر لشد وصقل القوام معزز بمركبات الببتيد المتطورة والكافيين ومضادات الأكسدة. يعمل على تحسين مرونة الجلد وشد الترهلات وتقليل ظهور السيلوليت مع ترطيب غني يترك ملمساً ناعماً ومشدوداً.',
    price: 38.0,
    compareAtPrice: 46.0,
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

async function main() {
  console.log('Seeding products and admin user (Jordan / JOD)...');

  for (const product of initialProducts) {
    await prisma.product.upsert({
      where: { slug: product.slug },
      update: product,
      create: product,
    });
    console.log(`Product upserted: ${product.name} (${product.price} JOD)`);
  }

  const adminUsername = process.env.ADMIN_DEFAULT_USERNAME || 'admin';
  const adminPassword = process.env.ADMIN_DEFAULT_PASSWORD || 'Admin@Booty2026!';
  const passwordHash = await bcrypt.hash(adminPassword, 12);

  await prisma.adminUser.upsert({
    where: { username: adminUsername },
    update: { passwordHash },
    create: {
      username: adminUsername,
      passwordHash,
      name: 'System Administrator',
      role: 'ADMIN',
    },
  });
  console.log(`Admin user upserted: ${adminUsername}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
