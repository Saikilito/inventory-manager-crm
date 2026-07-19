import { IContext } from '@shared-domain/context/context.entity.js';

export const ContextsStateKind = {
  LOADING: 'contexts:loading',
  LOADED: 'contexts:loaded',
  ERROR: 'contexts:error',
} as const;

export type ContextsStateKind = typeof ContextsStateKind[keyof typeof ContextsStateKind];

export interface ContextsState {
  kind: ContextsStateKind;
  contexts: IContext[];
  selectedContext?: IContext;
  showSlideOver: boolean;
  showDeleteConfirm: boolean;
  errorMessage?: string;
}

export const contextsInitialState: ContextsState = {
  kind: ContextsStateKind.LOADING,
  contexts: [],
  showSlideOver: false,
  showDeleteConfirm: false,
};
