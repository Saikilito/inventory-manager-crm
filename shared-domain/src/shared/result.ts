export class Result<T, E> {
  public readonly isFailure: boolean;
  private value?: T;
  private error?: E;

  private constructor(isFailure: boolean, error?: E, value?: T) {
    this.isFailure = isFailure;
    this.value = value;
    this.error = error;
  }

  public static ok<T, E>(value?: T): Result<T, E> {
    return new Result<T, E>(false, undefined, value);
  }

  public static fail<T, E>(error: E): Result<T, E> {
    return new Result<T, E>(true, error);
  }

  public getValue(): T {
    if (this.isFailure) {
      throw new Error('Cannot get the value of a failed result.');
    }
    return this.value as T;
  }

  public getError(): E {
    if (!this.isFailure) {
      throw new Error('Cannot get the error of a successful result.');
    }
    return this.error as E;
  }
}
