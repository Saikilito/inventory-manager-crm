import { describe, it, expect } from 'vitest';
import { CurrencyVO, SupportedCurrency } from '../currency.vo.js';
import { ValidationError } from '../../validation-error.js';

describe('CurrencyVO', () => {
  describe('validation', () => {
    it('should successfully validate valid currency codes', () => {
      const usdResult = CurrencyVO.createResult('USD');
      expect(usdResult.isFailure).toBe(false);
      expect(usdResult.getValue()).toBe(SupportedCurrency.USD);

      const vesResult = CurrencyVO.createResult('VES');
      expect(vesResult.isFailure).toBe(false);
      expect(vesResult.getValue()).toBe(SupportedCurrency.VES);
    });

    it('should handle case-insensitivity and trim whitespaces', () => {
      const usdMixed = CurrencyVO.createResult('  uSd  ');
      expect(usdMixed.isFailure).toBe(false);
      expect(usdMixed.getValue()).toBe(SupportedCurrency.USD);

      const vesMixed = CurrencyVO.createResult('  vEs  ');
      expect(vesMixed.isFailure).toBe(false);
      expect(vesMixed.getValue()).toBe(SupportedCurrency.VES);
    });

    it('should fail for unsupported currency codes', () => {
      const eurResult = CurrencyVO.createResult('EUR');
      expect(eurResult.isFailure).toBe(true);
      expect(eurResult.getError()).toBeInstanceOf(ValidationError);

      const mxnResult = CurrencyVO.createResult('MXN');
      expect(mxnResult.isFailure).toBe(true);

      const cadResult = CurrencyVO.createResult('CAD');
      expect(cadResult.isFailure).toBe(true);
    });

    it('should throw an error on create if invalid', () => {
      expect(() => CurrencyVO.create('EUR')).toThrow(ValidationError);
    });

    it('should return value on create if valid', () => {
      const val = CurrencyVO.create('usd');
      expect(val).toBe(SupportedCurrency.USD);
    });
  });

  describe('formatting', () => {
    it('should format USD using en-US locale by default', () => {
      expect(CurrencyVO.format(18500)).toBe('$18,500.00');
    });

    it('should format USD explicitly', () => {
      expect(CurrencyVO.format(18500, SupportedCurrency.USD)).toBe('$18,500.00');
    });

    it('should format VES using es-VE locale', () => {
      const formatted = CurrencyVO.format(18500, SupportedCurrency.VES);
      // Env-independent assertion since ICU formatting spacing can vary across systems
      expect(formatted).toMatch(/(Bs|VES).*18\.500,00/);
    });

    it('should preserve negative signs', () => {
      expect(CurrencyVO.format(-150, SupportedCurrency.USD)).toBe('-$150.00');
    });
  });
});
