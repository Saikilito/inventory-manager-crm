import { describe, it, expect } from 'vitest';
import {
  validateCancellationObservation,
  validateCancellationObservationForStatus,
} from '../cancellation-observation.vo.js';
import { ValidationError } from '../../shared/validation-error.js';

describe('CancellationObservationVO', () => {
  describe('validateCancellationObservation', () => {
    it('should return ok for observation with 10+ characters', () => {
      const result = validateCancellationObservation('Producto defectuoso, cliente solicita reembolso');
      expect(result.isFailure).toBe(false);
    });

    it('should return ok for observation with exactly 10 characters', () => {
      const result = validateCancellationObservation('1234567890');
      expect(result.isFailure).toBe(false);
    });

    it('should return fail for observation with less than 10 characters', () => {
      const result = validateCancellationObservation('corto');
      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.getError()).toBeInstanceOf(ValidationError);
        expect(result.getError().message).toContain('10 characters');
      }
    });

    it('should return ok for empty observation (valid for non-CANCELLED)', () => {
      const result = validateCancellationObservation(undefined);
      expect(result.isFailure).toBe(false);
    });

    it('should trim whitespace and count trimmed characters', () => {
      // trimmed length < 10 = too short
      const result = validateCancellationObservation('   a b c   ');
      expect(result.isFailure).toBe(true);
    });

    it('should return ok for 10 non-whitespace chars with spaces', () => {
      const result = validateCancellationObservation('a b c d e f g h i j');
      expect(result.isFailure).toBe(false);
    });
  });

  describe('validateCancellationObservationForStatus', () => {
    it('should return ok for non-CANCELLED status without observation', () => {
      const result = validateCancellationObservationForStatus(undefined, 'ACTIVE');
      expect(result.isFailure).toBe(false);
    });

    it('should return fail for CANCELLED status without observation', () => {
      const result = validateCancellationObservationForStatus(undefined, 'CANCELLED');
      expect(result.isFailure).toBe(true);
      if (result.isFailure) {
        expect(result.getError()).toBeInstanceOf(ValidationError);
        expect(result.getError().message).toContain('cancel');
      }
    });

    it('should return fail for CANCELLED status with short observation', () => {
      const result = validateCancellationObservationForStatus('corto', 'CANCELLED');
      expect(result.isFailure).toBe(true);
    });

    it('should return ok for CANCELLED status with valid observation', () => {
      const result = validateCancellationObservationForStatus(
        'Producto defectuoso, cliente solicita reembolso',
        'CANCELLED'
      );
      expect(result.isFailure).toBe(false);
    });

    it('should return trimmed observation on success', () => {
      const result = validateCancellationObservationForStatus(
        '   valid observation   ',
        'CANCELLED'
      );
      expect(result.isFailure).toBe(false);
      if (!result.isFailure) {
        expect(result.getValue()).toBe('valid observation');
      }
    });
  });
});
