import { Result } from './result.js';

type Callback<T> = () => Promise<T>;

export const doTryResult = async <T, E>(
  cb: Callback<T>,
  errorCallback: (e: Error) => E,
): Promise<Result<T, E>> => {
  try {
    const result = await cb();
    return Result.ok(result);
  } catch (error) {
    return Result.fail(errorCallback(error as Error));
  }
};
