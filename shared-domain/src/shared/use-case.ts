import { DomainError } from './errors.js';
import { Result } from './result.js';

export type UseCase<Input, Output, Errors extends DomainError> = (
  input: Input,
) => Promise<Result<Output, Errors>>;
