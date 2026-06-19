declare const __brand__: unique symbol;
declare const __type__: unique symbol;

export type Opaque<T, TBrand extends string> = T & {
  readonly [__brand__]: TBrand;
  readonly [__type__]: T;
};

export type WidenOpaque<T> =
  T extends Opaque<infer U, string>
    ? WidenOpaque<U>
    : T extends object
      ? T extends (infer Item)[]
        ? Array<WidenOpaque<Item>>
        : { [K in keyof T]: WidenOpaque<T[K]> }
      : T;
