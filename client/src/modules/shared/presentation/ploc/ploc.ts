type Subscription<S> = (state: S) => void;

export interface Ploc<S> {
  state: () => S;
  changeState: (newStateOrFn: S | ((currentState: S) => S)) => void;
  subscribe: (listener: Subscription<S>) => void;
  unsubscribe: (listener: Subscription<S>) => void;
}

export function makePloc<S>(initialState: S): Ploc<S> {
  let internalState: S = initialState;
  const listeners: Subscription<S>[] = [];

  return {
    state: () => internalState,

    changeState: (newStateOrFn) => {
      internalState = typeof newStateOrFn === 'function'
        ? (newStateOrFn as (currentState: S) => S)(internalState)
        : newStateOrFn;
      listeners.forEach((l) => l(internalState));
    },

    subscribe: (l) => {
      listeners.push(l);
    },

    unsubscribe: (l) => {
      const index = listeners.indexOf(l);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    },
  };
}

export interface PlocSaveState {
  isSaving: boolean;
  errorMessage?: string;
}

export interface ExecutePlocSaveOptions<
  S extends PlocSaveState,
  R extends { isFailure: boolean; getError: () => { message?: string } }
> {
  ploc: Ploc<S>;
  saveFn: () => Promise<R>;
  onSuccess: (result: R) => void | Promise<void>;
  modalResetFields?: Partial<S>;
  defaultErrorMessage?: string;
}

export async function executePlocSave<
  S extends PlocSaveState,
  R extends { isFailure: boolean; getError: () => { message?: string } }
>(options: ExecutePlocSaveOptions<S, R>): Promise<boolean> {
  const { ploc, saveFn, onSuccess, modalResetFields, defaultErrorMessage = 'Error saving' } = options;

  ploc.changeState((current) => ({
    ...current,
    isSaving: true,
    errorMessage: undefined,
  }));

  const result = await saveFn();

  if (result.isFailure) {
    ploc.changeState((current) => ({
      ...current,
      isSaving: false,
      errorMessage: result.getError().message || defaultErrorMessage,
    }));
    return false;
  }

  ploc.changeState((current) => ({
    ...current,
    isSaving: false,
    errorMessage: undefined,
    ...modalResetFields,
  }));

  await onSuccess(result);
  return true;
}
