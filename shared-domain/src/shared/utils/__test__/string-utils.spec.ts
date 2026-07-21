import { describe, it, expect } from 'vitest';
import { toCamelCase, escapeRegExp } from '../string-utils.js';

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

  describe('escapeRegExp', () => {
    it('should escape regex metacharacters so they match literally', () => {
      expect(escapeRegExp('.*')).toBe('\\.\\*');
      expect(escapeRegExp('a+b')).toBe('a\\+b');
      expect(escapeRegExp('(foo|bar)')).toBe('\\(foo\\|bar\\)');
    });

    it('should escape the full set of regex special characters', () => {
      expect(escapeRegExp('\\^$.*+?()[]{}|')).toBe(
        '\\\\\\^\\$\\.\\*\\+\\?\\(\\)\\[\\]\\{\\}\\|',
      );
    });

    it('should return empty string for empty input', () => {
      expect(escapeRegExp('')).toBe('');
    });

    it('should leave plain alphanumerics untouched', () => {
      expect(escapeRegExp('hello world 123')).toBe('hello world 123');
    });

    it('should prevent injection of alternation / quantifier operators', () => {
      // Without escaping, .{0,9999} would match almost any document.
      expect(escapeRegExp('.{0,9999}')).toBe('\\.\\{0,9999\\}');
    });
  });
});
