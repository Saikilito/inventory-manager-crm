import { Result } from './result.js';

export class ResultComposer<Context extends Record<string, any> = {}> {
  private steps: Array<{
    key: string;
    fn: (ctx: Context) => any;
  }> = [];

  private constructor(steps: Array<{ key: string; fn: (ctx: Context) => any }> = []) {
    this.steps = steps;
  }

  public static start(): ResultComposer<{}> {
    return new ResultComposer<{}>();
  }

  public useResult<Key extends string, Val, Err>(
    key: Key,
    resultOrPromiseOrFn:
      | Result<Val, Err>
      | Promise<Result<Val, Err>>
      | ((ctx: Context) => Result<Val, Err>)
      | ((ctx: Context) => Promise<Result<Val, Err>>)
  ): ResultComposer<Context & Record<Key, Val>> {
    const fn = (ctx: Context) => {
      if (typeof resultOrPromiseOrFn === 'function') {
        return (resultOrPromiseOrFn as Function)(ctx);
      }
      return resultOrPromiseOrFn;
    };

    return new ResultComposer<Context & Record<Key, Val>>([
      ...this.steps,
      { key, fn },
    ] as any);
  }

  public async run(): Promise<Result<Context, any>> {
    const context = {} as Context;

    for (const step of this.steps) {
      try {
        let res = step.fn(context);
        if (res instanceof Promise) {
          res = await res;
        }

        if (!(res instanceof Result)) {
          return Result.fail(new Error(`Step ${step.key} did not return a Result instance.`));
        }

        if (res.isFailure) {
          return Result.fail(res.getError());
        }

        (context as any)[step.key] = res.getValue();
      } catch (err) {
        return Result.fail(err instanceof Error ? err : new Error(String(err)));
      }
    }

    return Result.ok(context);
  }
}
