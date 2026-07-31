import { describe, it, expect } from 'vitest';
import { escapeRegExp } from '../string-utils.js';

describe('string-utils', () => {
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
