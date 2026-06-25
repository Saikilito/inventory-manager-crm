import { Result } from '../result.js';
import { Opaque } from '../opaque.js';
import { ValidationError } from '../validation-error.js';

export const SupportedCurrency = {
  USD: 'USD',
  VES: 'VES',
} as const;

export type SupportedCurrency = typeof SupportedCurrency[keyof typeof SupportedCurrency];

export type Currency = Opaque<SupportedCurrency, 'Currency'>;

export const CurrencyVO = {
  create: (value: string): Currency => {
    const result = CurrencyVO.createResult(value);
    if (result.isFailure) {
      throw result.getError();
    }
    return result.getValue();
  },

  createResult: (value: string): Result<Currency, ValidationError> => {
    if (!value || typeof value !== 'string') {
      return Result.fail(new ValidationError('Currency code must be a non-empty string'));
    }
    const normalized = value.trim().toUpperCase();
    if (normalized !== SupportedCurrency.USD && normalized !== SupportedCurrency.VES) {
      return Result.fail(new ValidationError(`Unsupported currency: ${normalized}`));
    }
    return Result.ok(normalized as Currency);
  },

  format: (value: number, currency?: SupportedCurrency): string => {
    const selected = currency ?? SupportedCurrency.USD;
    const locale = selected === SupportedCurrency.VES ? 'es-VE' : 'en-US';
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: selected,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  },
};
