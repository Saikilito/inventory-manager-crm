import { DomainError, createDomainError } from './errors.js';

export interface ValidationError extends DomainError {
  name: 'ValidationError';
}

export const createValidationError = (message: string): ValidationError => {
  return createDomainError(message, 'ValidationError') as ValidationError;
};
