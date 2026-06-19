import { DomainError } from './errors.js';

export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}
