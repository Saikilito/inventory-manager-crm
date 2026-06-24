import { makePloc, Ploc } from '@modules/shared/presentation/ploc/ploc';
import { authInitialState, AuthState, AuthStateKind } from './auth-state';
import { LoginUseCase } from '@modules/auth/application/use-cases/login';
import { RegisterUseCase } from '@modules/auth/application/use-cases/register';
import { GetCurrentUserUseCase } from '@modules/auth/application/use-cases/get-current-user';
import { LogoutUseCase } from '@modules/auth/application/use-cases/logout';
import { makeUser } from '@shared-domain/user/user.entity';

export interface AuthPloc extends Ploc<AuthState> {
  checkSession(): Promise<void>;
  login(email: string, password: string): Promise<void>;
  register(name: string, email: string, password: string, role: string): Promise<void>;
  logout(): Promise<void>;
}

export function makeAuthPloc(
  loginUseCase: LoginUseCase,
  registerUseCase: RegisterUseCase,
  getCurrentUserUseCase: GetCurrentUserUseCase,
  logoutUseCase: LogoutUseCase
): AuthPloc {
  const ploc = makePloc<AuthState>(authInitialState);

  const checkSession = async () => {
    ploc.changeState({ kind: AuthStateKind.AUTHENTICATING });
    const result = await getCurrentUserUseCase.execute();

    if (result.isFailure) {
      ploc.changeState({ kind: AuthStateKind.UNAUTHENTICATED });
    } else {
      const user = result.getValue();
      if (user) {
        ploc.changeState({ kind: AuthStateKind.AUTHENTICATED, user });
      } else {
        ploc.changeState({ kind: AuthStateKind.UNAUTHENTICATED });
      }
    }
  };

  const login = async (email: string, password: string) => {
    ploc.changeState({ kind: AuthStateKind.AUTHENTICATING });
    const result = await loginUseCase.execute(email, password);

    if (result.isFailure) {
      const error = result.getError();
      ploc.changeState({
        kind: AuthStateKind.ERROR,
        errorMessage: error.message || 'Error de autenticación',
      });
    } else {
      await checkSession();
    }
  };

  const register = async (name: string, email: string, password: string, role: string) => {
    ploc.changeState({ kind: AuthStateKind.REGISTERING });
    
    try {
      const userDomainModel = makeUser({ name, email, password, role });
      const result = await registerUseCase.execute(userDomainModel);

      if (result.isFailure) {
        ploc.changeState({
          kind: AuthStateKind.ERROR,
          errorMessage: result.getError().message || 'Error de registro',
        });
      } else {
        // Registration success redirects or clears state
        ploc.changeState({ kind: AuthStateKind.UNAUTHENTICATED });
      }
    } catch (e: any) {
      ploc.changeState({
        kind: AuthStateKind.ERROR,
        errorMessage: e.message || 'Error de Validación de Dominio',
      });
    }
  };

  const logout = async () => {
    ploc.changeState({ kind: AuthStateKind.AUTHENTICATING });
    await logoutUseCase.execute();
    ploc.changeState({ kind: AuthStateKind.UNAUTHENTICATED });
  };

  return {
    ...ploc,
    checkSession,
    login,
    register,
    logout,
  };
}
