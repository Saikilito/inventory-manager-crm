import React, { createContext as reactCreateContext, useContext as reactUseContext, ReactNode } from 'react';

export function createContext<T>() {
  const context = reactCreateContext<T | undefined>(undefined);

  function Provider({ ploc, children }: { ploc: T; children: ReactNode }) {
    return React.createElement(context.Provider, { value: ploc }, children);
  }

  function useContext(): T {
    const ctx = reactUseContext(context);
    if (ctx === undefined) {
      throw new Error('PLoC Context not found. Must be inside its corresponding Provider with a value.');
    }
    return ctx;
  }

  return [Provider, useContext] as const;
}
