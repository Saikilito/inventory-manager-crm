import { z } from 'zod';

export const CancellationObservationSchema = z
  .string()
  .min(1, 'La observación no puede estar vacía')
  .refine(
    (val) => val.replace(/\s/g, '').length >= 10,
    'La observación debe tener al menos 10 caracteres (sin contar espacios)',
  );

export interface ValidationResult {
  isValid: boolean;
  error?: string;
  trimmedValue?: string;
}

export const getCharacterCount = (value: string): number => {
  return value.replace(/\s/g, '').length;
};

export const validateCancellationObservation = (observation: string | undefined): ValidationResult => {
  // Empty/undefined is invalid
  if (!observation || observation.trim().length === 0) {
    return {
      isValid: false,
      error: 'La observación no puede estar vacía',
    };
  }

  const trimmed = observation.trim();
  const nonWhitespaceCount = getCharacterCount(trimmed);

  if (nonWhitespaceCount < 10) {
    return {
      isValid: false,
      error: 'La observación debe tener al menos 10 caracteres (sin contar espacios)',
    };
  }

  return {
    isValid: true,
    trimmedValue: trimmed,
  };
};

export const validateCancellationObservationForCancellation = (observation: string | undefined): ValidationResult => {
  if (!observation || observation.trim().length === 0) {
    return {
      isValid: false,
      error: 'Se requiere una observación para cancelar la orden (mínimo 10 caracteres sin espacios)',
    };
  }

  const trimmed = observation.trim();
  const nonWhitespaceCount = getCharacterCount(trimmed);

  if (nonWhitespaceCount < 10) {
    return {
      isValid: false,
      error: 'La observación debe tener al menos 10 caracteres (sin contar espacios)',
    };
  }

  return {
    isValid: true,
    trimmedValue: trimmed,
  };
};

export const getCancellationObservationError = (
  observation: string | undefined,
  isCancellation: boolean,
): string | undefined => {
  if (!isCancellation) {
    return undefined;
  }

  const result = validateCancellationObservationForCancellation(observation);
  return result.isValid ? undefined : result.error;
};
