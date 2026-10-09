export function formatPrice(amount: number, locale: 'ar' | 'en' = 'ar'): string {
  const formatted = amount.toFixed(2);
  if (locale === 'ar') {
    return `${formatted} ر.س`;
  }
  return `${formatted} SAR`;
}
