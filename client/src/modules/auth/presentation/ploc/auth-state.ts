import { IUser } from '@shared-domain/user/user.entity.js';

export const AuthStateKind = {
  INITIAL: 'auth:initial',
  AUTHENTICATING: 'auth:authenticating',
  AUTHENTICATED: 'auth:authenticated',
  UNAUTHENTICATED: 'auth:unauthenticated',
  REGISTERING: 'auth:registering',
  ERROR: 'auth:error',
} as const;

export type AuthStateKind = typeof AuthStateKind[keyof typeof AuthStateKind];

export interface CommonAuthState {
  errorMessage?: string;
}

export interface InitialAuthState {
  kind: typeof AuthStateKind.INITIAL;
}

export interface AuthenticatingState {
  kind: typeof AuthStateKind.AUTHENTICATING;
}

export interface AuthenticatedState {
  kind: typeof AuthStateKind.AUTHENTICATED;
  user: IUser;
}

export interface UnauthenticatedState {
  kind: typeof AuthStateKind.UNAUTHENTICATED;
}

export interface RegisteringState {
  kind: typeof AuthStateKind.REGISTERING;
}

export interface AuthErrorState {
  kind: typeof AuthStateKind.ERROR;
  errorMessage: string;
}

export type AuthState = (
  | InitialAuthState
  | AuthenticatingState
  | AuthenticatedState
  | UnauthenticatedState
  | RegisteringState
  | AuthErrorState
) & CommonAuthState;

export const authInitialState: AuthState = {
  kind: AuthStateKind.INITIAL,
};
