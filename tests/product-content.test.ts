import { describe, expect, it } from 'vitest';
import { ProductInputSchema } from '../src/lib/validations';

const product = {
  name: 'Care product', nameAr: 'منتج عناية', description: 'Actual description', descriptionAr: 'وصف المنتج الحقيقي',
  price: 35, sku: 'CONTENT', image: '/images/logo.jpg', category: 'Care', categoryAr: 'عناية', stock: 5,
};

describe('Editable product content', () => {
  it('keeps omitted fields undefined so legacy edits do not erase saved content', () => {
    const parsed = ProductInputSchema.parse(product);
    expect(parsed.howToUse).toBeUndefined();
    expect(parsed.howToUseAr).toBeUndefined();
    expect(parsed.ingredients).toBeUndefined();
    expect(parsed.ingredientsAr).toBeUndefined();
  });
  it('preserves multiline text, trims edges and allows explicit clearing', () => {
    const parsed = ProductInputSchema.parse({ ...product, howToUseAr: '  الخطوة الأولى\nالخطوة الثانية  ',
      howToUse: null, ingredientsAr: '  ', ingredients: '  Ingredient A\nIngredient B  ' });
    expect(parsed).toMatchObject({ howToUseAr: 'الخطوة الأولى\nالخطوة الثانية', howToUse: null,
      ingredientsAr: null, ingredients: 'Ingredient A\nIngredient B' });
  });
  it.each(['howToUse', 'howToUseAr', 'ingredients', 'ingredientsAr'])('rejects overlong %s with a field-specific error', field => {
    const parsed = ProductInputSchema.safeParse({ ...product, [field]: 'x'.repeat(5001) });
    expect(parsed.success).toBe(false);
    if (!parsed.success) expect(parsed.error.issues[0].path).toEqual([field]);
  });
});
