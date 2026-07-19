import { describe, it, expect } from 'vitest';
import { toError, getErrorMessage } from '../error-utils.js';

describe('error-utils', () => {
  describe('toError', () => {
    it('should return the error itself if it is already an Error instance', () => {
      const error = new Error('test message');
      expect(toError(error)).toBe(error);
    });

    it('should convert a string thrown error into a standard Error with that string as message', () => {
      const error = toError('string error');
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('string error');
    });

    it('should convert a null thrown error into a standard Error with message "null"', () => {
      const error = toError(null);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('null');
    });

    it('should convert an object thrown error into a standard Error with message "[object Object]"', () => {
      const error = toError({ code: 500 });
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('[object Object]');
    });

    it('should convert undefined or empty thrown error into standard Error with message "undefined"', () => {
      const error = toError(undefined);
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('undefined');
    });
  });

  describe('getErrorMessage', () => {
    it('should return error.message for standard Error instance', () => {
      const error = new Error('test message');
      expect(getErrorMessage(error)).toBe('test message');
    });

    it('should return String(error) for string thrown error', () => {
      expect(getErrorMessage('string error')).toBe('string error');
    });

    it('should return "null" for null thrown error', () => {
      expect(getErrorMessage(null)).toBe('null');
    });

    it('should return "[object Object]" for object thrown error', () => {
      expect(getErrorMessage({ code: 500 })).toBe('[object Object]');
    });

    it('should return "undefined" for undefined thrown error', () => {
      expect(getErrorMessage(undefined)).toBe('undefined');
    });
  });
});
