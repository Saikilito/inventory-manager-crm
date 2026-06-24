import { IClient } from '@shared-domain/client/client.entity.js';

export const ClientsStateKind = {
  LOADING: 'clients:loading',
  LOADED: 'clients:loaded',
  RELOADING: 'clients:reloading',
  ERROR: 'clients:error',
} as const;

export type ClientsStateKind = typeof ClientsStateKind[keyof typeof ClientsStateKind];

export interface CommonClientsState {
  currentPage: number;
  totalClients: number;
  limit: number;
  sellerId: string;
}

export interface LoadingClientsState {
  kind: typeof ClientsStateKind.LOADING;
}

export interface LoadedClientsState {
  kind: typeof ClientsStateKind.LOADED;
  clients: IClient[];
}

export interface ReloadingClientsState {
  kind: typeof ClientsStateKind.RELOADING;
  clients: IClient[];
}

export interface ErrorClientsState {
  kind: typeof ClientsStateKind.ERROR;
  errorMessage: string;
}

export type ClientsState = (
  | LoadingClientsState
  | LoadedClientsState
  | ReloadingClientsState
  | ErrorClientsState
) & CommonClientsState;

export const clientsInitialState: ClientsState = {
  kind: ClientsStateKind.LOADING,
  currentPage: 1,
  totalClients: 0,
  limit: 8,
  sellerId: '',
};
