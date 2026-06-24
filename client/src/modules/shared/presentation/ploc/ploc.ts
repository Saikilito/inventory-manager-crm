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
