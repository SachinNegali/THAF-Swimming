import type { CurrencyCode } from '@/types/expenses';

const SYMBOLS: Record<CurrencyCode, string> = {
  INR: '\u20B9',
  USD: '$',
  EUR: '\u20AC',
  GBP: '\u00A3',
};

export function currencySymbol(code?: string | null): string {
  if (!code) return '$';
  return SYMBOLS[(code as CurrencyCode) ?? 'USD'] ?? code;
}

export function formatCurrency(
  amount: number | null | undefined,
  code?: string | null,
): string {
  const n = typeof amount === 'number' ? amount : 0;
  const rounded = Math.round(n * 100) / 100;
  const fixed =
    Number.isInteger(rounded) && code !== 'INR'
      ? rounded.toFixed(2)
      : rounded.toLocaleString(undefined, {
          minimumFractionDigits: code === 'INR' && Number.isInteger(rounded) ? 0 : 2,
          maximumFractionDigits: 2,
        });
  return `${currencySymbol(code)}${fixed}`;
}
