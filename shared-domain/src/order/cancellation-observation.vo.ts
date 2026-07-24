import { Result } from '../shared/result.js';
import { ValidationError, createValidationError } from '../shared/validation-error.js';

export const validateCancellationObservation = (observation: string | undefined): Result<string, ValidationError> => {
  if (!observation) {
    return Result.ok(undefined as unknown as string);
  }

  const trimmed = observation.trim();
  if (trimmed.length < 10) {
    return Result.fail(createValidationError('Observation must be at least 10 characters long'));
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
      createValidationError('An observation is required to cancel the order (minimum 10 characters)'),
    );
  }

  return Result.ok(observation.trim());
};
