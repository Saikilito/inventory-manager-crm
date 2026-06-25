import { CurrencyVO, SupportedCurrency } from '@shared-domain/shared/value-objects/currency.vo';

export const formatCurrency = (value: number): string => {
  return CurrencyVO.format(value, SupportedCurrency.USD);
};
