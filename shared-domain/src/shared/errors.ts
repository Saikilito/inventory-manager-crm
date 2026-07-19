export class DomainError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DomainError';
  }
}

export class NotFoundError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'ConflictError';
  }
}

export class DatabaseError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'DatabaseError';
  }
}

export class UnauthorizedError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'UnauthorizedError';
  }
}

export class SchemaIntegrityError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'SchemaIntegrityError';
  }
}

export class ContextInUseError extends DomainError {
  constructor(message: string) {
    super(message);
    this.name = 'ContextInUseError';
  }
}
