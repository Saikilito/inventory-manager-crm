import { describe, it, expect } from 'vitest';
import { CedulaVO } from '../cedula.vo.js';
import { ValidationError } from '../../validation-error.js';

describe('CedulaVO', () => {
  describe('createResult', () => {
    it('should successfully validate valid Venezuelan cédula formats', () => {
      const validV = CedulaVO.createResult('V-12345678');
      expect(validV.isFailure).toBe(false);
      expect(validV.getValue()).toBe('V-12345678');

      const validE = CedulaVO.createResult('E-87654321');
      expect(validE.isFailure).toBe(false);
      expect(validE.getValue()).toBe('E-87654321');
    });

    it('should return failure for invalid formats', () => {
      const invalidResult = CedulaVO.createResult('12345678');
      expect(invalidResult.isFailure).toBe(true);
      expect(invalidResult.getError()).toBeInstanceOf(ValidationError);
      expect(invalidResult.getError().message).toBe('Invalid Cédula format');
    });
  });

  describe('create', () => {
    it('should return Result.ok with Cedula for valid input without throwing', () => {
      const result = CedulaVO.create('V-12345678');
      expect(result.isFailure).toBe(false);
      expect(result.getValue()).toBe('V-12345678');
    });

    it('should return Result.fail with ValidationError for invalid input without throwing', () => {
      expect(() => {
        const result = CedulaVO.create('invalid-cedula');
        expect(result.isFailure).toBe(true);
        expect(result.getError()).toBeInstanceOf(ValidationError);
      }).not.toThrow();
    });
  });
});
