export class DomainError extends Error {
  constructor(message: string, name = 'DomainError') {
    super(message);
    this.name = name;
  }
}

export const createDomainError = (message: string, name = 'DomainError'): DomainError => {
  const error = new Error(message) as DomainError;
  error.name = name;
  return error;
};

export const isDomainError = (error: unknown): error is DomainError => {
  return error instanceof Error && !!error.name && error.name.endsWith('Error');
};

export class NotFoundError extends DomainError {
  constructor(message: string) {
    super(message, 'NotFoundError');
  }
}

export const createNotFoundError = (message: string): NotFoundError => {
  return new NotFoundError(message);
}

export class DatabaseError extends DomainError {
  constructor(message: string) {
    super(message, 'DatabaseError');
  }
}

export const createDatabaseError = (message: string): DatabaseError => {
  return new DatabaseError(message);
}

export class SchemaIntegrityError extends DomainError {
  constructor(message: string) {
    super(message, 'SchemaIntegrityError');
  }
}

export const createSchemaIntegrityError = (message: string): SchemaIntegrityError => {
  return new SchemaIntegrityError(message);
}

export class ContextInUseError extends DomainError {
  constructor(message: string) {
    super(message, 'ContextInUseError');
  }
}

export const createContextInUseError = (message: string): ContextInUseError => {
  return new ContextInUseError(message);
}

export class FinancialIntegrationError extends DomainError {
  constructor(message: string, name = 'FinancialIntegrationError') {
    super(message, name);
  }
}

export class ReconciliationError extends FinancialIntegrationError {
  constructor(message: string) {
    super(message, 'ReconciliationError');
  }
}

export const createReconciliationError = (message: string): ReconciliationError => {
  return new ReconciliationError(message);
}


export class ValidationError extends DomainError {
  constructor(message: string) {
    super(message, 'ValidationError');
  }
}

export const createValidationError = (message: string): ValidationError => {
  return new ValidationError(message);
}
