import { validateCancellationObservation, validateCancellationObservationForCancellation, getCharacterCount } from '../cancellation-observation.validator';

describe('CancellationObservationValidator', () => {
  describe('validateCancellationObservation', () => {
    it('should return valid for observation with 10+ characters', () => {
      const result = validateCancellationObservation('Producto defectuoso, cliente solicita reembolso');
      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('should return valid for observation with exactly 10 non-whitespace characters', () => {
      const result = validateCancellationObservation('1234567890');
      expect(result.isValid).toBe(true);
    });

    it('should return invalid for observation with less than 10 characters', () => {
      const result = validateCancellationObservation('corto');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('La observación debe tener al menos 10 caracteres (sin contar espacios)');
    });

    it('should return invalid for empty observation', () => {
      const result = validateCancellationObservation('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('La observación no puede estar vacía');
    });

    it('should return invalid for whitespace-only observation', () => {
      const result = validateCancellationObservation('          ');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('La observación no puede estar vacía');
    });

    it('should count non-whitespace characters only', () => {
      // 9 non-whitespace chars + spaces
      const result = validateCancellationObservation('a b c d e f g h i');
      expect(result.isValid).toBe(false);
    });

    it('should return valid for 10 non-whitespace chars with spaces', () => {
      // 10 non-whitespace chars + spaces
      const result = validateCancellationObservation('a b c d e f g h i j');
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateCancellationObservationForCancellation', () => {
    it('should return valid when observation provided for CANCELLED status', () => {
      const result = validateCancellationObservationForCancellation('Motivo de cancelación válido');
      expect(result.isValid).toBe(true);
    });

    it('should return invalid when no observation for CANCELLED status', () => {
      const result = validateCancellationObservationForCancellation('');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Se requiere una observación para cancelar la orden (mínimo 10 caracteres sin espacios)');
    });

    it('should return invalid when undefined observation for CANCELLED status', () => {
      const result = validateCancellationObservationForCancellation(undefined);
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('Se requiere una observación para cancelar la orden (mínimo 10 caracteres sin espacios)');
    });

    it('should return invalid for short observation for CANCELLED status', () => {
      const result = validateCancellationObservationForCancellation('corto');
      expect(result.isValid).toBe(false);
      expect(result.error).toBe('La observación debe tener al menos 10 caracteres (sin contar espacios)');
    });
  });

  describe('getCharacterCount', () => {
    it('should count non-whitespace characters correctly', () => {
      expect(getCharacterCount('1234567890')).toBe(10);
      expect(getCharacterCount('1 2 3 4 5 6 7 8 9 0')).toBe(10);
      expect(getCharacterCount('   test123   ')).toBe(7);
    });
  });
});
