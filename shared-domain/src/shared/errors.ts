export interface DomainError extends Error {
  name: string;
}

export const createDomainError = (message: string, name = 'DomainError'): DomainError => {
  const error = new Error(message) as DomainError;
  error.name = name;
  return error;
};

export const isDomainError = (error: unknown): error is DomainError => {
  return error instanceof Error && !!error.name && error.name.endsWith('Error');
};

export interface NotFoundError extends DomainError {
  name: 'NotFoundError';
}

export const createNotFoundError = (message: string): NotFoundError => {
  return createDomainError(message, 'NotFoundError') as NotFoundError;
}

export interface ConflictError extends DomainError {
  name: 'ConflictError';
}

export const createConflictError = (message: string): ConflictError => {
  return createDomainError(message, 'ConflictError') as ConflictError;
}

export interface DatabaseError extends DomainError {
  name: 'DatabaseError';
}

export const createDatabaseError = (message: string): DatabaseError => {
  return createDomainError(message, 'DatabaseError') as DatabaseError;
}

export interface UnauthorizedError extends DomainError {
  name: 'UnauthorizedError';
}

export const createUnauthorizedError = (message: string): UnauthorizedError => {
  return createDomainError(message, 'UnauthorizedError') as UnauthorizedError;
}

export interface SchemaIntegrityError extends DomainError {
  name: 'SchemaIntegrityError';
}

export const createSchemaIntegrityError = (message: string): SchemaIntegrityError => {
  return createDomainError(message, 'SchemaIntegrityError') as SchemaIntegrityError;
}

export interface ContextInUseError extends DomainError {
  name: 'ContextInUseError';
}

export const createContextInUseError = (message: string): ContextInUseError => {
  return createDomainError(message, 'ContextInUseError') as ContextInUseError;
}

export interface FinancialIntegrationError extends DomainError {
  name: 'FinancialIntegrationError';
}

export const createFinancialIntegrationError = (message: string): FinancialIntegrationError => {
  return createDomainError(message, 'FinancialIntegrationError') as FinancialIntegrationError;
}

export interface TransactionExistsError extends FinancialIntegrationError {
  name: 'TransactionExistsError';
}

export const createTransactionExistsError = (source: string, referenceId: string): TransactionExistsError => {
  return createDomainError(`Transaction already exists for ${source}:${referenceId}`, 'TransactionExistsError') as TransactionExistsError;
}

export interface ReconciliationError extends FinancialIntegrationError {
  name: 'ReconciliationError';
}

export const createReconciliationError = (message: string): ReconciliationError => {
  return createDomainError(message, 'ReconciliationError') as ReconciliationError;
}
