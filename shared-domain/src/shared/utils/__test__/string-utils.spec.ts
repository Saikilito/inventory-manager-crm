import { describe, it, expect } from 'vitest';
import { toCamelCase } from '../string-utils.js';

describe('string-utils', () => {
  describe('toCamelCase', () => {
    it('should convert normal space-separated strings to camelCase', () => {
      expect(toCamelCase('Fabric Type')).toBe('fabricType');
      expect(toCamelCase('fabric type')).toBe('fabricType');
    });

    it('should strip special characters', () => {
      expect(toCamelCase('Item Code # (Primary)')).toBe('itemCodePrimary');
      expect(toCamelCase('Some $ Special @ Characters%')).toBe('someSpecialCharacters');
    });

    it('should handle consecutive spaces and leading/trailing spaces', () => {
      expect(toCamelCase('  fabric   type  ')).toBe('fabricType');
    });

    it('should return empty string for empty, undefined, null, or non-alphanumeric inputs', () => {
      expect(toCamelCase('')).toBe('');
      expect(toCamelCase('#@$')).toBe('');
    });
  });
});
