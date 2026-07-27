import { Result } from './result.js';

type ComposerContext = Record<string, unknown>;
type ResultFactory<Context extends ComposerContext, Val, Err> =
  | Result<Val, Err>
  | Promise<Result<Val, Err>>
  | ((ctx: Context) => Result<Val, Err>)
  | ((ctx: Context) => Promise<Result<Val, Err>>);

type Step<Context extends ComposerContext> = {
  key: string;
  fn: (ctx: Context) => Result<unknown, unknown> | Promise<Result<unknown, unknown>>;
};

export type ResultComposerInstance<Context extends ComposerContext = Record<never, never>> = {
  useResult<Key extends string, Val, Err>(
    key: Key,
    resultOrPromiseOrFn: ResultFactory<Context, Val, Err>,
  ): ResultComposerInstance<Context & Record<Key, Val>>;
  run<Err = never>(): Promise<Result<Context, Err>>;
  runSync<Err = never>(): Result<Context, Err>;
};

const makeResultComposer = <Context extends ComposerContext = Record<never, never>>(
  steps: Step<ComposerContext>[] = [],
): ResultComposerInstance<Context> => ({
  useResult<Key extends string, Val, Err>(
    key: Key,
    resultOrPromiseOrFn: ResultFactory<Context, Val, Err>,
  ): ResultComposerInstance<Context & Record<Key, Val>> {
    const fn = (ctx: Context): Result<Val, Err> | Promise<Result<Val, Err>> => {
      if (typeof resultOrPromiseOrFn === 'function') {
        return resultOrPromiseOrFn(ctx);
      }

      return resultOrPromiseOrFn;
    };

    return makeResultComposer<Context & Record<Key, Val>>([
      ...steps,
      { key, fn: fn as Step<ComposerContext>['fn'] },
    ]);
  },

  async run<Err = never>(): Promise<Result<Context, Err>> {
    const context: ComposerContext = {};

    for (const step of steps) {
      try {
        let res = step.fn(context);
        if (res instanceof Promise) {
          res = await res;
        }

        if (!(res instanceof Result)) {
          return Result.fail(new Error(`Step ${step.key} did not return a Result instance.`) as Err);
        }

        if (res.isFailure) {
          return Result.fail(res.getError() as Err);
        }

        context[step.key] = res.getValue();
      } catch (err) {
        return Result.fail((err instanceof Error ? err : new Error(String(err))) as Err);
      }
    }

    return Result.ok(context as Context);
  },

  runSync<Err = never>(): Result<Context, Err> {
    const context: ComposerContext = {};

    for (const step of steps) {
      try {
        const res = step.fn(context);
        if (res instanceof Promise) {
          return Result.fail(
            new Error(`Step ${step.key} returned a Promise in runSync(). Use run() instead.`) as Err,
          );
        }

        if (!(res instanceof Result)) {
          return Result.fail(new Error(`Step ${step.key} did not return a Result instance.`) as Err);
        }

        if (res.isFailure) {
          return Result.fail(res.getError() as Err);
        }

        context[step.key] = res.getValue();
      } catch (err) {
        return Result.fail((err instanceof Error ? err : new Error(String(err))) as Err);
      }
    }

    return Result.ok(context as Context);
  },
});

export const ResultComposer = {
  start: (): ResultComposerInstance<Record<never, never>> => makeResultComposer(),
};
