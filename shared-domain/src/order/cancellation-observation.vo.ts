import { z } from 'zod';
import { Result } from '../shared/result.js';
import { ValidationError } from '../shared/validation-error.js';

export const CancellationObservationSchema = z
  .string()
  .min(1, 'La observación no puede estar vacía')
  .refine((val) => val.trim().length >= 10, 'La observación debe tener al menos 10 caracteres sin espacios');

export const validateCancellationObservation = (observation: string | undefined): Result<string, ValidationError> => {
  if (!observation) {
    return Result.ok(undefined as unknown as string);
  }

  const trimmed = observation.trim();
  if (trimmed.length < 10) {
    return Result.fail(new ValidationError('La observación debe tener al menos 10 caracteres'));
  }

  return Result.ok(trimmed);
};

export const validateCancellationObservationForStatus = (
  observation: string | undefined,
  status: string,
): Result<string | undefined, ValidationError> => {
  if (status !== 'CANCELLED') {
    return Result.ok(observation);
  }

  if (!observation || observation.trim().length < 10) {
    return Result.fail(
      new ValidationError('Se requiere una observación para cancelar la orden (mínimo 10 caracteres)'),
    );
  }

  return Result.ok(observation.trim());
};
